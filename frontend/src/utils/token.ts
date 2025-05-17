import { api } from '../api/auth';

import jwt_decode from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';

export const getAccessToken = (): string | undefined => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ?? undefined;
};

export const setAccessToken = (token: string): void => {
  console.info('[Authentication] Setting access token:', token);
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAccessToken = (): void => {
  console.info('[Authentication] Removing access token and authorization header');
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

export const getAccessTokenTimeUntilExpiration = (accessToken: string): number => {
  const decoded = jwt_decode<{ exp: number }>(accessToken);
  const expirationTime = decoded.exp * 1000;
  return expirationTime - Date.now();
};

export const consoleLogTokens = () => {
  // Check if we have a token on initial load
  const token = getAccessToken();
  console.log('[Authentication] Initial token check', { hasAccessToken: !!token });

  // Check refresh token from cookie
  // NOTE: If httpOnly is true, the refresh token will not be accessible to JavaScript
  const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='));
  console.log('[Authentication] Refresh token check', { hasRefreshToken: !!refreshToken });
};
