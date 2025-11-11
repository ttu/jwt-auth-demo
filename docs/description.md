# Project Description

App description, use cases, features.

## Overview

React Node JWT Example is a comprehensive demonstration of modern JWT-based authentication patterns, showcasing secure token management, OAuth integration (including PKCE for SPAs), SSO session management, and device-specific session handling in a full-stack TypeScript application. The project includes two OAuth implementations: a traditional backend-proxied flow and a modern Authorization Code + PKCE flow for single-page applications, with SSO support across both approaches.

## Use Cases

### 1. Authentication Learning

- **Target Audience**: Developers learning JWT authentication
- **Value**: Complete, production-ready authentication implementation
- **Features**: Password and OAuth login flows with security best practices

### 2. Security Reference Implementation

- **Target Audience**: Security-conscious developers
- **Value**: Demonstrates proper JWT security measures
- **Features**: Algorithm specification, token rotation, device tracking

### 3. OAuth Integration Template

- **Target Audience**: Applications requiring social login
- **Value**: Mock OAuth server for testing and development
- **Features**: Multiple provider support, proper token handling

### 4. PKCE Implementation Reference

- **Target Audience**: SPA and mobile app developers
- **Value**: Production-ready PKCE implementation (RFC 7636)
- **Features**: Pure frontend OAuth, no backend required, cryptographically secure

### 5. Session Management Example

- **Target Audience**: Applications with complex session requirements
- **Value**: Device-specific session management with SSO support
- **Features**: Session visibility, selective revocation, audit trails, cross-application SSO

### 6. SSO Implementation Reference

- **Target Audience**: Developers building OAuth providers or SSO systems
- **Value**: Production-ready SSO session management following backend patterns
- **Features**: Provider-specific sessions, configurable expiry, automatic cleanup, cross-application support

## Key Features

### Authentication Methods

- **Password Authentication**: Traditional username/password login
- **OAuth 2.0 Integration**: Support for multiple OAuth providers (Google, Microsoft, Strava, Company)
- **PKCE OAuth Flow**: Modern SPA authentication without backend (Authorization Code + PKCE)
- **Token-Based Sessions**: JWT access and refresh tokens
- **Device-Specific Sessions**: Unique sessions per device/browser

### Security Features

- **Single-Use Refresh Tokens**: Enhanced security through token rotation
- **Token Blacklisting**: Immediate token revocation capability
- **Algorithm Specification**: Protection against JWT algorithm confusion attacks
- **Secure Cookie Storage**: HTTP-only cookies for refresh tokens and SSO sessions
- **CSRF Protection**: SameSite cookie attributes and state parameters
- **PKCE Implementation**: RFC 7636 compliant with SHA-256 hashing
- **Cryptographic Security**: Web Crypto API for secure random generation
- **SHA-256 Token Hashing**: Defense-in-depth for stored refresh tokens and SSO session IDs
- **SSO Session Management**: Secure, provider-specific sessions with automatic expiration

### User Experience

- **Automatic Token Refresh**: Seamless session extension
- **Session Management UI**: View and manage active sessions
- **OAuth Provider Choice**: Multiple social login options
- **Responsive Design**: Mobile-friendly authentication interface

### Developer Experience

- **TypeScript Throughout**: Full type safety across the stack
- **Comprehensive Testing**: Unit and integration test coverage (114+ tests)
- **Mock OAuth Server**: Local development without external dependencies (with PKCE support)
- **Detailed Documentation**: Architecture, security, and PKCE flow explanations
- **Dual OAuth Examples**: Compare backend-proxied vs pure SPA approaches
- **Educational Comments**: Extensive inline documentation for learning

## Technical Highlights

### Modern Stack

- **Frontend**: React 19 with TypeScript and Vite
- **Frontend Standalone**: Pure SPA with PKCE (no backend required)
- **Backend**: Node.js with Express and TypeScript
- **OAuth Server**: Mock OAuth provider with full PKCE support
- **Testing**: Jest for unit tests (114 tests), Playwright for integration tests
- **Styling**: Tailwind CSS for responsive design

### Security Best Practices

- **JWT Security**: Proper claims, algorithm specification, audience validation
- **Token Management**: Short-lived access tokens, rotating refresh tokens
- **Storage Security**: HTTP-only cookies, secure transmission, SHA-256 hashing
- **Attack Prevention**: CSRF, XSS, replay attack, and authorization code interception mitigation
- **PKCE Security**: RFC 7636 compliant, cryptographically secure, OAuth 2.1 ready
- **OAuth 2.0 Security BCP**: Following latest OAuth security best current practices

### Production Readiness

- **Environment Configuration**: Separate development and production settings
- **Error Handling**: Comprehensive error responses and logging
- **Performance**: Efficient token validation and storage
- **Scalability**: Stateless authentication with optional token storage

## Target Applications

This implementation serves as a foundation for:

- **SaaS Applications**: Multi-tenant applications requiring secure authentication
- **E-commerce Platforms**: User account management with session security
- **Content Management Systems**: Role-based access with OAuth integration
- **API Services**: Secure API access with token-based authentication
- **Mobile Applications**: Backend services for mobile app authentication (PKCE)
- **Single-Page Applications**: Modern SPAs with OAuth 2.0 + PKCE authentication
- **Serverless Architectures**: Frontend-only apps without backend dependency
- **Progressive Web Apps**: PWAs requiring secure OAuth authentication
