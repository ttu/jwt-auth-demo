# Frontend Documentation

Views/screens, UI/UX patterns, styling.

## Overview

This project includes **two frontend applications**:

1. **Main Frontend** (port 3000): Full-featured app with backend-proxied OAuth flow
2. **Frontend Standalone** (port 3003): Pure SPA demonstrating Authorization Code + PKCE flow

## Application Structure

### Main Frontend Application (port 3000)

The main frontend application provides a complete authentication experience with backend integration.

#### Main Components

#### App.tsx

**Purpose**: Root application component with routing and authentication context
**Features**:

- Authentication state management
- Route protection based on auth status
- Global error boundary
- Theme and styling setup

#### Navigation.tsx

**Purpose**: Main navigation bar with authentication controls
**Features**:

- Login/logout buttons
- User session information display
- Responsive mobile menu
- Active route highlighting

### Authentication Views

#### Login.tsx

**Purpose**: Main authentication interface
**Features**:

- Password login form
- OAuth provider buttons
- Device ID generation and management
- Error message display
- Responsive design for mobile/desktop

#### OAuthCallback.tsx

**Purpose**: Handle OAuth provider redirects
**Features**:

- URL parameter parsing (success/error states)
- Token extraction and storage
- Automatic redirect to main application
- Error handling and display

### Protected Views

#### Customers.tsx

**Purpose**: Display customer list (demo protected endpoint)
**Features**:

- Authenticated API calls
- Loading states
- Error handling
- Customer data display

#### Sessions.tsx

**Purpose**: Session management interface
**Features**:

- Active session listing
- Device information display
- Individual session revocation
- Current session highlighting
- Bulk session management

#### DebugTokenView.tsx

**Purpose**: Development tool for token inspection
**Features**:

- JWT token decoding and display
- Token expiration monitoring
- Claims visualization
- Refresh token testing

### Frontend Standalone Application (port 3003)

The standalone application demonstrates **Authorization Code + PKCE (RFC 7636)** flow for SPAs without requiring a backend server.

#### App.tsx (Standalone)

**Purpose**: Single-page application with pure frontend OAuth + PKCE
**Features**:

- PKCE parameter generation (code_verifier, code_challenge)
- State parameter for CSRF protection
- Direct OAuth flow without backend proxy
- SessionStorage for temporary PKCE data
- Real user info from OAuth server
- Educational inline comments explaining each step

**PKCE Flow Implementation**:

```typescript
// 1. Generate PKCE parameters
const { state, codeVerifier, codeChallenge, codeChallengeMethod } = await generateOAuthParameters();

// 2. Store in sessionStorage
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('code_verifier', codeVerifier);
sessionStorage.setItem('provider', provider);

// 3. Redirect with code_challenge
const authUrl = `${OAUTH_SERVER_URL}/oauth/authorize?...&code_challenge=${codeChallenge}&code_challenge_method=S256`;

// 4. On callback, exchange code + verifier
const response = await fetch(`${OAUTH_SERVER_URL}/oauth/token`, {
  method: 'POST',
  body: JSON.stringify({
    code,
    code_verifier: codeVerifier,
    // ...
  }),
});
```

#### PKCE Utilities (frontend-standalone/src/utils/pkce.ts)

**Purpose**: RFC 7636 compliant PKCE implementation
**Functions**:

- `generateCodeVerifier(length)`: Cryptographically secure random string (43-128 chars)
- `generateCodeChallenge(verifier)`: SHA-256 hash + Base64URL encoding
- `generateState(length)`: CSRF protection parameter
- `validateCodeVerifier(verifier)`: RFC 7636 format validation
- `generateOAuthParameters()`: Complete OAuth + PKCE parameters
- `base64UrlEncode(buffer)`: URL-safe Base64 encoding

**Security Features**:

- Uses Web Crypto API (`crypto.getRandomValues()`)
- SHA-256 hashing (S256 method)
- Base64URL encoding without padding
- RFC 7636 character set compliance
- No client secret needed

**Example Usage**:

```typescript
// Generate complete OAuth parameters
const params = await generateOAuthParameters();
// {
//   state: "abc123...",
//   codeVerifier: "long_random_string...",
//   codeChallenge: "base64url_sha256_hash...",
//   codeChallengeMethod: "S256"
// }

// Validate code verifier
const isValid = validateCodeVerifier(params.codeVerifier);
```

**Why PKCE is Secure for SPAs**:

1. **No Client Secret**: SPAs can't securely store secrets
2. **Code Interception Protection**: Even if authorization code is stolen, attacker can't use it
3. **Cryptographic Proof**: code_verifier proves same client initiated and completed flow
4. **OAuth 2.1 Compliant**: Required for all public clients
5. **Approved by OAuth 2.0 Security BCP**: Modern best practice

## UI/UX Patterns

### Authentication Flow UX

#### Login Experience

```
1. User visits protected route
2. Redirect to login page
3. Show login options (password + OAuth)
4. Handle authentication
5. Redirect to original destination
```

#### OAuth Flow UX

```
1. User clicks OAuth provider button
2. Show loading state during redirect
3. Handle provider authentication
4. Return to callback page
5. Process tokens and redirect to app
```

#### Session Management UX

```
1. Display all active sessions
2. Show current session prominently
3. Allow individual session termination
4. Confirm destructive actions
5. Update UI immediately after changes
```

### Error Handling Patterns

#### Authentication Errors

- **Invalid Credentials**: Clear, actionable error messages
- **Network Issues**: Retry mechanisms with exponential backoff
- **Token Expiration**: Automatic refresh with user notification
- **OAuth Failures**: Provider-specific error explanations

#### Loading States

- **Button Loading**: Spinner in authentication buttons
- **Page Loading**: Full-page loading indicators
- **Partial Loading**: Skeleton screens for data sections
- **Background Refresh**: Subtle indicators for token refresh

### Responsive Design

#### Mobile-First Approach

- **Breakpoints**: Tailwind CSS responsive utilities
- **Touch Targets**: Minimum 44px touch areas
- **Navigation**: Collapsible mobile menu
- **Forms**: Optimized input sizing and spacing

#### Desktop Enhancements

- **Hover States**: Interactive feedback for buttons and links
- **Keyboard Navigation**: Full keyboard accessibility
- **Multi-Column Layouts**: Efficient space utilization
- **Advanced Features**: Keyboard shortcuts and power user features

## Component Architecture

### Authentication Components

#### LoginForm.tsx

```typescript
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading: boolean;
  error?: string;
}
```

**Features**:

- Form validation with real-time feedback
- Password visibility toggle
- Remember device option
- Accessibility compliance (ARIA labels, keyboard navigation)

#### OAuthButtons.tsx

```typescript
interface OAuthButtonsProps {
  providers: OAuthProvider[];
  onProviderSelect: (provider: OAuthProvider) => void;
  loading?: boolean;
}
```

**Features**:

- Provider-specific branding and icons
- Loading states per provider
- Error handling for OAuth failures
- Responsive button layout

#### OAuthButton.tsx

```typescript
interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}
```

**Features**:

- Provider-specific styling
- Loading and disabled states
- Accessibility attributes
- Icon and text layout

### Common Components

#### ErrorMessage.tsx

```typescript
interface ErrorMessageProps {
  message?: string;
  type?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

**Features**:

- Consistent error styling
- Auto-dismiss functionality
- Multiple severity levels
- Animation transitions

#### Divider.tsx

```typescript
interface DividerProps {
  text?: string;
  className?: string;
}
```

**Features**:

- Visual separation with optional text
- Consistent spacing and styling
- Customizable appearance

## State Management

### Authentication Context

#### AuthContext.tsx

```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

**State Management**:

- User authentication status
- Login/logout operations
- Error state handling
- Loading state coordination
- Automatic token refresh

### Local State Patterns

#### Form State Management

- **Controlled Components**: React state for form inputs
- **Validation State**: Real-time validation feedback
- **Submission State**: Loading and error handling
- **Reset Functionality**: Form clearing after submission

#### UI State Management

- **Modal State**: Dialog and popup management
- **Navigation State**: Active route and menu state
- **Theme State**: Dark/light mode preferences
- **Responsive State**: Mobile menu and layout state

## Styling System

### Tailwind CSS Configuration

#### Custom Theme Extensions

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
    },
  },
};
```

#### Component Classes

- **Button Variants**: Primary, secondary, danger, ghost
- **Form Elements**: Consistent input, label, and error styling
- **Layout Utilities**: Container, grid, and flexbox patterns
- **Animation Classes**: Transitions and micro-interactions

### Design System

#### Color Palette

- **Primary**: Blue tones for main actions and branding
- **Secondary**: Gray tones for supporting elements
- **Success**: Green for positive actions and states
- **Warning**: Yellow for caution and attention
- **Error**: Red for errors and destructive actions

#### Typography Scale

- **Headings**: h1-h6 with consistent sizing and spacing
- **Body Text**: Readable font sizes and line heights
- **Code**: Monospace font for technical content
- **Labels**: Smaller text for form labels and metadata

#### Spacing System

- **Base Unit**: 4px (0.25rem) for consistent spacing
- **Component Spacing**: Standardized padding and margins
- **Layout Spacing**: Consistent gaps and gutters
- **Responsive Spacing**: Adaptive spacing for different screen sizes

## Accessibility Features

### Keyboard Navigation

- **Tab Order**: Logical navigation sequence
- **Focus Indicators**: Visible focus states
- **Keyboard Shortcuts**: Common action shortcuts
- **Skip Links**: Navigation bypass for screen readers

### Screen Reader Support

- **ARIA Labels**: Descriptive labels for interactive elements
- **Role Attributes**: Semantic markup for complex components
- **Live Regions**: Dynamic content announcements
- **Alt Text**: Descriptive text for images and icons

### Visual Accessibility

- **Color Contrast**: WCAG AA compliance for text and backgrounds
- **Focus Indicators**: High contrast focus outlines
- **Text Sizing**: Scalable text that works with browser zoom
- **Motion Preferences**: Respect for reduced motion settings

## Performance Optimizations

### Code Splitting

- **Route-Based**: Lazy loading for different application sections
- **Component-Based**: Dynamic imports for large components
- **Library Splitting**: Separate chunks for third-party libraries

### Asset Optimization

- **Image Optimization**: Responsive images with appropriate formats
- **Font Loading**: Efficient web font loading strategies
- **Icon Systems**: SVG icon optimization and reuse

### Runtime Performance

- **Memoization**: React.memo for expensive components
- **Callback Optimization**: useCallback for stable function references
- **Effect Optimization**: Proper dependency arrays for useEffect
- **State Updates**: Batched updates and minimal re-renders
