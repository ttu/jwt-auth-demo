# 🔐 JWT Authentication Demo

A comprehensive React + Node.js demo showcasing secure JWT authentication with device-specific sessions, OAuth integration, and production-ready security features.

## ✨ Key Features

- **Multiple Authentication Methods**: Password-based and OAuth (Google, Microsoft, Strava, Company)
- **Device-Specific Sessions**: Each device gets unique token chains with session management
- **Proactive Token Refresh**: Automatic background refresh prevents expiration interruptions
- **Production Security**: Token blacklisting, CSRF protection, enhanced JWT claims
- **Full OAuth 2.0**: Authorization Code Flow with OpenID Connect support

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start all services (frontend, backend, oauth-server)
npm run dev
```

Access: http://localhost:3000 | Login: `demo` / `password123`

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

## 📚 Documentation

- **[System Architecture](docs/architecture.md)** - Technical architecture, authentication flows, and project structure
- **[Backend API](docs/backend.md)** - Complete API endpoint documentation and implementation details
- **[Frontend Implementation](docs/frontend.md)** - React components, state management, and UI patterns
- **[Data Model](docs/datamodel.md)** - Entities, relationships, and data structures
- **[App Description](docs/description.md)** - Features, use cases, and project overview
- **[Integration Tests](docs/integration-tests.md)** - End-to-end testing with Playwright

## Contributing

Contributions, issues, and feature requests are welcome! Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
