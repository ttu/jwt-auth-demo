# Frontend Standalone PKCE Tests

This directory contains Playwright integration tests specifically designed for the `frontend-standalone` application, which demonstrates OAuth 2.0 Authorization Code + PKCE flow without requiring a backend server.

## Overview

The frontend-standalone tests validate:

- ✅ **Complete PKCE OAuth Flow**: Authorization Code + PKCE implementation
- ✅ **Multiple OAuth Providers**: Google, Microsoft, Strava, Company SSO
- ✅ **Security Validation**: RFC 7636 compliance and PKCE parameter verification
- ✅ **Error Handling**: Authorization denial and invalid request scenarios
- ✅ **Browser Implementation**: In-browser PKCE utilities testing

## Quick Start

### Prerequisites

1. **OAuth Server Running**: Port 3002
2. **Frontend Standalone Running**: Port 3003

```bash
# Start OAuth server (required)
cd ../oauth-server && npm run dev

# Start frontend-standalone (required)
cd ../frontend-standalone && npm run dev
```

### Run Tests

```bash
# Run all frontend-standalone tests
npm run test:standalone

# Run with visible browser (great for debugging)
npm run test:standalone:headed

# Run with interactive UI
npm run test:standalone:ui

# Run with debugger
npm run test:standalone:debug
```

## Test Structure

### Main Test File

- **`tests/frontend-standalone-pkce.spec.ts`**: Core PKCE flow tests

### Test Helper

- **`tests/utils/standalone-test-helpers.ts`**: Specialized utilities for standalone app testing

### Test Runner

- **`test-standalone.sh`**: Dedicated script for running standalone tests with service management

## Test Coverage

### 🔐 PKCE OAuth Flow Tests

#### Complete OAuth Flow

- Navigate to frontend-standalone app
- Click OAuth provider button (Google, Microsoft, Strava, Company)
- Verify PKCE parameters in authorization request
- Approve OAuth authorization
- Validate PKCE token exchange
- Verify user authentication and info display
- Test logout functionality

#### Security Validation

- **PKCE Parameters**: Verify `code_challenge`, `code_challenge_method=S256`
- **State Parameter**: Validate CSRF protection with secure random generation
- **RFC 7636 Compliance**: Code verifier format and length validation
- **Authorization Request**: Complete parameter validation

### 🛡️ Security Tests

#### PKCE Implementation Validation

```typescript
// Tests verify:
- Code verifier: 43-128 characters, unreserved character set
- Code challenge: SHA-256 + Base64URL encoding
- State parameter: Cryptographically secure random generation
- PKCE flow: Complete verification cycle
```

#### Error Handling

- Authorization denial scenarios
- Invalid request handling
- CSRF attack prevention (state parameter validation)

### 🌐 Multi-Provider Testing

Each OAuth provider is tested individually:

- **Google OAuth**: Complete PKCE flow
- **Microsoft OAuth**: Complete PKCE flow
- **Strava OAuth**: Complete PKCE flow
- **Company SSO**: Complete PKCE flow

## Configuration

### Playwright Configuration

The tests use a dedicated project configuration:

```typescript
{
  name: 'frontend-standalone',
  use: {
    baseURL: 'http://localhost:3003',
  },
  testMatch: '**/frontend-standalone-*.spec.ts',
}
```

### Service Dependencies

- **OAuth Server** (port 3002): Required for authorization and token endpoints
- **Frontend Standalone** (port 3003): The application under test
- **No Backend Required**: Tests the pure SPA + PKCE flow

## Test Helpers

### StandaloneTestHelpers Class

Key methods for PKCE testing:

```typescript
// Navigation and setup
await helpers.navigateToApp();
await helpers.clickOAuthProvider('google');

// PKCE validation
await helpers.verifyPKCEAuthorizationRequest();
await helpers.waitForPKCECallback();

// Authentication verification
await helpers.verifyAuthenticated();
await helpers.verifyUserInfo('google');

// Security testing
await helpers.verifyStateParameterValidation();
await helpers.testPKCEImplementation();
```

## Debugging

### Visual Debugging

```bash
# Run with visible browser
npm run test:standalone:headed
```

### Interactive Mode

```bash
# Run with Playwright UI
npm run test:standalone:ui
```

### Step-by-Step Debugging

```bash
# Run with debugger
npm run test:standalone:debug
```

### Screenshots and Videos

- **Screenshots**: Automatically captured on test failure
- **Videos**: Recorded for failed tests
- **Network Logs**: OAuth requests/responses logged
- **Console Output**: PKCE flow debugging information

## Common Issues

### Service Startup

If tests fail to start:

```bash
# Check if services are running
curl http://localhost:3002/health  # OAuth server
curl http://localhost:3003         # Frontend standalone
```

### PKCE Parameter Validation

Tests verify PKCE parameters meet RFC 7636 requirements:

- Code verifier: 128 characters, unreserved charset
- Code challenge: SHA-256 hash, Base64URL encoded
- State parameter: 32+ characters, cryptographically random

### Browser Context

Some tests execute PKCE utilities in browser context:

```typescript
// This requires the PKCE utilities to be available in the browser
const result = await page.evaluate(async () => {
  const { generateCodeVerifier } = await import('/src/utils/pkce.js');
  return generateCodeVerifier(64);
});
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Frontend Standalone Tests
  run: npm run test:standalone
```

### Local CI Simulation

```bash
# Run tests in CI mode
npm run test:standalone -- --reporter=list
```

## Security Validation

The tests ensure the frontend-standalone application:

- ✅ Implements PKCE correctly according to RFC 7636
- ✅ Uses cryptographically secure random generation
- ✅ Validates state parameters for CSRF protection
- ✅ Handles OAuth errors gracefully
- ✅ Exchanges authorization codes securely with PKCE verification

## Contributing

When adding new tests:

1. **Follow Naming Convention**: `frontend-standalone-*.spec.ts`
2. **Use Test Helpers**: Leverage `StandaloneTestHelpers` for common operations
3. **Add Screenshots**: Use `takeScreenshot()` for debugging
4. **Test All Providers**: Ensure new features work with all OAuth providers
5. **Security Focus**: Validate PKCE parameters and security measures

## Related Documentation

- **Main Testing Guide**: `../docs/testing.md`
- **PKCE Validation Report**: `../docs/pkce-validation-report.md`
- **Frontend Standalone README**: `../frontend-standalone/README.md`
- **OAuth Server Documentation**: `../oauth-server/README.md`
