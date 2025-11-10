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

**Learning**: Multi-layered approach to secure refresh token storage

**Server-Side Storage (Implemented)**:

- Refresh tokens are **hashed using SHA-256** before storage in the Map
- Even if the in-memory store is compromised, attackers cannot use the tokens
- Hash lookup is O(1) - fast and secure
- Provides defense-in-depth security

**Client-Side Storage**:

- HTTP-only cookies are the most secure way to transmit refresh tokens
- **Current Issue**: `httpOnly: false` is set for demo purposes but should be `true` in production

**Security Implications**:

- Server-side hashing prevents token theft from storage compromise
- JavaScript access to tokens enables XSS attacks (if httpOnly is false)
- HTTP-only cookies prevent client-side script access
- Should be combined with `secure: true` and `sameSite: 'strict'`

**Implementation**:

```typescript
// Hash before storing
const tokenHash = createHash('sha256').update(token).digest('hex');
refreshTokens.set(tokenHash, tokenData);

// Hash before lookup
const tokenHash = createHash('sha256').update(receivedToken).digest('hex');
const storedToken = refreshTokens.get(tokenHash);
```

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

## PKCE Implementation Learnings

### 1. PKCE for Public Clients (RFC 7636)

**Problem**: SPAs and mobile apps cannot securely store client secrets
**Solution**: PKCE (Proof Key for Code Exchange) eliminates the need for client secrets
**Learning**: PKCE is now required by OAuth 2.1 for all public clients

**How PKCE Works**:

1. Client generates random `code_verifier` (128 characters recommended)
2. Client creates `code_challenge = SHA256(code_verifier)` + Base64URL encoding
3. Client sends `code_challenge` with authorization request
4. Authorization server stores `code_challenge` with authorization code
5. Client sends `code_verifier` with token request
6. Server verifies: `SHA256(code_verifier) === stored code_challenge`

**Security Benefits**:

- Prevents authorization code interception attacks
- No client secret needed (safe for SPAs)
- Cryptographically proves same client completed the flow
- Even if authorization code is stolen, attacker cannot use it
- Approved by OAuth 2.0 Security Best Current Practice

### 2. Web Crypto API for Secure Random Generation

**Learning**: Never use `Math.random()` for security-critical operations
**Solution**: Use Web Crypto API for cryptographically secure random values

**Implementation**:

```typescript
// ❌ BAD: Not cryptographically secure
const insecure = Math.random().toString(36);

// ✅ GOOD: Cryptographically secure
const randomValues = new Uint8Array(128);
crypto.getRandomValues(randomValues);
const secure = Array.from(randomValues)
  .map(v => charset[v % charset.length])
  .join('');
```

**Why This Matters**:

- `Math.random()` is predictable and can be exploited
- `crypto.getRandomValues()` uses OS-level entropy
- PKCE security depends on unpredictable code_verifier
- State parameters must be unguessable for CSRF protection

### 3. Base64URL Encoding for OAuth Parameters

**Learning**: Standard Base64 encoding is not URL-safe
**Solution**: Use Base64URL encoding (RFC 4648 Section 5)

**Implementation**:

```typescript
// Convert standard Base64 to Base64URL
return btoa(binary)
  .replace(/\+/g, '-') // Replace + with -
  .replace(/\//g, '_') // Replace / with _
  .replace(/=/g, ''); // Remove padding
```

**Why This Matters**:

- Standard Base64 uses `+` and `/` which are special in URLs
- Padding `=` can cause issues in query parameters
- Base64URL is URL-safe without encoding
- Required by RFC 7636 for PKCE

### 4. RFC 7636 Compliance Requirements

**Learning**: PKCE has specific requirements for compliance
**Requirements**:

- **code_verifier length**: 43-128 characters
- **Character set**: `[A-Za-z0-9-._~]` (unreserved characters only)
- **Challenge method**: S256 (SHA-256) recommended, plain text discouraged
- **Encoding**: Base64URL without padding

**Validation**:

```typescript
function validateCodeVerifier(verifier: string): boolean {
  // Check length
  if (verifier.length < 43 || verifier.length > 128) {
    return false;
  }
  // Check character set
  const allowedChars = /^[A-Za-z0-9\-._~]+$/;
  return allowedChars.test(verifier);
}
```

### 5. PKCE Storage Security

**Learning**: PKCE parameters should be stored temporarily and securely
**Implementation**:

- **code_verifier**: Store in sessionStorage (cleared after use)
- **state**: Store in sessionStorage for CSRF validation
- **Never in localStorage**: Persists across sessions (security risk)
- **Clear after use**: Remove from storage after token exchange

**Security Pattern**:

```typescript
// Store temporarily
sessionStorage.setItem('code_verifier', codeVerifier);
sessionStorage.setItem('oauth_state', state);

// Use and clear immediately
const storedVerifier = sessionStorage.getItem('code_verifier');
sessionStorage.removeItem('code_verifier');
sessionStorage.removeItem('oauth_state');
```

### 6. PKCE vs Client Secret

**Learning**: Understanding when to use each approach

**Backend-Proxied OAuth (Client Secret)**:

- ✅ Highest security (secret never exposed to client)
- ✅ Enables HTTP-only cookies (XSS protection)
- ✅ Server-side token validation
- ❌ Requires backend infrastructure
- ❌ More complex architecture

**PKCE (Public Clients)**:

- ✅ No backend required (pure SPA)
- ✅ No client secret to manage
- ✅ OAuth 2.1 compliant
- ✅ Simpler architecture
- ❌ Tokens stored in browser (consider storage carefully)
- ✅ Recommended by OAuth Security BCP for SPAs

**Decision Criteria**:

- Have backend? Use client secret + HTTP-only cookies
- Pure SPA/Mobile? Use PKCE
- Need highest security? Backend-proxied OAuth
- Serverless architecture? PKCE

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

### 4. PKCE Implementation Challenges

**Challenge**: Implementing RFC 7636 compliant PKCE from scratch
**Solution**: Created dedicated PKCE utilities module with proper validation
**Files Created**:

- `frontend-standalone/src/utils/pkce.ts` - Client-side PKCE
- `oauth-server/src/utils/crypto.utils.ts` - Server-side verification

**Key Learnings**:

- SHA-256 hashing requires proper ArrayBuffer handling
- Base64URL encoding is different from standard Base64
- Character set validation prevents subtle bugs
- Cryptographic random generation is critical
- Testing PKCE flow requires end-to-end integration tests

### 5. OAuth Server PKCE Support

**Implementation**: Added PKCE support to existing OAuth server
**Changes**:

- `AuthorizationCode` entity extended with PKCE fields
- Token endpoint validates code_verifier against code_challenge
- Proper error handling for PKCE validation failures

**Verification Algorithm**:

```typescript
function verifyChallengeVerifier(codeVerifier: string, codeChallenge: string, method: 'S256' | 'plain'): boolean {
  if (method === 'S256') {
    const computedChallenge = computeCodeChallenge(codeVerifier);
    return computedChallenge === codeChallenge;
  }
  return codeVerifier === codeChallenge;
}
```

## Production Readiness Learnings

### 1. Dual OAuth Approach Benefits

**Learning**: Having both backend-proxied and PKCE flows provides educational value

**Benefits**:

- Compare security tradeoffs
- Understand architecture differences
- Demonstrate OAuth 2.0 and OAuth 2.1 compliance
- Show evolution of OAuth security best practices

### 2. Testing PKCE Flows

**Learning**: PKCE requires specific integration test patterns

**Test Coverage**:

- PKCE parameter generation validation
- Code challenge computation verification
- Server-side PKCE verification
- Complete end-to-end OAuth flow
- Security test cases (invalid verifier, missing parameters)

**Implementation**: Created `frontend-standalone-pkce.spec.ts` with 8 test scenarios
