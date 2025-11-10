# Frontend Standalone App

A Single-Page Application (SPA) demonstrating **OAuth 2.0 Authorization Code + PKCE** flow for secure SSO authentication without requiring a backend server.

## Overview

This standalone demo shows how modern SPAs can securely implement OAuth 2.0 using **PKCE (Proof Key for Code Exchange)**, the recommended approach for public clients. It authenticates directly with the fake OAuth server (port 3002) without needing the main backend (port 3001).

## Key Features

- **Authorization Code + PKCE Flow**: Industry-standard secure OAuth for SPAs
- **No Backend Required**: PKCE eliminates the need for client secrets
- **Multiple SSO Providers**: Google, Microsoft, Strava, Company SSO
- **CSRF Protection**: State parameter prevents cross-site request forgery
- **PKCE Security**: Code verifier prevents authorization code interception
- **Session Management**: Demonstrates secure token storage patterns
- **Educational Comments**: Extensively documented code explaining each step

## How It Works (PKCE Flow)

1. **Initiation**:
   - User clicks a provider button (e.g., "Sign in with Google")
   - App generates random `state` (CSRF protection)
   - App generates random `code_verifier` (128 chars)
   - App creates `code_challenge = SHA256(code_verifier)`
   - Browser redirects to OAuth server with `code_challenge`

2. **Authorization**:
   - User authenticates on OAuth server
   - OAuth server stores `code_challenge` with authorization code
   - OAuth server redirects back with authorization `code` + `state`

3. **Token Exchange** (✅ fully implemented):
   - App verifies `state` matches (CSRF check)
   - App retrieves stored `code_verifier`
   - App POSTs to OAuth token endpoint with `code` + `code_verifier`
   - OAuth server verifies: `SHA256(code_verifier) === code_challenge`
   - OAuth server returns `access_token`, `id_token`, `refresh_token`

4. **User Info**:
   - App uses `access_token` to call `/userinfo` endpoint
   - Receives actual user profile from OAuth server
   - Displays real user data (not mock data)

5. **Security**:
   - Even if an attacker intercepts the `code`, they can't use it
   - The `code_verifier` only exists in the original client's browser
   - No client secret needed (safe for public clients)
   - Full OAuth 2.0 + PKCE compliance

## PKCE: Why It's Secure

**PKCE (Proof Key for Code Exchange)** solves the authorization code interception problem:

- **Without PKCE**: Attacker intercepts code → Uses code to get tokens ❌
- **With PKCE**: Attacker intercepts code → Can't exchange without verifier ✅

**How PKCE Works**:

1. Client generates random `code_verifier` (stored locally)
2. Client hashes it: `code_challenge = SHA256(code_verifier)`
3. Client sends `code_challenge` to auth server (in authorization request)
4. Auth server stores `code_challenge` with the authorization code
5. Client sends `code_verifier` to auth server (in token request)
6. Auth server verifies: `SHA256(code_verifier) === code_challenge`

This proves the token request comes from the same client that initiated the flow.

## Running the App

### Prerequisites

Make sure the OAuth server is running:

```bash
# From project root
cd oauth-server
npm install
npm run dev
```

The OAuth server should be running on http://localhost:3002

### Start the Demo App

```bash
# From project root
cd frontend-standalone
npm install
npm run dev
```

The app will be available at http://localhost:3003

## Testing the SSO + PKCE Flow

1. Open http://localhost:3003
2. Click any provider button (e.g., "Sign in with Google")
3. **Check browser console** to see PKCE parameters being generated
4. You'll be redirected to the OAuth server (URL contains `code_challenge`)
5. Click "Authorize" on the OAuth consent screen
6. You'll be redirected back with authorization code
7. **Check browser console** to see `code` and `code_verifier` logged
8. See your user info displayed
9. Click "Sign Out" to logout

**Educational Tip**: Open browser DevTools → Console to see the PKCE flow in action!

## Architecture Differences

### Main App (ports 3000/3001) - Traditional Backend Flow

- **Frontend**: React app on port 3000
- **Backend**: Node.js API on port 3001
- **Flow**: Frontend → Backend → OAuth Server → Backend → Frontend
- **Pattern**: Backend-proxied OAuth (client secret used)
- **Tokens**: Backend manages all tokens, stores refresh tokens with SHA-256 hashing
- **Security**: JWT validation, token blacklisting, device tracking, httpOnly cookies

### Frontend Standalone App (port 3003) - Modern SPA Flow

- **Frontend**: React app on port 3003
- **Backend**: None (pure SPA)
- **Flow**: Frontend → OAuth Server → Frontend (with PKCE)
- **Pattern**: Authorization Code + PKCE (no client secret)
- **Tokens**: Would exchange code+verifier directly (simulated in demo)
- **Security**: PKCE prevents code interception, state prevents CSRF

## Production Considerations

### ✅ Authorization Code + PKCE is Production-Ready

This flow (Authorization Code + PKCE) **IS approved for production SPAs**:

- ✅ Recommended by OAuth 2.0 Security Best Current Practice (BCP)
- ✅ Required by OAuth 2.1 specification for public clients
- ✅ Used by Auth0, Okta, Google, Microsoft for SPAs
- ✅ No backend needed (PKCE replaces client secret)

### 🔒 Production Implementation Checklist

When implementing PKCE in production:

1. **Token Storage**:
   - Store access_token in memory (React state/context) - NOT localStorage
   - Store refresh_token in sessionStorage or memory (consider risks)
   - Better: Use Backend-for-Frontend (BFF) pattern for httpOnly cookies

2. **Token Validation**:
   - Always validate id_token (JWT signature, issuer, audience, expiry)
   - Verify nonce if using OpenID Connect
   - Check token expiration before using

3. **Token Refresh**:
   - Implement automatic token refresh with refresh_token
   - Use refresh_token rotation for enhanced security
   - Handle refresh failures gracefully (re-authenticate)

4. **Security Best Practices**:
   - Use short-lived access tokens (5-15 minutes)
   - Implement token revocation on logout
   - Use HTTPS only (never HTTP in production)
   - Validate all OAuth responses

### ⚠️ Alternative: Backend-for-Frontend (BFF)

For highest security, consider BFF pattern:

- Thin backend proxy for OAuth (like main app in this repo)
- Enables httpOnly cookies (XSS-proof)
- Can safely use client secrets
- Adds server-side token validation
- See main app (ports 3000/3001) for BFF example

## Files

- `src/App.tsx`: Main application with OAuth flow implementation and educational comments
- `src/utils/pkce.ts`: PKCE utilities module with cryptographically secure implementations
- `src/index.css`: Styling
- `vite.config.ts`: Vite configuration (port 3003)
- `package.json`: Dependencies
- `README.md`: This file

## Port Configuration

- **Frontend Standalone App (PKCE)**: 3003
- **OAuth Server**: 3002
- **Main Frontend (BFF)**: 3000
- **Main Backend (BFF)**: 3001

## Learning Resources

To understand the complete flow:

1. Read the extensive comments in `src/App.tsx` for the OAuth flow
2. Examine `src/utils/pkce.ts` for PKCE implementation details
3. Open browser console while testing to see PKCE in action
4. Compare with main app's backend-proxied flow (ports 3000/3001)
5. Check OAuth server code to see how it validates PKCE

## Key Takeaways

- **PKCE is the modern standard** for SPAs and mobile apps
- **No backend required** when using PKCE (client secret not needed)
- **Code verifier** proves the token request comes from the same client
- **State parameter** prevents CSRF attacks
- **Production-ready** when following security best practices
- **BFF pattern** (main app) offers highest security but adds complexity
