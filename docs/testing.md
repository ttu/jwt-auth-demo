# Testing Guide

This project uses a comprehensive testing strategy with both unit tests and end-to-end integration tests.

## Test Overview

### Unit Tests (114 tests)

- **Backend**: 56 tests covering token utils, OAuth utils, refresh token store, and auth flows
- **OAuth Server**: 58 tests covering authorization store and configuration

### Integration Tests

- End-to-end Playwright tests covering complete OAuth and password authentication flows

### Continuous Integration

All tests run automatically on every push/PR to the main branch via GitHub Actions CI.

## Quick Start

### 1. Install Dependencies

```bash
# Install all project dependencies including test frameworks
npm run install:all
```

### 2. Run All Tests

```bash
# Run unit tests (backend + oauth-server)
npm run test:unit

# Run integration tests
npm run test:integration
```

## What the Test Does

The integration test performs a complete end-to-end OAuth authentication flow:

1. **🌐 Opens the application** at http://localhost:3000
2. **🔐 Clicks Google OAuth login button**
3. **✅ Approves authentication** on the mock OAuth server
4. **👥 Navigates to Users page** to verify protected route access
5. **📊 Navigates to Sessions page** to verify another protected route
6. **🚪 Logs out** and verifies logout completed successfully

## Unit Tests

### Running Unit Tests

```bash
# Run all unit tests (backend + oauth-server)
npm run test:unit

# Run backend tests only
npm run test:unit:backend

# Run oauth-server tests only
npm run test:unit:oauth
```

### Unit Test Coverage

**Backend Tests (56 tests)**

- **Token Utils** (7 tests): JWT creation, claims validation, expiration
- **OAuth Utils** (8 tests): State encoding/decoding, round-trip integrity
- **Refresh Token Store** (27 tests): Token storage, retrieval, revocation, cleanup
- **Auth Flow** (14 tests): Login, protected routes, token refresh, sessions, logout

**OAuth Server Tests (58 tests)**

- **Authorization Store** (42 tests): Code storage, retrieval, expiration, multi-provider support
- **Config** (16 tests): Server settings, provider configurations, scopes validation

## Integration Test Modes

### Standard Mode

```bash
npm run test:integration
```

Runs tests headlessly with automatic service startup.

### CI Mode

```bash
npm run test:integration:ci
```

Runs tests with list reporter (no HTML server) - used in GitHub Actions CI.

### Debug Mode

```bash
npm run test:integration:debug
```

Step through tests with debugger - perfect for troubleshooting.

### Headed Mode

```bash
npm run test:integration:headed
```

See the browser actions in real-time - watch the OAuth flow happen.

### UI Mode

```bash
npm run test:integration:ui
```

Interactive test runner with timeline, screenshots, and network logs.

## Frontend Standalone PKCE Tests

The frontend-standalone application has dedicated Playwright tests that focus on the PKCE OAuth flow without requiring the main backend.

### Running Frontend Standalone Tests

#### Standard Mode

```bash
npm run test:standalone
```

Runs PKCE flow tests for the frontend-standalone application.

#### Debug Mode

```bash
npm run test:standalone:debug
```

Step through PKCE tests with debugger.

#### Headed Mode

```bash
npm run test:standalone:headed
```

Run PKCE tests with visible browser.

#### UI Mode

```bash
npm run test:standalone:ui
```

Interactive test runner for frontend-standalone tests.

### Frontend Standalone Test Coverage

The frontend-standalone tests cover:

- **PKCE OAuth Flow**: Complete Authorization Code + PKCE flow
- **Multiple Providers**: Google, Microsoft, Strava, Company SSO
- **Security Validation**: PKCE parameter verification, state validation
- **Error Handling**: Authorization denial, invalid requests
- **RFC 7636 Compliance**: Code verifier/challenge format validation

## Architecture

The test coordinates three services:

- **Frontend** (React): Port 3000
- **Backend** (Express API): Port 3001
- **OAuth Server** (Mock): Port 3002

All services start automatically when you run the tests.

## Troubleshooting

### Ports Already in Use

If you get port conflicts:

```bash
# Kill any existing processes
lsof -ti:3000,3001,3002 | xargs kill -9
```

### Service Startup Issues

Tests wait 30 seconds for services to start. If they fail:

1. Check all dependencies are installed: `npm run install:all`
2. Try running services manually: `npm run dev`
3. Check the health endpoints:
   - http://localhost:3000 (should show React app)
   - http://localhost:3001/api/health (should return `{"status":"ok"}`)
   - http://localhost:3002/health (should return `{"status":"ok"}`)

### OAuth Flow Issues

If OAuth flow fails:

1. Run in headed mode to see what's happening: `npm run test:integration:headed`
2. Check screenshots in `integration-tests/test-results/`
3. Verify OAuth server is properly mocking Google OAuth

## Continuous Integration (CI)

The project uses GitHub Actions for automated testing on every push/PR to the main branch.

### CI Pipeline

The CI runs the following jobs in parallel:

1. **Lint**: ESLint + Prettier code quality checks
2. **Build**: Builds all services (backend, oauth-server, frontend)
3. **Unit Tests**: Runs all 114 unit tests (56 backend + 58 oauth-server)
4. **Integration Tests**: Runs Playwright E2E tests
5. **Security Audit**: npm audit on all packages

### Running CI Locally

You can run the complete CI pipeline locally before pushing:

```bash
# Run the full CI pipeline locally
./test-ci.sh
```

This script runs all the same checks as GitHub Actions:

1. **Cleans environment** (kills running services, removes build artifacts via `npm run clean:build`)
2. **Installs dependencies** across all packages
3. **Runs ESLint** and Prettier checks
4. **Builds all services** (backend, oauth-server, frontend)
5. **Runs all 114 unit tests** (backend + oauth-server)
6. **Runs integration tests** (Playwright E2E)
7. **Performs security audit** (non-blocking)

### Individual CI Steps

You can also run individual CI steps:

```bash
# Lint
npm run lint:all
npm run format:check

# Build
npm run build

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration:ci

# Security audit
npm run audit:all
```

### Scheduled Runs

CI also runs automatically every Monday at midnight UTC to catch dependency issues.

### CI Configuration

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the complete CI configuration.

## Test Results

### Unit Tests

After running unit tests:

- View results in the terminal
- All tests must pass (exit code 0)

### Integration Tests

After running integration tests, check:

- **Screenshots**: `integration-tests/test-results/`
- **Videos**: Available on test failures
- **HTML Report**: Generated automatically by Playwright (use `:ci` mode to skip)
- **Artifacts**: Uploaded to GitHub Actions on CI runs

## Reference Documentation

For detailed information, see:

- `integration-tests/README.md` - Complete integration test documentation
- `.github/workflows/ci.yml` - CI pipeline configuration
