# Integration Tests

This directory contains end-to-end integration tests for the React Node JWT Example application using Playwright.

## Overview

The integration tests verify the complete OAuth authentication flow across all three services:

- **Frontend** (React app on port 3000)
- **Backend** (Express API on port 3001)
- **OAuth Server** (Mock OAuth provider on port 3002)

## Test Coverage

### OAuth Authentication Flow

- ✅ Complete Google OAuth login flow
- ✅ OAuth authorization approval
- ✅ Navigation to protected routes (users, sessions)
- ✅ Logout functionality
- ✅ OAuth authorization denial handling

## Setup

### Prerequisites

- Node.js 18+ installed
- All project dependencies installed (`npm run install:all` from project root)

### Installation

```bash
# From project root
npm run install:integration

# Or from integration-tests directory
npm install
npm run install-deps  # Installs Playwright browsers
```

## Running Tests

### From Project Root

```bash
# Run integration tests
npm run test:integration

# Run with browser visible (headed mode)
npm run test:integration:headed

# Run with debug mode (step through tests)
npm run test:integration:debug

# Run with UI mode (interactive test runner)
npm run test:integration:ui
```

### From integration-tests Directory

```bash
# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Debug tests
npm run test:debug

# Interactive UI
npm run test:ui
```

## Test Structure

```
integration-tests/
├── package.json              # Dependencies and scripts
├── playwright.config.ts      # Playwright configuration
├── tests/
│   ├── oauth-flow.spec.ts    # Main OAuth flow tests
│   └── utils/
│       └── test-helpers.ts   # Test utility functions
└── test-results/             # Screenshots and reports (generated)
```

## How It Works

### Service Coordination

The tests automatically:

1. Start all three services (frontend, backend, oauth-server)
2. Wait for services to be ready with health checks
3. Run the integration tests
4. Clean up after completion

### OAuth Flow Testing

The main test follows this flow:

1. **Navigate to login page** - Verify initial state
2. **Click Google OAuth button** - Initiate OAuth flow
3. **Handle OAuth redirect** - Navigate to mock OAuth server
4. **Approve authorization** - Click approve on OAuth consent page
5. **Process callback** - Handle OAuth callback and token exchange
6. **Verify authentication** - Confirm user is authenticated
7. **Navigate to users page** - Test protected route access
8. **Navigate to sessions page** - Test another protected route
9. **Logout** - Test logout functionality
10. **Verify logout** - Confirm user is logged out

### Error Scenarios

- OAuth authorization denial
- Service unavailability handling
- Invalid token scenarios

## Debugging

### Screenshots

Tests automatically capture screenshots at key steps and on failures. Screenshots are saved to `test-results/` directory.

### Debug Mode

Run tests in debug mode to step through each action:

```bash
npm run test:integration:debug
```

### Headed Mode

See the browser actions in real-time:

```bash
npm run test:integration:headed
```

### UI Mode

Use Playwright's interactive test runner:

```bash
npm run test:integration:ui
```

## Configuration

### Service Ports

- Frontend: 3000
- Backend: 3001
- OAuth Server: 3002

### Timeouts

- Service startup: 30 seconds
- Test actions: Default Playwright timeouts
- Health checks: 30 retries with 1-second intervals

### Browser Configuration

- Default: Chromium (Desktop Chrome)
- Can be extended to test multiple browsers
- Configured for desktop viewport

## Troubleshooting

### Common Issues

#### Services Not Starting

- Ensure all dependencies are installed: `npm run install:all`
- Check if ports 3000, 3001, 3002 are available
- Verify no other instances of the services are running

#### OAuth Flow Failures

- Check OAuth server is running on port 3002
- Verify CORS configuration allows cross-origin requests
- Ensure OAuth server templates are properly built

#### Test Timeouts

- Increase service startup timeout in `playwright.config.ts`
- Check service health endpoints are responding
- Verify network connectivity between services

### Debug Information

Tests include comprehensive debugging support:

- Automatic screenshots on failure
- Video recording of test runs
- Network request logging
- Service health monitoring

Tests include comprehensive debugging support with automatic screenshots, video recording, and network request logging.
