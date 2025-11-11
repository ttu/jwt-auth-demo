# Backend Documentation

API endpoints, authentication, service architecture.

## API Reference

### Main Application API (Port 3001)

Base URL: `http://localhost:3001/api`

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`

User login with credentials.

**Request:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Headers:**

```
X-Device-Id: unique_device_identifier
```

**Response:**

```json
{
  "accessToken": "jwt_access_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

**Cookies Set:**

- `refreshToken`: HTTP-only refresh token (7 days expiry)

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Headers:**

```
Cookie: refreshToken=jwt_refresh_token
```

**Response:**

```json
{
  "accessToken": "new_jwt_access_token"
}
```

**Cookies Set:**

- `refreshToken`: New HTTP-only refresh token

#### POST `/api/auth/logout`

Logout user and invalidate tokens.

**Headers:**

```
Authorization: Bearer jwt_access_token
Cookie: refreshToken=jwt_refresh_token
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `refreshToken`: Removed from client

#### POST `/api/auth/invalidate-token`

Invalidate current access token (add to blacklist).

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "message": "Token invalidated successfully"
}
```

### OAuth Authentication Endpoints

#### GET `/api/auth/oauth/:provider`

Start OAuth authentication flow.

**Parameters:**

- `provider`: One of `google`, `microsoft`, `strava`, `company`

**Headers:**

```
X-Device-Id: unique_device_identifier
```

**Response:**

```json
{
  "authUrl": "https://oauth-provider.com/authorize?response_type=code&client_id=..."
}
```

#### GET `/api/auth/callback/:provider`

Handle OAuth callback and complete authentication.

**Parameters:**

- `provider`: One of `google`, `microsoft`, `strava`, `company`

**Query Parameters:**

- `code`: Authorization code from OAuth provider
- `state`: State parameter for CSRF protection

**Response:**

```json
{
  "accessToken": "jwt_access_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "provider": "oauth_provider"
  }
}
```

**Cookies Set:**

- `refreshToken`: HTTP-only refresh token (7 days expiry)

### Session Management Endpoints

#### GET `/api/sessions`

Get list of active sessions for the current user.

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "sessions": [
    {
      "deviceId": "device_123",
      "deviceInfo": "User-Agent string",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastUsed": "2023-01-01T12:00:00.000Z",
      "current": true
    }
  ]
}
```

#### POST `/api/sessions/revoke`

Revoke a specific session by device ID.

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Request:**

```json
{
  "deviceId": "device_to_revoke"
}
```

**Response:**

```json
{
  "message": "Session revoked successfully"
}
```

### Protected Resource Endpoints

#### GET `/api/customers/list`

Get list of customers (protected endpoint).

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "customers": [
    {
      "id": "customer_id",
      "name": "Customer Name",
      "email": "customer@example.com"
    }
  ]
}
```

#### GET `/api/users/profile`

Get current user profile information.

**Headers:**

```
Authorization: Bearer jwt_access_token
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "provider": "local_or_oauth_provider",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

## OAuth Server API (Port 3002)

Base URL: `http://localhost:3002`

The fake OAuth server provides the following endpoints for testing OAuth flows:

### Authorization Endpoints

#### GET `/oauth/authorize`

OAuth authorization endpoint that displays the consent page.

**Query Parameters:**

- `response_type`: Must be `code`
- `client_id`: Client identifier
- `redirect_uri`: Callback URL
- `scope`: Requested scopes
- `state`: State parameter for CSRF protection
- `nonce`: Nonce for replay attack prevention
- `provider`: Provider name (`google`, `microsoft`, `strava`, `company`)

**Response:**

- HTML consent page for user authorization
- Or redirect to `redirect_uri` with authorization code

#### POST `/oauth/authorize/confirm`

Confirm user authorization and generate authorization code.

**Form Data:**

- Same parameters as GET `/oauth/authorize`

**Response:**

- Redirect to `redirect_uri` with:
  - `code`: Authorization code
  - `state`: Original state parameter

### Token Management Endpoints

#### POST `/oauth/token`

Exchange authorization code for tokens.

**Request:**

```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "redirect_uri": "callback_url",
  "client_id": "client_identifier",
  "client_secret": "client_secret",
  "provider": "provider_name"
}
```

**Response:**

```json
{
  "access_token": "oauth_access_token",
  "refresh_token": "oauth_refresh_token",
  "id_token": "openid_connect_id_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### User Information Endpoints

#### GET `/oauth/userinfo`

Get user profile information using OAuth access token.

**Headers:**

```
Authorization: Bearer oauth_access_token
```

**Response (varies by provider):**

**Google/Microsoft/Company:**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "profile_picture_url",
  "provider": "google|microsoft|company"
}
```

**Strava:**

```json
{
  "sub": "athlete_id",
  "username": "athlete_username",
  "firstname": "First",
  "lastname": "Last",
  "profile": "profile_picture_url",
  "provider": "strava"
}
```

### SSO (Single Sign-On) Endpoints

#### GET `/oauth/session/status`

Check SSO session status (debugging endpoint).

**Cookies:**

```
oauth_sso_session=<session_id>
```

**Response:**

```json
{
  "hasSession": true,
  "session": {
    "userId": "user123",
    "provider": "google",
    "createdAt": "2025-11-11T10:00:00.000Z",
    "lastUsedAt": "2025-11-11T10:30:00.000Z",
    "expiresAt": "2025-11-12T10:00:00.000Z"
  }
}
```

#### GET `/oauth/sessions`

List all active SSO sessions for the current user (requires active SSO session).

**Cookies:**

```
oauth_sso_session=<session_id>
```

**Response:**

```json
{
  "sessions": [
    {
      "provider": "google",
      "createdAt": "2025-11-11T10:00:00.000Z",
      "lastUsedAt": "2025-11-11T10:30:00.000Z",
      "expiresAt": "2025-11-12T10:00:00.000Z"
    }
  ]
}
```

#### POST `/oauth/logout`

Revoke SSO session and clear session cookie.

**Cookies:**

```
oauth_sso_session=<session_id>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `oauth_sso_session`: SSO session cookie

**SSO Flow Details:**

1. **First Authorization**: User approves OAuth consent → SSO session created (configurable expiry)
2. **Subsequent Requests**: Valid SSO session for same provider → Auto-approved (no consent UI)
3. **Cross-Application**: SSO works across main app (port 3001) and frontend-standalone (port 3003)
4. **Provider Isolation**: Each provider (Google, Microsoft, Strava, Company) has separate sessions
5. **Automatic Cleanup**: Expired sessions removed every 5 minutes

See [docs/sso-implementation.md](./sso-implementation.md) for complete SSO documentation.

## Error Responses

All endpoints may return the following error responses:

### `400 Bad Request`

```json
{
  "error": "Invalid request parameters"
}
```

### `401 Unauthorized`

```json
{
  "error": "Invalid or expired token"
}
```

### `403 Forbidden`

```json
{
  "error": "Insufficient permissions"
}
```

### `404 Not Found`

```json
{
  "error": "Resource not found"
}
```

### `500 Internal Server Error`

```json
{
  "error": "Internal server error"
}
```

## Authentication Headers

### Access Token Usage

All protected endpoints require the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Device ID Header

Authentication endpoints require a device ID header:

```
X-Device-Id: <unique_device_identifier>
```

### Refresh Token Usage

Token refresh requires the refresh token in an HTTP-only cookie:

```
Cookie: refreshToken=<refresh_token>
```

## Rate Limiting

Currently, no rate limiting is implemented in this demo application. In a production environment, you should implement appropriate rate limiting for authentication endpoints.

## CORS Configuration

The backend is configured to accept requests from the frontend running on `http://localhost:5173` with credentials enabled for cookie handling.

## Authentication Architecture

### JWT Token Structure

#### Access Token Claims

```json
{
  "iss": "your-app-name",
  "sub": "user_id",
  "aud": ["api"],
  "jti": "unique_token_id",
  "userId": 1,
  "username": "demo",
  "scope": ["read", "write"],
  "version": "1.0",
  "iat": 1640995200,
  "exp": 1640995215
}
```

#### Refresh Token Claims

```json
{
  "iss": "your-app-name",
  "sub": "user_id",
  "aud": ["api"],
  "jti": "unique_token_id",
  "userId": 1,
  "username": "demo",
  "scope": ["refresh"],
  "version": "1.0",
  "iat": 1640995200,
  "exp": 1641600000
}
```

### Security Middleware

#### Access Token Verification

- **Algorithm**: HMAC-SHA256 (explicitly specified)
- **Validation**: Signature, expiration, blacklist status
- **Claims**: Issuer, audience, and custom claims validation
- **Error Handling**: 401 responses for invalid/expired tokens

#### Refresh Token Verification

- **Single-Use**: Tokens are marked as used after validation
- **Device Binding**: Tokens are tied to specific device IDs
- **Rotation**: New refresh token issued with each refresh
- **Storage**: Server-side tracking of valid refresh tokens

### Token Storage

#### Refresh Token Store

```typescript
interface StoredToken {
  userId: number;
  deviceId: string;
  deviceInfo: DeviceInfo;
  expiresAt: Date;
  isRevoked: boolean;
  isUsed: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  id: string; // UUID for session identification
}
```

**Security Implementation**:

- Refresh tokens are **hashed using SHA-256** before storage
- The Map stores `tokenHash` as the key (not plaintext tokens)
- Even if storage is compromised, tokens cannot be used
- Hash lookup is fast (O(1)) and more secure than storing plaintext

**Implementation**:

```typescript
import { createHash } from 'crypto';

const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

// Storing a token
const tokenHash = hashToken(refreshToken);
refreshTokens.set(tokenHash, storedTokenData);

// Looking up a token
const tokenHash = hashToken(receivedToken);
const storedToken = refreshTokens.get(tokenHash);
```

#### Token Blacklist

- **Purpose**: Immediate access token revocation
- **Storage**: In-memory set of revoked token JTIs
- **Cleanup**: Automatic removal of expired blacklisted tokens

## Service Architecture

### Core Services

#### Token Cleanup Service

```typescript
// Automatic cleanup of expired tokens
setInterval(() => {
  cleanupExpiredTokens();
  cleanupExpiredBlacklistedTokens();
  cleanupExpiredNonces();
}, CLEANUP_INTERVAL);
```

#### Cookie Utilities

```typescript
// Secure cookie configuration
const cookieOptions = {
  httpOnly: true, // Prevent XSS access
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // CSRF protection
  path: '/api/auth/refresh', // Limit cookie scope
  maxAge: refreshTokenExpiry * 1000,
};
```

### OAuth Integration

#### Provider Configuration

```typescript
interface OAuthProvider {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
}
```

#### OAuth Flow Implementation

1. **Authorization**: Generate state and nonce, redirect to provider
2. **Callback**: Validate state, exchange code for tokens
3. **User Info**: Fetch user profile using OAuth access token
4. **Token Generation**: Create application JWT tokens
5. **Session Creation**: Store refresh token and redirect to frontend

### Error Handling

#### Authentication Errors

- **401 Unauthorized**: Invalid or expired tokens
- **400 Bad Request**: Missing required parameters
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Server-side processing errors

#### OAuth Errors

- **Invalid Grant**: Authorization code issues
- **Invalid Client**: Client credential problems
- **Invalid Request**: Malformed OAuth requests
- **Server Error**: OAuth provider communication failures

### Configuration Management

#### Environment Variables

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15
REFRESH_TOKEN_EXPIRY=604800

# OAuth Provider Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# ... other providers
```

#### Security Settings

```typescript
export const settings = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '15', 10),
    refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10),
  },
  // ... other settings
};
```

## Performance Considerations

### Token Validation

- **In-Memory Storage**: Fast token blacklist and refresh token lookups
- **Stateless Access Tokens**: No database queries for token validation
- **Efficient Cleanup**: Periodic cleanup of expired data structures

### Session Management

- **Device Tracking**: Minimal overhead with UUID-based device identification
- **Token Rotation**: Automatic cleanup of old refresh tokens
- **Blacklist Management**: Efficient set-based blacklist operations

### Scalability

- **Horizontal Scaling**: Stateless authentication design
- **Database Integration**: Ready for persistent token storage
- **Caching**: In-memory stores can be replaced with Redis for distributed systems
