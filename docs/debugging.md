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

The debugger statements cover **34 strategic breakpoints** across:

#### Backend (7 breakpoints)

- **OAuth Flow**: From provider selection to session creation
- **Token Exchange**: Authorization code to access/refresh tokens
- **Token Validation**: Nonce validation and ID token verification
- **User Info Retrieval**: OAuth provider profile data
- **Session Management**: Device-specific session creation

#### OAuth Server (13 breakpoints)

- **Authorization Endpoint**: Parameter validation, SSO auto-approval, consent flow
- **Token Endpoint**: Code validation, PKCE verification, token generation
- **PKCE Verification**: Code verifier validation for public clients
- **SSO Sessions**: Cross-application single sign-on

#### Frontend - Main App (6 breakpoints)

- **OAuth Initiation**: Provider selection and authorization URL request
- **OAuth Callback**: Token receipt and session establishment
- **Error Handling**: OAuth flow failure scenarios

#### Frontend Standalone - PKCE Flow (8 breakpoints)

- **PKCE Parameter Generation**: Code verifier and code challenge creation
- **Authorization Request**: Redirecting with code_challenge
- **Callback Processing**: State verification and code exchange
- **Token Exchange**: Direct token request with code_verifier
- **PKCE Utilities**: SHA-256 hashing and Base64URL encoding

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

### 📍 Key Breakpoint Locations

#### OAuth Flow (Main App)

- `backend/src/routes/oauth.routes.ts` - OAuth flow start to session creation
- `frontend/src/services/oauth.ts` - OAuth initiation and redirects
- `frontend/src/components/OAuthCallback.tsx` - Callback processing

#### PKCE Flow (Standalone App)

- `frontend-standalone/src/App.tsx` - PKCE parameter generation and token exchange
- `frontend-standalone/src/utils/pkce.ts` - Cryptographic PKCE utilities

#### OAuth Server

- `oauth-server/src/routes/authorize.routes.ts` - Authorization and consent
- `oauth-server/src/routes/token.routes.ts` - Token exchange and PKCE verification
- `oauth-server/src/utils/crypto.utils.ts` - PKCE verification logic

### 🎓 Educational Benefits

- **Complete Flow Visibility**: See every step of OAuth 2.0 and PKCE authentication
- **Security Understanding**: Learn about nonce validation, CSRF protection, PKCE
- **Architecture Insights**: Compare confidential vs public client patterns
- **Best Practices**: See secure token management and session handling
- **Troubleshooting**: Debug authentication issues step by step
- **OAuth 2.0 Learning**: Understand authorization code flow with real implementation
