# Data Model

Entities, attributes, relationships.

## Core Entities

### User

**Purpose**: Represents authenticated users in the system
**Storage**: In-memory array (demo), ready for database integration

```typescript
interface User {
  id: number; // Unique user identifier
  username: string; // Login username
  password: string; // Hashed password (plain text in demo)
}
```

**Relationships**:

- One-to-many with StoredToken (refresh tokens)
- One-to-many with DeviceInfo (sessions)

### StoredToken

**Purpose**: Manages refresh token lifecycle and device sessions
**Storage**: In-memory Map (keyed by SHA-256 token hash) with automatic cleanup

```typescript
interface StoredToken {
  userId: number; // Reference to User.id
  deviceId: string; // Unique device identifier (UUID)
  deviceInfo: DeviceInfo; // Device metadata
  expiresAt: Date; // Expiration timestamp
  isRevoked: boolean; // Manual revocation flag
  isUsed: boolean; // Single-use flag
  createdAt: Date; // Creation timestamp
  lastUsedAt: Date; // Last usage timestamp
  id: string; // UUID for session identification
}
```

**Security**:

- Refresh tokens are **hashed using SHA-256** before storage
- Map key is the hash (not the plaintext token)
- Provides defense-in-depth against storage compromise

**Relationships**:

- Many-to-one with User
- One-to-one with DeviceInfo

### DeviceInfo

**Purpose**: Tracks device and browser information for sessions
**Storage**: Embedded within StoredToken

```typescript
interface DeviceInfo {
  userAgent: string; // Browser user agent string
  platform: string; // Operating system platform
  os: string; // Operating system name
}
```

**Usage**:

- Session identification and management
- Security audit trails
- User-friendly session display

### JwtPayload

**Purpose**: Standardized JWT token claims structure
**Storage**: Embedded within JWT tokens

```typescript
interface JwtPayload {
  iss: string; // Issuer (your-app-name)
  sub: string; // Subject (user ID as string)
  aud: string[]; // Audience (["api"])
  jti: string; // JWT ID (UUID for uniqueness)
  userId: number; // User identifier
  username: string; // Username for display
  scope: string[]; // Permissions (read, write, refresh)
  version: string; // Token version (1.0)
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}
```

**Token Types**:

- **Access Token**: scope: ["read", "write"], short expiry
- **Refresh Token**: scope: ["refresh"], long expiry

## OAuth Entities

### AuthorizationCode (with PKCE Support)

**Purpose**: Stores authorization codes with PKCE parameters for OAuth flows
**Storage**: In-memory Map (OAuth server)

```typescript
interface AuthorizationCode {
  code: string; // Unique authorization code (UUID)
  clientId: string; // OAuth client identifier
  redirectUri: string; // Registered redirect URI
  provider: OAuthProvider; // OAuth provider name
  expiresAt: number; // Expiration timestamp (10 minutes)
  nonce: string; // OpenID Connect nonce for replay protection
  codeChallenge?: string; // PKCE code challenge (SHA-256 hash)
  codeChallengeMethod?: 'S256' | 'plain'; // PKCE challenge method
}
```

**PKCE Flow**:

1. Client generates `code_verifier` (128 characters, cryptographically random)
2. Client creates `code_challenge = SHA256(code_verifier)` + Base64URL encoding
3. Server stores `codeChallenge` and `codeChallengeMethod` with authorization code
4. Client exchanges code + `code_verifier` for tokens
5. Server verifies: `SHA256(code_verifier) === stored codeChallenge`

**Security**:

- Authorization codes expire in 10 minutes
- Single-use (deleted after token exchange)
- PKCE prevents authorization code interception attacks
- Even if code is stolen, attacker cannot use it without `code_verifier`

**Relationships**:

- Associated with OAuthProvider
- Referenced during token exchange

### OAuthUserInfo

**Purpose**: User profile information from OAuth providers
**Storage**: In-memory cache during OAuth flow

```typescript
interface OAuthUserInfo {
  id: string; // Provider-specific user ID
  email: string; // User email address
  name: string; // Display name
  provider: OAuthProvider; // Provider identifier
}
```

**Providers**:

- google
- microsoft
- strava
- company (mock)

### OAuthState

**Purpose**: CSRF protection and flow tracking for OAuth
**Storage**: Encoded in OAuth state parameter

```typescript
interface OAuthState {
  deviceId: string; // Device identifier
  timestamp: number; // State creation time
  nonce: string; // Random nonce for security
}
```

**Security Features**:

- CSRF attack prevention
- Replay attack mitigation
- State parameter validation

## Security Entities

### BlacklistedToken

**Purpose**: Revoked access tokens that should be rejected
**Storage**: In-memory Set with automatic cleanup

```typescript
// Stored as Set<string> of JWT IDs (jti claims)
interface BlacklistEntry {
  jti: string; // JWT ID from token
  expiresAt: number; // When to remove from blacklist
}
```

**Usage**:

- Immediate token revocation
- Logout functionality
- Security incident response

### NonceStore

**Purpose**: OAuth nonce validation for replay attack prevention
**Storage**: In-memory Map with TTL

```typescript
interface NonceEntry {
  nonce: string; // Random nonce value
  createdAt: number; // Creation timestamp
  expiresAt: number; // Expiration timestamp
}
```

**Security**:

- Prevents OAuth replay attacks
- Validates ID token nonce claims
- Automatic cleanup of expired nonces

## PKCE-Specific Data

### PKCE Parameters (Frontend-Standalone)

**Purpose**: Client-side PKCE parameters for secure OAuth flow
**Storage**: SessionStorage (temporary, cleared after use)

```typescript
interface PKCEParameters {
  codeVerifier: string; // Random string (43-128 chars, RFC 7636)
  codeChallenge: string; // SHA-256(codeVerifier) + Base64URL
  codeChallengeMethod: 'S256'; // Challenge method (always S256)
}

interface OAuthParameters extends PKCEParameters {
  state: string; // CSRF protection parameter
}
```

**Generation Requirements (RFC 7636)**:

- `code_verifier`: 43-128 characters, unreserved characters `[A-Za-z0-9-._~]`
- Must use cryptographically secure random generation (`crypto.getRandomValues()`)
- `code_challenge`: Base64URL(SHA-256(code_verifier))
- No padding in Base64URL encoding

**Storage Security**:

- Stored in sessionStorage during OAuth flow
- Automatically cleared after successful token exchange
- Never transmitted to server until token exchange
- Proves same client initiated and completed the flow

### PKCE Verification (OAuth Server)

**Purpose**: Server-side PKCE verification utilities
**Location**: `oauth-server/src/utils/crypto.utils.ts`

```typescript
// Verify PKCE code_verifier against stored code_challenge
function verifyChallengeVerifier(codeVerifier: string, codeChallenge: string, method: 'S256' | 'plain'): boolean;

// Compute SHA-256 hash and Base64URL encode
function computeCodeChallenge(codeVerifier: string): string;
```

**Verification Process**:

1. Retrieve stored `codeChallenge` and `codeChallengeMethod` from authorization code
2. Compute challenge from provided `code_verifier`
3. Compare computed challenge with stored challenge
4. If match: issue tokens; If mismatch: reject with error

## Data Relationships

### User Session Model

```
User (1) ←→ (N) StoredToken ←→ (1) DeviceInfo
```

**Description**: Each user can have multiple active sessions (refresh tokens) across different devices. Each session is bound to specific device information.

### OAuth Integration Model

```
OAuthProvider → OAuthUserInfo → User (mapped)
```

**Description**: OAuth providers supply user information that gets mapped to internal user accounts. The mapping creates or updates local user records.

### Token Lifecycle Model

```
User → AccessToken (short-lived)
User → RefreshToken (long-lived, single-use)
RefreshToken → NewAccessToken + NewRefreshToken (rotation)
```

**Description**: Users receive short-lived access tokens and long-lived refresh tokens. Refresh tokens are single-use and generate new token pairs when used.

### Security Tracking Model

```
AccessToken → BlacklistEntry (on revocation)
OAuthFlow → NonceEntry (for validation)
Session → DeviceInfo (for tracking)
```

**Description**: Security entities track token revocation, OAuth flow validation, and session device information for audit and security purposes.

## Data Storage Patterns

### In-Memory Storage

**Current Implementation**: All data stored in memory for demo purposes
**Benefits**: Fast access, no database dependencies
**Limitations**: Data lost on restart, not suitable for production

### Production Considerations

#### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  device_id UUID NOT NULL,
  device_info JSONB,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blacklisted tokens table
CREATE TABLE blacklisted_tokens (
  jti UUID PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Caching Strategy

- **Redis**: For blacklisted tokens and nonces
- **Database**: For persistent user and session data
- **Memory**: For frequently accessed configuration

### Data Validation

#### Input Validation

- **User Credentials**: Username/password format validation
- **Device IDs**: UUID format validation
- **Tokens**: JWT structure and signature validation
- **OAuth Data**: Provider-specific data validation

#### Security Validation

- **Token Expiration**: Automatic expiry checking
- **Single-Use Enforcement**: Refresh token usage tracking
- **Device Binding**: Session-device relationship validation
- **Nonce Validation**: OAuth replay attack prevention

## Data Migration Patterns

### Version Management

- **Token Versioning**: Version field in JWT payload for compatibility
- **Schema Evolution**: Database migration support for production
- **Backward Compatibility**: Graceful handling of old token formats

### Cleanup Strategies

- **Automatic Cleanup**: Periodic removal of expired data
- **Manual Cleanup**: Administrative tools for data management
- **Audit Trails**: Logging of data lifecycle events
