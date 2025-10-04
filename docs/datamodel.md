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
**Storage**: In-memory Map with automatic cleanup

```typescript
interface StoredToken {
  token: string; // JWT refresh token
  userId: number; // Reference to User.id
  deviceId: string; // Unique device identifier (UUID)
  deviceInfo: DeviceInfo; // Device metadata
  expiresAt: number; // Expiration timestamp
  isUsed: boolean; // Single-use flag
  createdAt: number; // Creation timestamp
}
```

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

### AuthorizationCode

**Purpose**: Temporary codes for OAuth token exchange
**Storage**: In-memory with automatic expiration

```typescript
interface AuthorizationCode {
  code: string; // Authorization code
  userId: string; // Provider user ID
  provider: OAuthProvider; // OAuth provider
  redirectUri: string; // Callback URL
  nonce: string; // Nonce for ID token
  expiresAt: number; // Code expiration
}
```

**Lifecycle**:

1. Generated during OAuth authorization
2. Exchanged for tokens at callback
3. Automatically cleaned up after use

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
