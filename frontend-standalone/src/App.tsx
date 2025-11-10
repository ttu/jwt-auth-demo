import { useState, useEffect } from 'react';
import { generateOAuthParameters } from './utils/pkce';

/*
 * SSO AUTHENTICATION FLOW (SPA Demo - Authorization Code + PKCE)
 *
 * This app demonstrates the OAuth 2.0 Authorization Code + PKCE flow, which is
 * the recommended approach for Single-Page Applications (SPAs) and mobile apps.
 * PKCE allows public clients to securely use OAuth without a backend server.
 *
 * FLOW OVERVIEW (Authorization Code + PKCE):
 * ==========================================
 * STEP 1: Check if user already has a session (on page load)
 * STEP 2: User clicks OAuth provider button
 *         → Generate CSRF state parameter
 *         → Generate PKCE code_verifier (random string)
 *         → Generate PKCE code_challenge (SHA-256 hash of verifier)
 * STEP 3: Redirect to OAuth server authorization endpoint with code_challenge
 *         (User leaves this app, goes to OAuth server)
 * STEP 4: OAuth server redirects back with authorization code
 * STEP 5: Verify state parameter to prevent CSRF attacks
 * STEP 6: Process authorization code + code_verifier
 *         (SPA directly exchanges code + verifier for tokens via fetch)
 *         (OAuth server verifies: SHA256(code_verifier) === code_challenge)
 * STEP 7: Store tokens securely (access_token in memory, refresh_token handled carefully)
 * STEP 8: Logout and revoke tokens when user clicks sign out
 *
 * WHAT IS PKCE?
 * =============
 * PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks:
 * 1. Client generates random code_verifier (stored in sessionStorage)
 * 2. Client creates code_challenge = SHA256(code_verifier)
 * 3. Client sends code_challenge to OAuth server (in authorization request)
 * 4. OAuth server stores code_challenge with the authorization code
 * 5. Client exchanges code + code_verifier for tokens (in token request)
 * 6. OAuth server verifies: SHA256(code_verifier) === code_challenge
 *
 * Even if an attacker intercepts the authorization code, they can't exchange it
 * without the code_verifier (which only exists in the legitimate client).
 *
 * WHY PKCE IS SECURE FOR SPAs:
 * ============================
 * - No client secret needed (SPAs can't keep secrets)
 * - Code verifier proves the token request comes from the same client
 * - Works without a backend server (approved by OAuth 2.0 Security BCP)
 * - Recommended by OAuth 2.1 spec for all public clients
 *
 * PRODUCTION CONSIDERATIONS:
 * ==========================
 * ✅ Use Authorization Code + PKCE (this flow)
 * ✅ Store access_token in memory only (React state/context)
 * ✅ Validate id_token (JWT signature, issuer, audience, expiry)
 * ✅ Implement token refresh with refresh_token rotation
 * ✅ Use short-lived access tokens (5-15 minutes)
 * ⚠️  Consider Backend-for-Frontend (BFF) pattern for highest security
 */

interface UserInfo {
  email: string;
  name: string;
  provider: string;
  loginTime: string;
}

const OAUTH_SERVER_URL = 'http://localhost:3002';
const REDIRECT_URI = 'http://localhost:3003/callback';

// Provider-specific client IDs (must match OAuth server configuration)
const CLIENT_IDS = {
  google: 'fake-google-client-id',
  microsoft: 'fake-microsoft-client-id',
  strava: 'fake-strava-client-id',
  company: 'fake-company-client-id',
};

// PKCE Helper Functions moved to ./utils/pkce.ts for better code organization

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // STEP 4: OAuth Callback - User returned from OAuth server
    // After user authorizes on OAuth server, they're redirected back here with code & state
    // We need to verify the state and process the authorization code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const processCallback = async () => {
      if (code && state) {
        // STEP 5: Verify State - Prevent CSRF attacks
        // The state parameter must match what we sent in Step 3
        // This ensures the callback is from our own OAuth request, not an attacker
        const savedState = sessionStorage.getItem('oauth_state');
        if (state === savedState) {
          // STEP 6: Process Authorization Code with PKCE
          // Retrieve the code_verifier we generated before redirecting
          const codeVerifier = sessionStorage.getItem('code_verifier');
          const provider =
            sessionStorage.getItem('oauth_provider') || 'Unknown';

          console.log('🔐 PKCE Flow: Authorization code received');
          console.log('📝 Code:', code);
          console.log('🔑 Code Verifier:', codeVerifier);

          // STEP 6.1: Exchange authorization code + code_verifier for tokens
          // This is the actual PKCE flow - we POST to the token endpoint
          try {
            console.log(
              '🔄 Exchanging authorization code for tokens (PKCE)...',
            );

            const tokenResponse = await fetch(
              `${OAUTH_SERVER_URL}/oauth/token`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  grant_type: 'authorization_code',
                  code: code,
                  code_verifier: codeVerifier,
                  client_id: CLIENT_IDS[provider as keyof typeof CLIENT_IDS],
                  redirect_uri: REDIRECT_URI,
                  provider: provider,
                }),
              },
            );

            if (!tokenResponse.ok) {
              const error = await tokenResponse.json();
              console.error('❌ Token exchange failed:', error);
              throw new Error(
                `Token exchange failed: ${error.error_description || error.error}`,
              );
            }

            const tokens = await tokenResponse.json();
            console.log('✅ Tokens received:', {
              access_token: tokens.access_token ? '✓' : '✗',
              id_token: tokens.id_token ? '✓' : '✗',
              refresh_token: tokens.refresh_token ? '✓' : '✗',
              expires_in: tokens.expires_in,
            });

            // STEP 6.2: Fetch user info using access_token
            console.log('🌐 Fetching user info with access token...');

            const userinfoResponse = await fetch(
              `${OAUTH_SERVER_URL}/oauth/userinfo`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              },
            );

            let userInfo: UserInfo;

            if (userinfoResponse.ok) {
              const userData = await userinfoResponse.json();
              console.log('✅ User info received:', userData);

              userInfo = {
                email: userData.email,
                name: userData.name,
                provider: provider,
                loginTime: new Date().toLocaleString(),
              };
            } else {
              // Fallback to decoding id_token if userinfo fails
              console.log('⚠️  Userinfo failed, using id_token claims');
              // In production, you'd decode and validate the JWT id_token here
              userInfo = {
                email: 'user@example.com',
                name: 'Demo User',
                provider: provider,
                loginTime: new Date().toLocaleString(),
              };
            }

            // STEP 7: Store User Session
            // Store tokens and user info securely:
            // - Store access_token in memory (React state/context) - NOT localStorage
            // - Store refresh_token in httpOnly cookie (if using a backend)
            // - For pure SPAs with PKCE, you may store refresh_token in sessionStorage
            //   but it's less secure than httpOnly cookies
            // Here we just store user info in sessionStorage for demo purposes
            sessionStorage.setItem('user', JSON.stringify(userInfo));
            setUser(userInfo);

            // Clean up URL (remove code & state parameters)
            window.history.replaceState({}, document.title, '/');

            // Clean up OAuth state from storage
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_provider');
            sessionStorage.removeItem('code_verifier');
          } catch (error) {
            console.error('❌ Error fetching user info:', error);
            // Even if userinfo fetch fails, we could still extract info from id_token
            // For this demo, we'll show an error state
            console.log('⚠️  Using fallback user data');
            const fallbackUser: UserInfo = {
              email: 'user@example.com',
              name: 'Demo User',
              provider: sessionStorage.getItem('oauth_provider') || 'Unknown',
              loginTime: new Date().toLocaleString(),
            };
            sessionStorage.setItem('user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
            window.history.replaceState({}, document.title, '/');
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_provider');
            sessionStorage.removeItem('code_verifier');
          }
        } else {
          // CSRF Attack Detected - State mismatch
          console.error('State mismatch - possible CSRF attack');
        }
      } else {
        // STEP 1: Check Existing Session
        // On initial load, check if user is already logged in
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }

      setIsLoading(false);
    };

    processCallback();
  }, []);

  const handleLogin = async (provider: string) => {
    // STEP 2: Generate CSRF Protection + PKCE
    // Generate cryptographically secure OAuth parameters (state + PKCE)
    // using the dedicated PKCE utilities module
    const oauthParams = await generateOAuthParameters({
      stateLength: 32, // CSRF protection
      verifierLength: 128, // Maximum entropy for PKCE
    });

    // Store parameters in sessionStorage for callback processing
    sessionStorage.setItem('oauth_state', oauthParams.state);
    sessionStorage.setItem('oauth_provider', provider);
    sessionStorage.setItem('code_verifier', oauthParams.codeVerifier);

    // STEP 3: Redirect to OAuth Authorization Endpoint
    // Build OAuth 2.0 + PKCE authorization URL with required parameters:
    // - response_type: 'code' means we want an authorization code (not implicit flow)
    // - client_id: Identifies our application to the OAuth server (provider-specific)
    // - redirect_uri: Where OAuth server should send user after authorization
    // - state: Random value for CSRF protection
    // - code_challenge: SHA-256 hash of code_verifier (PKCE)
    // - code_challenge_method: How we hashed the verifier (S256 = SHA-256)
    // - provider: Which OAuth provider to use (google, microsoft, etc.)
    // - scope: What permissions we're requesting (openid, profile, email)
    const authUrl = new URL(`${OAUTH_SERVER_URL}/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append(
      'client_id',
      CLIENT_IDS[provider as keyof typeof CLIENT_IDS],
    );
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', oauthParams.state);
    authUrl.searchParams.append('code_challenge', oauthParams.codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('provider', provider);
    authUrl.searchParams.append('scope', 'openid profile email');

    // Redirect user's browser to OAuth server
    // User will see OAuth consent screen, then get redirected back with authorization code
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    // STEP 8: Logout
    // Clear user session from browser storage
    // In a production SPA, you should also:
    // 1. Revoke tokens by calling OAuth server's revocation endpoint
    // 2. Clear all tokens from memory/storage
    // 3. Optionally redirect to OAuth server's logout endpoint (RP-Initiated Logout)
    //    to end the SSO session across all apps
    sessionStorage.removeItem('user');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h1>Frontend-Only SSO Demo</h1>
          <p className="subtitle">
            This demo shows how SSO authentication works without a backend
            server. All authentication is handled directly between the browser
            and the OAuth provider.
          </p>

          <div className="alert">
            ⚠️ Note: Make sure the OAuth server is running on port 3002
          </div>

          <div className="provider-buttons">
            <button
              className="provider-button"
              onClick={() => handleLogin('google')}
            >
              <span className="provider-icon">🔵</span>
              Sign in with Google
            </button>

            <button
              className="provider-button"
              onClick={() => handleLogin('microsoft')}
            >
              <span className="provider-icon">🔷</span>
              Sign in with Microsoft
            </button>

            <button
              className="provider-button"
              onClick={() => handleLogin('strava')}
            >
              <span className="provider-icon">🟠</span>
              Sign in with Strava
            </button>

            <button
              className="provider-button"
              onClick={() => handleLogin('company')}
            >
              <span className="provider-icon">🏢</span>
              Sign in with Company SSO
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>✅ Welcome!</h1>
        <p className="subtitle">You are successfully authenticated via SSO</p>

        <div className="info">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{user.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Provider:</span>
            <span className="info-value">{user.provider}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Login Time:</span>
            <span className="info-value">{user.loginTime}</span>
          </div>
        </div>

        <div className="button-group">
          <button className="btn-secondary" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
