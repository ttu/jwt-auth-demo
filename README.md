# React Node JWT Authentication Demo

A demonstration of JWT-based authentication with React frontend and Node.js backend, featuring secure token management and device-specific sessions.

## Features

- **Secure Authentication**

  - JWT-based authentication with access and refresh tokens
  - HTTP-only cookies for refresh tokens
  - Device-specific session management
  - Token blacklisting for immediate invalidation

- **Token Management**

  - Short-lived access tokens (15 minutes)
  - Long-lived refresh tokens with expiration (7 days)
  - Proactive token refresh system:
    - Checks token expiration every minute
    - Refreshes tokens 5 minutes before expiration
    - Prevents race conditions from multiple simultaneous refresh attempts
    - Ensures smooth user experience without token expiration interruptions

- **Session Management**

  - Device-specific sessions
  - Session listing and management
  - Ability to revoke specific device sessions
  - Automatic cleanup of expired sessions

- **Security Features**
  - CSRF protection with SameSite cookies
  - XSS protection with HTTP-only cookies
  - Token blacklisting for immediate invalidation
  - Device tracking and management

## Project Structure

```
.
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication middleware
│   │   ├── stores/         # In-memory token stores
│   │   └── server.js       # Express server setup
│   └── package.json
│
└── frontend/               # React frontend
    ├── src/
    │   ├── api/           # API client and services
    │   ├── components/    # React components
    │   ├── context/       # React context providers
    │   └── App.tsx        # Main application component
    └── package.json
```

## Authentication Flow

1. **Login**

   - User provides credentials
   - Client generates unique device ID and includes it in request header:
     ```
     X-Device-Id: <unique_device_id>
     ```
   - Server generates:
     - Short-lived access token (15 minutes)
     - Long-lived refresh token (7 days)
   - Refresh token stored in HTTP-only cookie
   - Access token returned to client

2. **Access Token Usage**

   - Client stores access token in memory (not localStorage)
   - Access token included in Authorization header for all protected API requests:
     ```
     Authorization: Bearer <access_token>
     ```
   - Server validates access token on each request
   - If token is invalid or expired, client receives 401 response
   - Client-side interceptor handles token refresh on 401 responses

3. **Token Refresh**

   - Proactive refresh system:
     - Monitors token expiration continuously
     - Refreshes token 5 minutes before expiration
     - Prevents race conditions from multiple refresh attempts
     - Ensures uninterrupted user experience
   - Server validates refresh token
   - New access token issued if refresh token valid

4. **Session Management**
   - Each device gets unique refresh token
   - Sessions tracked by device ID
   - Users can view and revoke sessions
   - Expired sessions automatically cleaned up

## Security Measures

- **Access Tokens**

  - Short-lived (15 minutes)
  - Stored in memory
  - Can be blacklisted if compromised
  - Proactively refreshed to prevent expiration during use

- **Refresh Tokens**

  - Long-lived (7 days)
  - Stored in HTTP-only cookies
  - Device-specific
  - Automatically expire

- **Cookies**
  - HTTP-only (prevents XSS)
  - SameSite=strict (prevents CSRF)
  - Secure in production

## Environment Variables

### Backend

```env
PORT=3001
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=900        # 15 minutes in seconds
REFRESH_TOKEN_EXPIRY=604800    # 7 days in seconds
NODE_ENV=development
```

### Frontend

```env
VITE_API_URL=http://localhost:3001/api
```

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/react-node-jwt-example.git
   cd react-node-jwt-example
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the values as needed

4. **Start the development servers**

   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd ../frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/invalidate-token` - Invalidate current access token

### Session Management

- `GET /auth/sessions` - Get active sessions
- `POST /auth/sessions/revoke` - Revoke specific session

### Users

- `GET /users/list` - Get list of users (protected)

## Security Considerations

1. **Token Storage**

   - Access tokens stored in memory
   - Refresh tokens in HTTP-only cookies
   - No sensitive data in localStorage

2. **Token Expiration**

   - Access tokens: 15 minutes
   - Refresh tokens: 7 days
   - Automatic cleanup of expired tokens
   - Proactive refresh 5 minutes before expiration

3. **Device Management**

   - Each device gets unique refresh token
   - Sessions can be monitored and revoked
   - Device information tracked for security

4. **Error Handling**
   - Proper error messages for security events
   - Graceful handling of token expiration
   - Secure error responses

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
