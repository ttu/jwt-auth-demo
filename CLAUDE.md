# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive JWT authentication demo featuring a React frontend, Node.js backend, and a fake OAuth server. The system demonstrates secure token-based authentication with device-specific sessions, multiple OAuth providers, and comprehensive security measures including token blacklisting and automatic refresh.

## Architecture

### Multi-Service Architecture

- **Backend (port 3001)**: Node.js/Express API server with JWT authentication
- **Frontend (port 3000)**: React/Vite SPA with TypeScript
- **OAuth Server (port 3002)**: Fake OAuth server for testing OAuth flows
- **Integration Tests**: Playwright-based E2E tests

### Key Components

- **Token Management**: Dual-token system (access/refresh) with device tracking
- **Session Management**: Virtual sessions via refresh token chains
- **Security Features**: Token blacklisting, CSRF protection, SHA-256 hashed token storage, automatic cleanup
- **OAuth Integration**: Support for Google, Microsoft, Strava, and Company providers

## Development Commands

### Root Level Commands

```bash
# Install all dependencies across services
npm run install:all

# Start all services in development mode
npm run dev

# Build all services
npm run build

# Start all services in production mode
npm start

# Run integration tests
npm run test:integration
npm run test:integration:debug  # with debugging
npm run test:integration:ui     # with UI
npm run test:integration:headed # with browser UI
```

### Backend Commands (cd backend/)

```bash
npm run dev        # Development with nodemon
npm run build      # TypeScript compilation
npm run start      # Production start
npm run test       # Jest unit tests
npm run test:watch # Jest in watch mode
```

### Frontend Commands (cd frontend/)

```bash
npm run dev     # Vite development server
npm run build   # TypeScript + Vite build
npm run preview # Preview production build
```

### OAuth Server Commands (cd oauth-server/)

```bash
npm run dev   # Development with nodemon
npm run build # TypeScript compilation + asset copy
npm run start # Production start
npm run test  # Jest tests
```

### Integration Tests (cd integration-tests/)

```bash
npm test              # Run all Playwright tests
npm run test:debug    # Run with debugging
npm run test:ui       # Run with Playwright UI
npm run test:headed   # Run with visible browser
npm run install-deps  # Install Playwright browsers
```

## Key Technical Details

### Token System

- **Access Tokens**: 15 seconds (demo), stored in memory
- **Refresh Tokens**: 7 days, HTTP-only cookies, single-use
- **Device Tracking**: Each device gets unique token chain
- **Blacklisting**: Immediate token invalidation support

### Authentication Flows

1. **Password Auth**: Traditional email/password with enhanced JWT claims
2. **OAuth Flow**: Full OAuth 2.0 + OpenID Connect implementation
3. **Token Refresh**: Automatic background refresh system
4. **Session Management**: Device-based session tracking and revocation

### Security Implementation

- Enhanced JWT claims (iss, aud, jti, scope, version, deviceId)
- HTTP-only cookies with SameSite=strict
- CSRF protection via state parameters
- **SHA-256 hashed refresh token storage** (defense-in-depth)
- Token blacklisting and cleanup
- Nonce validation for replay attack prevention

### Environment Configuration

Backend requires these environment variables (defaults provided):

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY`
- `PORT` / `NODE_ENV`

### Testing Strategy

- **Unit Tests (114 tests)**:
  - Backend (56 tests): Token utils, OAuth utils, refresh token store, auth flows
  - OAuth Server (58 tests): Authorization store, configuration
  - Run: `npm run test:unit`
- **Integration Tests**: Playwright E2E tests for full OAuth and password flows
  - Run: `npm run test:integration`
- **CI Pipeline**: GitHub Actions runs all tests on push/PR + weekly schedule
  - Run locally: `./test-ci.sh`
- **Manual Testing**: Login with demo/password123

## Code Structure Notes

### Backend Architecture

- **Stores**: In-memory token management (refreshToken, tokenBlacklist, nonce)
- **Services**: Token cleanup, OAuth utilities
- **Middleware**: JWT validation with comprehensive error handling
- **Utils**: Token creation/validation, cookie management, OAuth helpers

### Frontend Architecture

- **Context**: AuthContext for global authentication state
- **Services**: Token refresh, OAuth handling
- **API Layer**: Axios-based with automatic token refresh interceptors
- **Components**: Modular auth components with proper separation

### Token Management Flow

1. Login generates access + refresh token pair
2. Refresh tokens **hashed (SHA-256)** and stored server-side with device association
3. Access tokens auto-refresh 5 minutes before expiration
4. Token blacklisting for immediate revocation (JTI also hashed)
5. Automatic cleanup of expired tokens every hour

## Development Tips

### Common Workflows

- Always run `npm run install:all` after pulling changes
- Use `npm run dev` to start all services simultaneously
- Backend API available at http://localhost:3001/api
- OAuth server UI at http://localhost:3002
- Check integration tests for OAuth flow examples

### After Completing Features

**IMPORTANT**: After completing any feature or making significant changes, run the following commands:

```bash
# 1. Format all code
npm run format

# 2. Fix linting issues automatically
npm run lint:fix

# 3. Run complete CI pipeline locally (cleans, lints, builds, tests)
./test-ci.sh
```

The `test-ci.sh` script runs all the same checks as GitHub Actions CI:

1. Cleans environment (kills services, removes build artifacts)
2. Installs dependencies
3. Runs ESLint and Prettier checks
4. Builds all services
5. Runs all 114 unit tests
6. Runs integration tests
7. Performs security audit

This ensures your changes are ready to push and will pass CI checks.

### Debugging

- Backend logs include detailed token validation steps
- Frontend stores tokens in memory (check AuthContext)
- OAuth server provides authorization UI for testing flows
- Use browser dev tools to inspect HTTP-only cookies
- Integration tests provide visual screenshots of flows

### Security Considerations

- Never commit JWT secrets or real OAuth credentials
- HTTP-only cookies disabled in demo for easier debugging
- Token expiry intentionally short for demonstration
- All OAuth providers are fake/mocked for testing

## Documentation

Documentation and Context Files in /docs folder. Use for using, creating, updating documentation.

Reference these files for understanding the project and architecture.

- `description.md`: App description, use cases, features.
- `architecture.md`: Tech stack, folder structure, testing frameworks.
- `datamodel.md`: Entities, attributes, relationships.
- `frontend.md`: Views/screens, UI/UX patterns, styling.
- `backend.md`: API endpoints, authentication, service architecture.
- `debugging.md`: Debugging guide with VS Code setup and breakpoint instructions.
- `testing.md`: Complete testing guide - unit tests (114 tests), integration tests, and CI/CD pipeline.
- `todo.md`: Task list (✅ done, ⏳ in progress, ❌ not started). Update status, don't remove tasks.
- `ai_changelog.md`: Log of changes made by AI. Add concise summaries here.
- `learnings.md`: Technical learnings, best practices, error solutions. Add new findings here.

Important files at root folder.

- `README.md`: Quick start guide, key features overview, debugging instructions, documentation links, contributing guidelines, and license information
