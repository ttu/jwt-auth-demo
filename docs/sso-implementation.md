# SSO (Single Sign-On) Implementation for OAuth Server

## Overview

The OAuth server now includes SSO session management, allowing users to authorize once and automatically be approved for subsequent authorization requests from the same provider without needing to re-authorize.

## Architecture

The SSO implementation follows the same patterns and practices used in the backend:

### Key Components

1. **Session Store** (`stores/sso-session.store.ts`)
   - In-memory Map storage for SSO sessions
   - SHA-256 hashing of session IDs (defense-in-depth, same as backend refresh tokens)
   - Session expiration: Configurable (default: 24 hours via `SSO_SESSION_EXPIRY`)
   - Automatic cleanup of expired sessions

2. **Cookie Management** (`utils/cookie.utils.ts`)
   - HTTP-only cookies (false in demo, true in production)
   - Secure flag for production
   - SameSite=strict for CSRF protection
   - Path limited to `/oauth` endpoints

3. **Cleanup Service** (`services/ssoCleanup.ts`)
   - Runs every 5 minutes (same interval as backend token cleanup)
   - Cleans up expired SSO sessions
   - Cleans up expired authorization codes
   - Provides session statistics

## How It Works

### First Authorization (No SSO Session)

1. User clicks OAuth button in app (main or standalone)
2. App redirects to OAuth server `/oauth/authorize`
3. OAuth server checks for SSO session cookie → **Not found**
4. OAuth server displays consent page
5. User clicks "Authorize"
6. OAuth server:
   - Generates authorization code
   - Creates SSO session for user + provider
   - Sets `oauth_sso_session` cookie
   - Redirects back to app with auth code
7. App exchanges auth code for tokens

### Subsequent Authorization (With SSO Session)

1. User clicks OAuth button for **same provider**
2. App redirects to OAuth server `/oauth/authorize`
3. OAuth server checks for SSO session cookie → **Found and valid**
4. OAuth server **automatically approves** (skips consent page):
   - Generates authorization code
   - Updates session last-used timestamp
   - Redirects back to app with auth code immediately
5. App exchanges auth code for tokens

### Cross-Application SSO

Works across both:

- Main app (port 3001) with backend
- Frontend-standalone app (port 3003) pure SPA

If user authorizes in main app, then opens frontend-standalone with same provider → **Auto-approved** ✓

## Data Model

```typescript
export type SSOSession = {
  id: string; // UUID session ID
  userId: string; // Mock user ID from provider
  provider: OAuthProvider; // 'google' | 'microsoft' | 'strava' | 'company'
  createdAt: Date; // Session creation time
  lastUsedAt: Date; // Last access time (updated on each use)
  expiresAt: Date; // Expiration time (configurable via SSO_SESSION_EXPIRY)
  isRevoked: boolean; // Manual revocation flag
};
```

## Security Features

### Following Backend Patterns

1. **SHA-256 Hashed Session IDs**
   - Session IDs are hashed before storage (like refresh tokens)
   - Defense-in-depth: even if store is compromised, raw session IDs not exposed

2. **HTTP-Only Cookies**
   - Cookie not accessible via JavaScript (XSS protection)
   - Set to `false` in demo for debugging (same as backend)
   - Should be `true` in production

3. **SameSite=Strict**
   - Cookie only sent with same-site requests
   - Prevents CSRF attacks

4. **Path Restriction**
   - Cookie path limited to `/oauth`
   - Minimizes exposure surface

5. **Session Expiration**
   - Configurable expiration (default: 24 hours)
   - Automatic cleanup every 5 minutes
   - Expired sessions rejected automatically

## API Endpoints

### Authorization (Auto-SSO)

```http
GET /oauth/authorize
```

- Checks for SSO session cookie
- Auto-approves if valid session for requested provider
- Falls back to consent page if no session

### Logout

```http
POST /oauth/logout
```

- Revokes SSO session
- Clears session cookie
- Response: `{ success: true, message: "Logged out successfully" }`

### Session Status (Debugging)

```http
GET /oauth/session/status
```

Returns:

```json
{
  "authenticated": true,
  "userId": "google-123",
  "provider": "google",
  "createdAt": "2025-11-11T10:00:00.000Z",
  "expiresAt": "2025-11-12T10:00:00.000Z",
  "lastUsedAt": "2025-11-11T10:05:00.000Z"
}
```

### Get All Sessions (Debugging)

```http
GET /oauth/sessions
```

Returns all active sessions for the authenticated user.

### Authorization Denial

```http
POST /oauth/authorize/deny
```

- User clicks "Deny" on consent page
- Redirects back to app with `error=access_denied`

## Configuration

### Cookie Settings

```typescript
const SSO_COOKIE_NAME = 'oauth_sso_session';
// Now configured via config.sso.sessionExpiry (default: 86400 seconds / 24 hours)
```

### Cleanup Interval

```typescript
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
```

## Testing the SSO Flow

### Manual Test

1. Start all services:

   ```bash
   npm run dev
   ```

2. **First Authorization**:
   - Open http://localhost:3000 (main app)
   - Click "Login with Google"
   - Consent page appears → Click "Authorize"
   - Logged in successfully

3. **SSO Test - Same App**:
   - Logout
   - Click "Login with Google" again
   - **No consent page** → Auto-approved → Logged in immediately ✓

4. **SSO Test - Cross App**:
   - While logged in to main app with Google
   - Open http://localhost:3003 (frontend-standalone)
   - Click "Sign in with Google OAuth"
   - **No consent page** → Auto-approved → Logged in immediately ✓

5. **Different Provider**:
   - In frontend-standalone, click "Sign in with Microsoft OAuth"
   - **Consent page appears** (no SSO session for Microsoft yet)
   - After approving, subsequent Microsoft logins will auto-approve ✓

### Check SSO Session

```bash
# Check session status
curl -X GET http://localhost:3002/oauth/session/status \
  --cookie "oauth_sso_session=<session_id>"

# Logout
curl -X POST http://localhost:3002/oauth/logout \
  --cookie "oauth_sso_session=<session_id>"
```

## Comparison with Backend

| Feature       | Backend (Refresh Tokens)       | OAuth Server (SSO Sessions)         |
| ------------- | ------------------------------ | ----------------------------------- |
| **Storage**   | Map with SHA-256 hashed tokens | Map with SHA-256 hashed session IDs |
| **Cookie**    | `refreshToken`                 | `oauth_sso_session`                 |
| **Expiry**    | 7 days (configurable)          | Configurable (default: 24 hours)    |
| **Cleanup**   | Every 5 minutes                | Every 5 minutes                     |
| **HTTP-Only** | False (demo), True (prod)      | False (demo), True (prod)           |
| **SameSite**  | Strict                         | Strict                              |
| **Path**      | `/api/auth/refresh`            | `/oauth`                            |
| **Purpose**   | Token refresh chain            | Skip OAuth consent                  |

## Production Considerations

### Security Hardening

1. **Enable HTTP-Only**:

   ```typescript
   httpOnly: true; // Change from false
   ```

2. **Enable Secure**:

   ```typescript
   secure: true; // Always use HTTPS in production
   ```

3. **Consider Shorter Expiry**:
   ```typescript
   const SSO_SESSION_EXPIRY = 8 * 60 * 60; // 8 hours instead of 24
   ```

### Monitoring

- Track SSO session statistics via `getSSOSessionStats()`
- Monitor cleanup logs for expired session counts
- Alert on unusual session creation patterns

### Multi-Provider Sessions

- Each provider gets its own SSO session
- User can have multiple active SSO sessions (one per provider)
- Logging out clears the current session cookie (all providers affected)

## Future Enhancements

1. **Remember Device**
   - Store device fingerprint with session
   - Require re-auth from new devices

2. **Session Activity Log**
   - Track all session uses
   - Show user "Where you're logged in"

3. **Persistent Storage**
   - Move from in-memory to Redis/Database
   - Survive server restarts

4. **Session Revocation API**
   - Allow users to revoke specific sessions
   - Integrate with backend's session management

5. **Cross-Domain SSO**
   - Support SSO across multiple domains
   - Use token-based approach instead of cookies

## Troubleshooting

### SSO Not Working

1. **Check cookie**:

   ```javascript
   console.log(document.cookie); // Should see oauth_sso_session
   ```

2. **Check session validity**:

   ```bash
   curl http://localhost:3002/oauth/session/status \
     --cookie "oauth_sso_session=<id>"
   ```

3. **Check cleanup logs**:
   ```
   [SSO Cleanup] Cleanup completed
   [SSO Store] Cleaned up N expired sessions
   ```

### Different Provider Not Auto-Approving

This is **expected behavior**:

- SSO sessions are provider-specific
- User must authorize each provider separately
- After first authorization, subsequent requests to same provider auto-approve

### Session Expired

- Sessions expire after configured duration (default: 24 hours, set via `SSO_SESSION_EXPIRY`)
- User must re-authorize (consent page appears again)
- New session created upon approval
