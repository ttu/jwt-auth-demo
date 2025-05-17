import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout } from '../api/auth';
import { clearRefreshTimeout, getNewAccessTokenWithRefresh, startTokenRefresh } from '../services/tokenRefresh';
import { clearAccessToken, getAccessToken, setAccessToken, checkTokenValidity } from '../utils/token';

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

  const noAccessTokenLogout = () => {
    clearAccessToken();
    clearRefreshTimeout();
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();

      const isTokenValid = token ? checkTokenValidity(token) : false;

      if (isTokenValid) {
        setAccessToken(token!); // We need to set this so axios has the correct authorization header
        startTokenRefresh(token!, noAccessTokenLogout); // We know the token is valid, so we can start the refresh timeout
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      console.info('[Auth Context] No token to check validity for');
      // If we don't have an access token, try to refresh it
      // The refresh token will be sent automatically in the cookie
      const newAccessToken = await getNewAccessTokenWithRefresh();
      console.log('[AuthContext] Token refresh attempt', { success: !!newAccessToken });
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        startTokenRefresh(newAccessToken, noAccessTokenLogout);
      }
      setIsAuthenticated(!!newAccessToken);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handlePasswordLogin = async (username: string, password: string) => {
    try {
      const response = await login(username, password);
      const { accessToken } = response;
      console.log('[AuthContext] Login access token', accessToken);
      setAccessToken(accessToken);
      startTokenRefresh(accessToken, noAccessTokenLogout);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('[AuthContext] Login failed', error);
      throw new Error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      noAccessTokenLogout();
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
