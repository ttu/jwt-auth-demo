# 🔐 JWT Authentication Demo

[![CI](https://github.com/ttu/jwt-auth-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/ttu/jwt-auth-demo/actions/workflows/ci.yml)

A comprehensive React + Node.js demo showcasing secure JWT authentication with device-specific sessions, OAuth integration, and production-ready security features.

## ✨ Key Features

- **Multiple Authentication Methods**: Password-based and OAuth (Google, Microsoft, Strava, Company)
- **SSO (Single Sign-On)**: OAuth server with configurable SSO sessions - authorize once, auto-approved thereafter
- **Device-Specific Sessions**: Each device gets unique token chains with session management
- **Proactive Token Refresh**: Automatic background refresh prevents expiration interruptions
- **Production Security**: SHA-256 hashed token storage, token blacklisting, CSRF protection, enhanced JWT claims
- **Full OAuth 2.0**: Authorization Code Flow with OpenID Connect support + PKCE for SPAs

## 📋 Prerequisites

- **Node.js**: 22.x or higher (LTS recommended)
- **npm**: 10.x or higher

### Using asdf (optional)

If you use [asdf](https://asdf-vm.com/) for version management:

```bash
asdf plugin add nodejs
asdf install
```

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start ALL services (frontend, frontend-standalone, backend, oauth-server)
npm run dev

```

**Access:**

- Main App: http://localhost:3000 | Login: `demo` / `password123`
- Standalone App: http://localhost:3003 | OAuth providers available

## 🐛 Exploring with VS Code Debugger (Recommended)

Enable breakpoints with find and replace:

1. **Open VS Code** in the project root
2. **Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)** to open Find & Replace across files
3. **Enable Regex mode** by clicking the `.*` button
4. **Find**: `^\s*// debugger;`
5. **Replace**: `debugger;`
6. **Click "Replace All"** to uncomment all debugger statements

Start debugging by pressing **F5** or using VS Code's debug panel:

- Select **Debug Full Stack** to launch oauth-server, backend and frontend with debugging enabled
- Access: http://localhost:3000
- Choose any login method and learn through breakpoints in documented code

See [debugging guide](docs/debugging.md) for comprehensive debugging instructions.

## 🛠️ Development Scripts

### Project-Wide Commands

```bash
# Development
npm run dev                    # Start ALL services (main + standalone apps)
npm run dev:standalone         # Start standalone app + OAuth server only

# Building
npm run build                  # Build ALL services (main + standalone apps)
npm run build:frontend-standalone  # Build standalone app only

# Code Quality
npm run format:all             # Format all code
npm run lint:all               # Lint all code
npm run audit:all              # Security audit all packages

# Testing
npm run test:unit              # Run unit tests
npm run test:integration       # Run integration tests (main app)
npm run test:standalone        # Run standalone app tests

# Utilities
npm run install:all            # Install all dependencies
npm run clean                  # Clean all node_modules
```

### Individual Package Commands

Each package (frontend, frontend-standalone, backend, oauth-server) has its own scripts:

```bash
# Example for frontend-standalone
cd frontend-standalone
npm run dev                    # Start development server
npm run build                  # Build for production
npm run format                 # Format code
npm run lint                   # Lint code
npm run type-check             # TypeScript type checking
```

## 📚 Documentation

- **[System Architecture](docs/architecture.md)** - Technical architecture, authentication flows, and project structure
- **[Backend API](docs/backend.md)** - Complete API endpoint documentation and implementation details
- **[Frontend Implementation](docs/frontend.md)** - React components, state management, and UI patterns
- **[Data Model](docs/datamodel.md)** - Entities, relationships, and data structures
- **[App Description](docs/description.md)** - Features, use cases, and project overview
- **[Testing Guide](docs/testing.md)** - Unit tests, integration tests, and CI/CD pipeline

## Contributing

Contributions, issues, and feature requests are welcome! Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
