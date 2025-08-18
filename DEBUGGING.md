# 🐛 Debugging Guide

This guide provides comprehensive debugging information for the React Node JWT Authentication Demo project.

## 🔧 Debugging with VS Code

This project includes pre-configured VS Code debugging settings for both frontend and backend services. The configuration supports debugging the full stack or individual services.

### Available Debug Configurations

- **Debug Backend** - Debug the Node.js backend server
- **Debug OAuth Server** - Debug the fake OAuth server
- **Debug Frontend** - Debug the React frontend in Chrome
- **Debug Full Stack** - Debug all services simultaneously (backend, frontend, oauth-server)

## 📚 Educational Debugging with Breakpoints

This project includes **strategically placed debugger statements** throughout the authentication flow to help understand how JWT authentication works. These debugger statements are commented out by default.

### ✅ Enabling Debugger Statements

To enable the educational debugging breakpoints for demonstrations or learning:

#### Using VS Code Find & Replace

1. **Open VS Code** in the project root
2. **Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)** to open Find & Replace across files
3. **Enable Regex mode** by clicking the `.*` button
4. **Find**: `^\s*// debugger;`
5. **Replace**: `debugger;`
6. **Click "Replace All"** to uncomment all debugger statements

### ❌ Disabling Debugger Statements

To disable all debugger statements (restore default state):

- **Find**: `^\s*debugger;`
- **Replace**: `// debugger;`

### 🗺️ Debugging Flow Coverage

The debugger statements cover:

#### Backend

- **OAuth Flow**: From provider selection to session creation
- **Password Authentication**: Credential validation to token generation
- **Token Refresh**: Automatic token renewal process
- **Authentication Middleware**: Token validation and security checks
- **Session Management**: Multi-device session tracking

#### OAuth Server

- **Authorization Endpoint**: User consent and authorization code generation
- **Token Endpoint**: Authorization code exchange for tokens
- **User Info Endpoint**: Access token validation and user profile retrieval

#### Frontend

- **AuthContext**: Authentication state management
- **Token Refresh Service**: Proactive token renewal
- **OAuth Components**: OAuth initiation and callback handling
- **Login Component**: User interaction handling
- **API Layer**: HTTP request/response handling

### 🚀 Using the Debugger

1. **Enable breakpoints** using one of the methods above
2. **Start debugging** with VS Code:
   - Use "Debug Full Stack" to see both frontend and backend
   - Use individual configurations for focused debugging
3. **Follow the flow**: Each debugger statement includes detailed comments explaining:
   - What just happened
   - What data is available to inspect
   - What will happen next
   - Security implications of the current step

### Educational Benefits

- **Complete Flow Visibility**: See every step of JWT authentication
- **Security Understanding**: Learn about nonce validation, token rotation, CSRF protection
- **Architecture Insights**: Understand client-server authentication patterns
- **Best Practices**: See how to implement secure authentication
- **Troubleshooting**: Debug authentication issues step by step
