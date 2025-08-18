import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { storeRefreshToken } from '../stores/refreshToken.store';
import { DeviceInfo, RequestWithUser, OAuthUserInfo, OAuthState } from '../types/index';
import { settings } from '../config/settings';
import { encodeState, decodeState } from '../utils/oauth.utils';
import { generateNonce, validateNonce, cleanupNonces } from '../stores/nonce.store';
import { setRefreshTokenCookie } from '../utils/cookie.utils';

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
};

const router = Router();

// In-memory store for OAuth users
const oauthUsers: { [key: string]: OAuthUserInfo } = {};

// OAuth login endpoint
router.get('/oauth/:provider', async (req: RequestWithUser, res) => {
  // debugger; // OAUTH FLOW START - User clicks OAuth provider button, we prepare the authorization URL
  // This route is used to start the OAuth login process.
  // It redirects the user to the OAuth provider's authorization page.
  // - The deviceId is the unique device ID of the user's device.
  const { provider } = req.params;
  const deviceId = req.headers['x-device-id'] as string;

  if (!['google', 'microsoft', 'strava', 'company'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  // Clean up expired nonces
  // TODO: Move to interval
  cleanupNonces();

  // Nonce is used to prevent CSRF attacks and to verify the response from the OAuth provider
  const nonce = generateNonce();

  // State parameter contains device-specific information for session management
  // Note: Some OAuth providers may not support nonce parameters directly.
  // In such cases, the nonce could be embedded within the state parameter
  // to maintain CSRF protection while ensuring provider compatibility.
  const state: OAuthState = {
    deviceId,
    timestamp: Date.now(),
  };

  const encodedState = encodeState(state);

  // debugger; // OAUTH URL CONSTRUCTION - Building the authorization URL with all required parameters
  // At this point we have: provider, deviceId, nonce (CSRF protection), and state (device info)
  // Next: Frontend will redirect user to this OAuth server URL for authentication
  const config = {
    clientId: `fake-${provider}-client-id`,
    redirectUri: `http://localhost:3001/api/auth/callback/${provider}`,
    authorizationEndpoint: 'http://localhost:3002/oauth/authorize',
    scopes: provider === 'strava' ? ['read', 'activity:read'] : ['openid', 'profile', 'email'],
  };

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: encodedState,
    nonce,
    provider,
  });

  const redirectUrl = `${config.authorizationEndpoint}?${params.toString()}`;
  res.json({ redirectUrl });
});

// Handle OAuth callback
router.get('/callback/:provider', async (req: RequestWithUser, res) => {
  // debugger; // OAUTH CALLBACK - User authenticated with OAuth server, now we have authorization code
  // The OAuth server redirected user back here with: authorization code + state parameter
  // Next: We'll exchange the code for access/refresh/ID tokens
  const { provider } = req.params;
  const { code, state: encodedState } = req.query;

  console.log('[OAuth route] OAuth callback received:', { provider, code, encodedState });

  if (!code || !encodedState) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Decode and validate state
  const state = decodeState(encodedState as string);

  // Validate timestamp (1 hour expiration)
  if (Date.now() - state.timestamp > 3600000) {
    return res.status(400).json({ error: 'State parameter expired' });
  }

  try {
    // debugger; // TOKEN EXCHANGE - About to exchange authorization code for OAuth tokens
    // We're sending: code, client credentials, redirect_uri to OAuth server
    // We'll receive: access_token, refresh_token, id_token from OAuth server
    console.log(`[OAuth route] Token exchange request:`, {
      code,
      redirect_uri: `http://localhost:3001/api/auth/callback/${provider}`,
      client_id: `fake-${provider}-client-id`,
      provider,
    });

    const tokenResponse = await fetch('http://localhost:3002/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `http://localhost:3001/api/auth/callback/${provider}`,
        client_id: `fake-${provider}-client-id`,
        client_secret: `fake-${provider}-client-secret`,
        provider,
      }),
    });

    console.log(`[OAuth route] Token exchange response status:`, tokenResponse.status);

    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text();
      console.error(`[${new Date().toISOString()}] Token exchange failed:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        responseText,
      });
      throw new Error(`Failed to exchange code for tokens: ${responseText}`);
    }

    const tokens = (await tokenResponse.json()) as TokenResponse;

    // debugger; // TOKEN VALIDATION - Received OAuth tokens, now validating ID token nonce
    // We have: access_token (for API calls), refresh_token (for renewal), id_token (for identity)
    // Next: Validate nonce in ID token to prevent replay attacks
    if (!tokens.id_token) {
      console.log('[OAuth route] ID token missing');
      return res.status(400).json({ error: 'ID token missing' });
    }

    // Decode and validate ID token
    const idToken = jwt.decode(tokens.id_token) as { nonce?: string };
    if (!idToken.nonce || !validateNonce(idToken.nonce)) {
      console.log('[OAuth route] Nonce validation failed:', { received: idToken.nonce });
      return res.status(400).json({ error: 'Invalid nonce parameter' });
    }

    // Get user info
    console.log(`[OAuth route] Fetching user info with access token`);
    const userInfoResponse = await fetch('http://localhost:3002/oauth/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    console.log(`[OAuth route] User info response status:`, userInfoResponse.status);

    if (!userInfoResponse.ok) {
      const responseText = await userInfoResponse.text();
      console.error(`[${new Date().toISOString()}] User info request failed:`, {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        responseText,
      });
      throw new Error(`Failed to get user info: ${responseText}`);
    }

    const userInfo = (await userInfoResponse.json()) as OAuthUserInfo;
    console.log(`[OAuth route] User info retrieved:`, {
      id: userInfo.id,
      email: userInfo.email,
      provider: userInfo.provider,
    });

    // debugger; // USER INFO RETRIEVED - Got user profile from OAuth server, now creating app tokens
    // We have: user profile (id, email, name) from OAuth provider
    // Next: Generate our own JWT tokens for this user session
    oauthUsers[userInfo.email] = userInfo;

    // Generate application tokens
    const userId = parseInt(userInfo.id.split('-')[1], 10); // Extract the numeric part from the ID
    const accessToken = jwt.sign({ userId, email: userInfo.email }, settings.jwt.accessSecret, {
      expiresIn: settings.jwt.accessTokenExpiry,
    });

    const refreshToken = jwt.sign({ userId, email: userInfo.email }, settings.jwt.refreshSecret, {
      expiresIn: settings.jwt.refreshTokenExpiry,
    });

    // Store refresh token
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'] as string,
      platform: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
      os: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
    };

    // debugger; // SESSION CREATION - Storing refresh token and redirecting to frontend
    // We're creating a device-specific session with refresh token storage
    // Final step: Redirect user to frontend with success status and access token
    storeRefreshToken(refreshToken, userId, state.deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    // Set refresh token cookie using helper
    setRefreshTokenCookie(res, refreshToken);

    // Redirect to frontend with tokens
    res.redirect(`http://localhost:3000/auth/callback?success=true&token=${accessToken}`);
  } catch (error) {
    console.error('[OAuth route] OAuth callback error:', error);
    res.redirect(
      `http://localhost:3000/auth/callback?success=false&error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`
    );
  }
});

export default router;
