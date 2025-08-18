# Integration Tests Setup & Usage

## Quick Start

### 1. Install Dependencies

```bash
# Install all project dependencies including integration tests
npm run install:all

# Install Playwright browsers
npm run install:integration
```

### 2. Run Integration Tests

```bash
# Run the complete OAuth flow test
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

## Test Modes

### Standard Mode

```bash
npm run test:integration
```

Runs tests headlessly with automatic service startup.

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

## Test Results

After running tests, check:

- **Screenshots**: `integration-tests/test-results/`
- **Videos**: Available on test failures
- **HTML Report**: Generated automatically by Playwright

## Reference Documentation

For detailed information, see:

- `integration-tests/README.md` - Complete test documentation
