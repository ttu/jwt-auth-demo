# Technical Learnings

Technical learnings, best practices, error solutions. Add new findings here.

## JWT Security Best Practices

### 1. Algorithm Specification Security

**Issue**: Not explicitly specifying algorithms in JWT verification
**Learning**: Always specify the `algorithms` option in `jwt.verify()` to prevent algorithm confusion attacks
**Solution**:

```typescript
jwt.verify(token, secret, { algorithms: ['HS256'] });
```

**Why This Matters**: Without explicit algorithm specification, attackers could potentially:

- Force the use of weaker algorithms
- Exploit RS256 → HS256 downgrade attacks
- Bypass signature verification in some scenarios

### 2. JWT Claims Validation

**Best Practice**: The project correctly implements standard JWT claims:

- `iss` (issuer) - identifies the token issuer
- `sub` (subject) - user identifier in string format per RFC
- `aud` (audience) - specifies intended recipients
- `jti` (JWT ID) - unique token identifier prevents replay attacks
- `iat` (issued at) - timestamp of token creation
- `exp` (expiration) - token expiration time

### 3. Token Storage Security

**Learning**: HTTP-only cookies are the most secure way to store refresh tokens
**Current Issue**: `httpOnly: false` is set for demo purposes but should be `true` in production

**Security Implications**:

- JavaScript access to tokens enables XSS attacks
- HTTP-only cookies prevent client-side script access
- Should be combined with `secure: true` and `sameSite: 'strict'`

### 4. Single-Use Refresh Tokens

**Best Practice**: The project implements single-use refresh tokens which is excellent for security:

- Each refresh token can only be used once
- Automatic token rotation on refresh
- Prevents token replay attacks
- Limits the window of vulnerability if tokens are compromised

### 5. Separate Secrets for Different Token Types

**Good Practice**: Using different secrets for access and refresh tokens:

- Limits blast radius if one secret is compromised
- Allows for different key rotation schedules
- Enables different security policies per token type

### 6. Token Blacklisting

**Security Feature**: Implemented token blacklisting allows for immediate token revocation:

- Useful for logout functionality
- Emergency token revocation
- Prevents use of compromised tokens
- Essential for security incident response

### 7. Device-Specific Sessions

**Advanced Feature**: Device tracking provides additional security:

- Session management per device
- Ability to revoke specific device sessions
- Enhanced audit trail
- Better user experience with session visibility

## Code Organization Learnings

### 1. Centralized Utilities

**Problem**: Duplicate JWT creation logic across multiple files
**Solution**: Created `backend/src/utils/token.utils.ts` with shared functions
**Benefits**:

- DRY principle adherence
- Consistent token structure
- Single point of maintenance
- Easier testing and validation

### 2. Common Configuration Objects

**Learning**: Shared configuration objects prevent inconsistencies
**Implementation**: `commonVerifyOptions` for JWT verification
**Result**: All JWT verification uses identical security settings

### 3. TypeScript Best Practices

**ESLint Configuration**:

- Disabled `no-non-null-assertion` for better developer experience
- Maintained `no-console` warnings in frontend, allowed in backend
- Proper environment-specific linting rules

## OAuth Implementation Learnings

### 1. Audience Claims in OAuth Tokens

**Standard**: OAuth 2.0 tokens should include proper audience claims
**Implementation**:

- Access tokens: `aud` should identify resource servers
- Refresh tokens: `aud` should identify authorization server
- ID tokens: `aud` should identify client application

### 2. Token Validation Consistency

**Learning**: All token validation should use consistent verification options
**Implementation**: Centralized verify options prevent configuration drift

## Debugging and Investigation Techniques

### 1. Systematic Security Analysis

**Process Used**:

1. Identify all JWT creation points
2. Analyze verification implementations
3. Check for security vulnerabilities
4. Validate against specifications
5. Implement fixes systematically

### 2. Documentation-Driven Development

**Learning**: Proper documentation during development helps:

- Track security decisions
- Maintain audit trail
- Enable knowledge transfer
- Support future maintenance

## Error Solutions

### 1. Algorithm Confusion Attack Prevention

**Error**: Missing algorithm specification in JWT verification
**Solution**: Added explicit `algorithms: ['HS256']` to all verification calls
**Files Fixed**:

- `backend/src/middleware/auth.middleware.ts`
- `backend/src/routes/auth.routes.ts`
- `oauth-server/src/routes/userinfo.routes.ts`

### 2. Code Duplication Resolution

**Error**: Duplicate JWT creation logic
**Solution**: Centralized token utilities
**Result**: Consistent token structure across all authentication flows

### 3. OAuth Token Validation

**Error**: Missing audience validation in OAuth tokens
**Solution**: Added proper `aud` claims and validation
**Security Benefit**: Prevents token misuse across services
