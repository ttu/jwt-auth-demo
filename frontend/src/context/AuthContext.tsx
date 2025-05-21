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
      const accessToken = token.getAccessToken();
      const isTokenValid = accessToken ? token.checkTokenValidity(accessToken) : false;

      if (isTokenValid) {
        // The token is valid, so we can start the refresh timeout
        refresh.startTokenRefresh(accessToken!, noAccessTokenRedirect);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      console.info('[AuthContext] No token or token is invalid, trying to refresh');
      // If we don't have an access token, try to refresh it
      // The refresh token will be sent automatically in the cookie
      const newAccessToken = await refresh.getNewAccessTokenWithRefresh();
      console.log('[AuthContext] Token refresh attempt', { success: !!newAccessToken });
      if (newAccessToken) {
        token.setAccessToken(newAccessToken);
        refresh.startTokenRefresh(newAccessToken, noAccessTokenRedirect);
      }
      setIsAuthenticated(!!newAccessToken);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handlePasswordLogin = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      const { accessToken } = response;
      console.log('[AuthContext] Login access token', accessToken);

      token.setAccessToken(accessToken);
      refresh.startTokenRefresh(accessToken, noAccessTokenRedirect);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('[AuthContext] Login failed', error);
      throw new Error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      token.clearAccessToken();
      refresh.clearRefreshTimeout();
      noAccessTokenRedirect();
    } catch (error) {
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
