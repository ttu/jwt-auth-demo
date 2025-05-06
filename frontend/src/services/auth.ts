import { api } from '../api/auth';
import jwt_decode from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';
const TOKEN_EXPIRATION_THRESHOLD = 2000;

let refreshTimeout: NodeJS.Timeout | undefined = undefined;

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
  console.info('[Authentication] Removing access token, authorization header and refresh timeout');
  clearRefreshTimeout();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
};

const resetRefreshTimeout = (accessToken: string, logoutFunction: () => void): void => {
  clearRefreshTimeout();
  startTokenRefresh(accessToken, logoutFunction);
};

const clearRefreshTimeout = () => {
  if (refreshTimeout) {
    console.info('[Authentication] Clearing refresh timeout');
    clearTimeout(refreshTimeout);
    refreshTimeout = undefined;
  }
};

export const checkTokenValidity = (accessToken: string): boolean => {
  try {
    const decoded = jwt_decode<{ exp: number }>(accessToken);
    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiration = expirationTime - Date.now();

    if (timeUntilExpiration <= TOKEN_EXPIRATION_THRESHOLD) {
      console.info('[Authentication] Token close to expiration.');
      return false;
    }

    console.info(`[Authentication] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);
    return true;
  } catch (error) {
    console.error('[Authentication] Error checking token validity:', accessToken);
    return false;
  }
};

export const tryRefreshAccessToken = async (): Promise<string | undefined> => {
  try {
    const response = await api.post('/auth/refresh');
    console.info('[Authentication] Token refresh successful');
    return response.data.accessToken;
  } catch (error) {
    console.error('[Authentication] Token refresh failed:', error);
    return undefined;
  }
};

export const startTokenRefresh = async (accessToken: string, logoutFunction: () => void): Promise<void> => {
  const decoded = jwt_decode<{ exp: number }>(accessToken);
  const expirationTime = decoded.exp * 1000;
  const timeUntilExpiration = expirationTime - Date.now();

  if (refreshTimeout) {
    console.info('[Authentication] Clearing existing refresh timeout');
    clearTimeout(refreshTimeout);
  }

  const nextCheckDelay = timeUntilExpiration - TOKEN_EXPIRATION_THRESHOLD; // Refresh token x second before it expires
  console.info(`[Authentication] Scheduling next token check in ${Math.round(nextCheckDelay / 1000)} seconds`);
  refreshTimeout = setTimeout(() => checkTokenExpiration(logoutFunction), nextCheckDelay);
};

export const checkTokenExpiration = async (logoutFunction: () => void): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    console.info('[Authentication] No token to check expiration for');
    return;
  }

  try {
    const decoded = jwt_decode<{ exp: number }>(token);
    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiration = expirationTime - Date.now();
    console.info(`[Authentication] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);

    // Token should be refreshed if it expires in less than 2 seconds
    if (timeUntilExpiration <= TOKEN_EXPIRATION_THRESHOLD) {
      console.info('[Authentication] Token close to expiration, refreshing');
      const newAccessToken = await tryRefreshAccessToken();
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        resetRefreshTimeout(newAccessToken, logoutFunction);
      } else {
        clearAccessToken();
        logoutFunction();
      }
    } else {
      startTokenRefresh(token, logoutFunction);
    }
  } catch (error) {
    console.error('[Authentication] Error checking token expiration:', error);
    clearAccessToken();
  }
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
