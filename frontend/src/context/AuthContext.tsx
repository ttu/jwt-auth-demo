import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import * as refresh from '../services/tokenRefresh';
import * as token from '../utils/token';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  passwordLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// NOTE: Usually most of the auth logic is hidden in the SDK, but in this demo we want to show it in detail

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!token.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const noAccessTokenRedirect = () => {
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // debugger; // FRONTEND INIT - App startup, checking for existing authentication
      // We're checking: localStorage for access token, token validity, refresh token in cookies
      // This determines if user is already logged in or needs to authenticate
      const accessToken = token.getAccessToken();
      const isTokenValid = accessToken ? token.checkTokenValidity(accessToken) : false;

      if (isTokenValid) {
        // debugger; // VALID TOKEN FOUND - User has valid access token, setting up auto-refresh
        // We have a valid token, so user is authenticated
        // Next: Start proactive refresh system to prevent token expiration
        refresh.startTokenRefresh(accessToken!, noAccessTokenRedirect);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // debugger; // TOKEN REFRESH ATTEMPT - No valid access token, trying refresh token
      // Access token missing/expired, attempting silent refresh using HTTP-only cookie
      // This happens on page reload or when access token expires naturally
      console.info('[AuthContext] No token or token is invalid, trying to refresh');
      const newAccessToken = await refresh.getNewAccessTokenWithRefresh();
      console.log('[AuthContext] Token refresh attempt', { success: !!newAccessToken });

      if (newAccessToken) {
        // debugger; // REFRESH SUCCESS - Got new access token, user stays authenticated
        // Silent refresh worked! User doesn't need to log in again
        // Next: Store new token and start refresh cycle
        token.setAccessToken(newAccessToken);
        refresh.startTokenRefresh(newAccessToken, noAccessTokenRedirect);
      }
      setIsAuthenticated(!!newAccessToken);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handlePasswordLogin = async (username: string, password: string) => {
    // debugger; // PASSWORD LOGIN START - User submitted credentials, calling backend API
    // We're sending: username, password, device ID to backend /api/auth/login
    // Backend will validate credentials and return access token + set refresh token cookie
    try {
      const response = await authApi.login(username, password);
      const { accessToken } = response;
      console.log('[AuthContext] Login access token', accessToken);

      // debugger; // LOGIN SUCCESS - Received access token, setting up frontend authentication
      // We got access token from backend, now storing it and starting refresh system
      // Next: User will be redirected to protected content
      token.setAccessToken(accessToken);
      refresh.startTokenRefresh(accessToken, noAccessTokenRedirect);
      setIsAuthenticated(true);
    } catch (error) {
      // debugger; // LOGIN FAILED - Invalid credentials or backend error
      // Login attempt failed, user will see error message and try again
      console.log('[AuthContext] Login failed', error);
      throw new Error('Login failed');
    }
  };

  const handleLogout = async () => {
    // debugger; // LOGOUT START - User initiated logout, cleaning up authentication state
    // We're calling backend logout API and clearing all frontend auth data
    // This will invalidate refresh token and clear access token
    try {
      await authApi.logout();
      // debugger; // LOGOUT SUCCESS - Backend confirmed logout, clearing frontend state
      // Backend has invalidated refresh token, now clearing frontend storage
      // Next: Redirect user to login page
      token.clearAccessToken();
      refresh.clearRefreshTimeout();
      noAccessTokenRedirect();
    } catch (error) {
      // debugger; // LOGOUT ERROR - Backend logout failed, but clearing frontend anyway
      // Even if backend logout fails, we clear frontend state for security
      console.error('[AuthContext] Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        passwordLogin: handlePasswordLogin,
        logout: handleLogout,
        getAccessToken: token.getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
