import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout, getAccessToken, setAccessToken, tryRefreshToken } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have a token on initial load
      const token = getAccessToken();
      console.log('AuthContext: Initial token check', { hasAccessToken: !!token });

      // Check refresh token from cookie
      // NOTE: If httpOnly is true, the refresh token will not be accessible to JavaScript
      const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='));
      console.log('AuthContext: Refresh token check', { hasRefreshToken: !!refreshToken });

      if (!token) {
        // If we don't have an access token, try to refresh it
        // The refresh token will be sent automatically in the cookie
        const refreshed = await tryRefreshToken();
        console.log('AuthContext: Token refresh attempt', { success: refreshed });
      }

      setIsAuthenticated(!!getAccessToken());
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login: handleLogin,
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
