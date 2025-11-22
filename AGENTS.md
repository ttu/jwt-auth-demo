# AGENTS.md

This file provides guidance to AI agents (Claude, Cursor AI, etc.) when working with code in this repository.

## Project Overview

This is a comprehensive JWT authentication demo featuring a React frontend, Node.js backend, and a fake OAuth server. The system demonstrates secure token-based authentication with device-specific sessions, multiple OAuth providers, and comprehensive security measures including token blacklisting and automatic refresh.

## Architecture

### Multi-Service Architecture

- **Backend (port 3001)**: Node.js/Express API server with JWT authentication
- **Frontend (port 3000)**: React/Vite SPA with TypeScript (backend-proxied OAuth)
- **Frontend-Standalone (port 3003)**: React/Vite SPA demonstrating Authorization Code + PKCE flow (no backend required)
- **OAuth Server (port 3002)**: Fake OAuth server for testing OAuth flows with SSO sessions
- **Integration Tests**: Playwright-based E2E tests

### Key Components

- **Token Management**: Dual-token system (access/refresh) with device tracking
- **Session Management**: Virtual sessions via refresh token chains
- **Security Features**: Token blacklisting, CSRF protection, SHA-256 hashed token storage, automatic cleanup
- **OAuth Integration**: Support for Google, Microsoft, Strava, and Company providers
- **PKCE Support**: Frontend-standalone demonstrates Authorization Code + PKCE flow (RFC 7636) for SPAs

## Development Commands

### Root Level Commands

```bash
# Install all dependencies across services
npm run install:all

# Start ALL services in development mode (main + standalone apps)
npm run dev

# Start standalone app + OAuth server only
npm run dev:standalone

# Build all services (main + standalone apps)
npm run build

# Start all services in production mode
npm start

# Run integration tests
npm run test:integration         # Main app tests
npm run test:standalone          # Standalone app tests
npm run test:integration:debug   # with debugging
npm run test:integration:ui      # with UI
npm run test:integration:headed  # with browser UI
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

### Frontend-Standalone Commands (cd frontend-standalone/)

```bash
npm run dev        # Vite development server (port 3003)
npm run build      # TypeScript + Vite build
npm run preview    # Preview production build
npm run type-check # TypeScript type checking
```

### OAuth Server Commands (cd oauth-server/)

```bash
npm run dev   # Development with nodemon
npm run build # TypeScript compilation + asset copy
npm run start # Production start
npm run test  # Jest tests (58 unit tests)
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

### OAuth Server Architecture

- **Purpose**: Mock OAuth provider for demonstration and testing
- **Providers**: Google, Microsoft, Strava, Company (mock implementations)
- **PKCE Support**: Full RFC 7636 implementation with SHA-256 verification
- **SSO Sessions**: Configurable provider-specific sessions with auto-approval (default: 24 hours)
- **Session Storage**: SHA-256 hashed session IDs in-memory Map
- **Cleanup Service**: Automatic cleanup of expired sessions every 5 minutes

### Frontend Architecture

#### Main Frontend (port 3000)

- **Context**: AuthContext for global authentication state
- **Services**: Token refresh, OAuth handling
- **API Layer**: Fetch API with automatic token refresh interceptors
- **Components**: Modular auth components with proper separation
- **Pattern**: Backend-proxied OAuth flow with JWT tokens

#### Standalone Frontend (port 3003)

- **Pattern**: Pure SPA with Authorization Code + PKCE flow
- **Authentication**: Direct OAuth with PKCE (no backend required)
- **Security**: Web Crypto API for cryptographically secure PKCE
- **Purpose**: Demonstrates PKCE implementation for SPAs

### Token Management Flow

1. Login generates access + refresh token pair
2. Refresh tokens **hashed (SHA-256)** and stored server-side with device association
3. Access tokens auto-refresh 5 minutes before expiration
4. Token blacklisting for immediate revocation (JTI also hashed)
5. Automatic cleanup of expired tokens every hour

## Development Tips

### Common Workflows

- Always run `npm run install:all` after pulling changes
- Use `npm run dev` to start all services simultaneously (main + standalone apps)
- Use `npm run dev:standalone` to start only standalone app + OAuth server
- Main app at http://localhost:3000 (backend-proxied OAuth)
- Standalone app at http://localhost:3003 (PKCE flow, no backend)
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

---

# AI Agent Rules

## 1. Role & Context

- **Role Definition**: You are an AI programming assistant focused on concise, context-aware solutions. Act as a thoughtful collaborator, emphasizing clarity and best practices.
- **Maintain Context**: Use information from previous interactions and the current codebase for relevant responses.

## 2. Documentation (Read First!)

Documentation and Context Files in /docs folder. Use for using, creating, updating documentation.

Reference these files for understanding the project and architecture.

- `description.md`: App description, use cases, features.
- `architecture.md`: Tech stack, folder structure, testing frameworks.
- `datamodel.md`: Entities, attributes, relationships.
- `frontend.md`: Views/screens, UI/UX patterns, styling.
- `backend.md`: API endpoints, authentication, service architecture.
- `sso-implementation.md`: SSO session management and OAuth implementation details.
- `debugging.md`: Debugging guide with VS Code setup and breakpoint instructions.
- `testing.md`: Complete testing guide - unit tests (114 tests), integration tests, and CI/CD pipeline.
- `todo.md`: Task list (✅ done, ⏳ in progress, ❌ not started). Update status, don't remove tasks.
- `ai_changelog.md`: Log of changes made by AI. Add concise summaries here.
- `learnings.md`: Technical learnings, best practices, error solutions. Add new findings here.

Important files at root folder.

- `README.md`: Quick start guide, key features overview, debugging instructions, documentation links, contributing guidelines, and license information

- Do not create new documentation file for each new feature. Update existing documentation files. If new file is appropriate for the new functionality, ask for permission to create new file or update existing.

## 3. Understanding Phase (Before Any Work)

- **Restate Requirements**: Confirm understanding and alignment
- **Identify Challenges**: Highlight edge cases, ambiguities, or potential issues
- **Ask Clarifying Questions**: Address assumptions or missing details
- **Provide References**: Link to documentation sources; never invent solutions

## 4. Planning Phase

- **Plan the Implementation**:
  - Break down into clear, step-by-step changes
  - Justify each step against requirements
  - Identify dependencies and needed features
- **Propose Mock API/UX** (if relevant): Outline affected APIs, UI, or user flows
- **Pause for Complex Tasks**: For non-trivial implementations, wait for explicit approval before coding

## 5. Implementation Phase

- **Use Test-Driven Development (TDD)**:
  - ⚠️ **ALWAYS** write tests FIRST
  - Then implement code to pass tests
  - Then refactor to improve code quality (red-green-refactor)
  - Ensures quality, maintainability, test coverage

- **Write Clean, Readable Code**:
  - Use clear, descriptive names for variables, functions, and classes
  - Keep functions small and focused (single responsibility)
  - Add comments only when "why" isn't obvious from code
  - Prefer self-documenting code over excessive comments

- **Follow Good Practices**:
  - Keep code modular and reusable
  - Avoid duplication (DRY principle)
  - Make dependencies explicit and clear
  - Use pure functions whenever possible (no side effects)
  - Prefer composition over inheritance

- **Handle Errors Properly**:
  - Validate inputs and handle edge cases
  - Use appropriate error handling mechanisms (try-catch, error returns, etc.)
  - Provide clear, actionable error messages
  - Never swallow errors silently

- **Maintain Type Safety** (when applicable):
  - Use strong typing when language supports it
  - Avoid loosely-typed constructs (e.g., `any`, `void*`, untyped dicts)
  - Leverage type inference where appropriate

- **Consider Performance**:
  - Profile before optimizing (avoid premature optimization)
  - Use appropriate data structures and algorithms
  - Cache expensive computations when appropriate
  - Be mindful of memory usage and leaks

- **Security & Validation**:
  - Validate and sanitize all external inputs
  - Follow security best practices for the language/framework
  - Never trust user input
  - Use parameterized queries to prevent injection attacks

- **Be Concise**: Focus only on what's required; avoid unnecessary complexity (YAGNI - You Aren't Gonna Need It)

## 6. Verification Phase

- **Keep Code Clean**: Always format and lint after changes
- **Verify Changes**: Run relevant unit tests after significant updates
- **Update Documentation**:
  - Log changes in `ai_changelog.md`
  - Update `todo.md` status
  - Add learnings to `learnings.md`
