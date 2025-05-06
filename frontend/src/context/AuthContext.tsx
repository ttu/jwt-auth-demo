import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  clearAccessToken,
  getAccessToken,
  checkTokenValidity,
  setAccessToken,
  tryRefreshToken,
  startTokenRefresh,
} from '../services/auth';
import { login, logout } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  passwordLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have a token on initial load
      const token = getAccessToken();
      console.log('[AuthContext] Initial token check', { hasAccessToken: !!token });

      // Check refresh token from cookie
      // NOTE: If httpOnly is true, the refresh token will not be accessible to JavaScript
      const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='));
      console.log('[AuthContext] Refresh token check', { hasRefreshToken: !!refreshToken });

      if (token) {
        const isTokenValid = await checkTokenValidity(token);
        if (isTokenValid) {
          startTokenRefresh(token);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }

      // If we don't have an access token, try to refresh it
      // The refresh token will be sent automatically in the cookie
      const refreshSuccess = await tryRefreshToken();
      console.log('[AuthContext] Token refresh attempt', { success: refreshSuccess });
      setIsAuthenticated(refreshSuccess);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handlePasswordLogin = async (username: string, password: string) => {
    try {
      const response = await login(username, password);
      console.log('[AuthContext] Login response', response);
      setAccessToken(response.accessToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('[AuthContext] Login failed', error);
      throw new Error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearAccessToken();
      setIsAuthenticated(false);
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
        getAccessToken,
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
