import { api } from '../api/auth';
import jwt_decode from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';

let refreshTimeout: NodeJS.Timeout | undefined = undefined;
let isRefreshing = false;

// TODO: Refactor checking validity, starting refresh timeouts etc.
// TODO: Move functionality to AuthContext

// Set or clear the access token
export const setAccessToken = (token: string | undefined): void => {
  console.info('[Auth Service] Setting access token:', token ? 'Token present' : 'No token');
  if (!token) {
    clearAccessToken();
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  // Schedule the first refresh check after a delay
  if (refreshTimeout) {
    console.info('[Auth Service] Clearing existing refresh timeout');
    clearTimeout(refreshTimeout);
  }
  console.info('[Auth Service] Scheduling token expiration check');
  // TODO: Fix how initial check is handled
  refreshTimeout = setTimeout(checkTokenExpiration, 5000); // First check 5 seconds after token is set
};

export const clearAccessToken = (): void => {
  console.info('[Auth Service] Removing access token and authorization header');
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  delete api.defaults.headers.common['Authorization'];
  if (refreshTimeout) {
    console.info('[Auth Service] Clearing refresh timeout');
    clearTimeout(refreshTimeout);
    refreshTimeout = undefined;
  }
};

export const getAccessToken = (): string | undefined => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token || undefined;
};

export const tryRefreshToken = async (): Promise<boolean> => {
  if (isRefreshing) {
    console.info('[Auth Service] Token refresh already in progress, skipping');
    return false;
  }

  console.info('[Auth Service] Starting token refresh');
  isRefreshing = true;
  try {
    const response = await api.post('/auth/refresh');
    console.info('[Auth Service] Token refresh successful');
    setAccessToken(response.data.accessToken);
    return true;
  } catch (error) {
    console.error('[Auth Service] Token refresh failed:', error);
    clearAccessToken();
    return false;
  } finally {
    isRefreshing = false;
  }
};

export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  const decoded = jwt_decode<{ exp: number }>(accessToken);
  const expirationTime = decoded.exp * 1000;
  const timeUntilExpiration = expirationTime - Date.now();
  console.info(`[Auth Service] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);

  if (timeUntilExpiration <= 2000) {
    console.info('[Auth Service] Token close to expiration, refreshing');
    return await tryRefreshToken();
  }

  return true;
};

export const startTokenRefresh = async (accessToken: string): Promise<void> => {
  const decoded = jwt_decode<{ exp: number }>(accessToken);
  const expirationTime = decoded.exp * 1000;
  const timeUntilExpiration = expirationTime - Date.now();

  if (refreshTimeout) {
    console.info('[Auth Service] Clearing existing refresh timeout');
    clearTimeout(refreshTimeout);
  }

  const nextCheckDelay = timeUntilExpiration - 1000; // Refresh token 1 second before it expires
  console.info(`[Auth Service] Scheduling next token check in ${Math.round(nextCheckDelay / 1000)} seconds`);
  refreshTimeout = setTimeout(checkTokenExpiration, nextCheckDelay);
};

export const checkTokenExpiration = async (): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    console.info('[Auth Service] No token to check expiration for');
    return;
  }

  try {
    const decoded = jwt_decode<{ exp: number }>(token);
    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiration = expirationTime - Date.now();
    console.info(`[Auth Service] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);

    // Token should be refreshed if it expires in less than 2 seconds
    if (timeUntilExpiration <= 2000) {
      console.info('[Auth Service] Token close to expiration, refreshing');
      await tryRefreshToken();
    } else {
      startTokenRefresh(token);
    }
  } catch (error) {
    console.error('[Auth Service] Error checking token expiration:', error);
    clearAccessToken();
  }
};
