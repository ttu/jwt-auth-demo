import { api } from '../api/auth';
import jwt_decode from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';

let refreshTimeout: NodeJS.Timeout | undefined = undefined;
let isRefreshing = false;

export const setAccessToken = (token: string | undefined) => {
  console.info('[Auth Service] Setting access token:', token ? 'Token present' : 'No token');
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Schedule the first refresh check after a delay
    if (refreshTimeout) {
      console.info('[Auth Service] Clearing existing refresh timeout');
      clearTimeout(refreshTimeout);
    }
    console.info('[Auth Service] Scheduling token expiration check');
    refreshTimeout = setTimeout(checkTokenExpiration, 5000); // First check 5 seconds after token is set
  } else {
    console.info('[Auth Service] Removing access token and authorization header');
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    if (refreshTimeout) {
      console.info('[Auth Service] Clearing refresh timeout');
      clearTimeout(refreshTimeout);
      refreshTimeout = undefined;
    }
  }
};

export const getAccessToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token || undefined;
};

export const tryRefreshToken = async () => {
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
    setAccessToken(undefined);
    return false;
  } finally {
    isRefreshing = false;
  }
};

const checkTokenExpiration = () => {
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

    if (timeUntilExpiration <= 2000) {
      // Refresh if token expires in less than 2 seconds
      console.info('[Auth Service] Token close to expiration, refreshing');
      tryRefreshToken();
    } else {
      // Schedule next check
      if (refreshTimeout) {
        console.info('[Auth Service] Clearing existing refresh timeout');
        clearTimeout(refreshTimeout);
      }
      const nextCheckDelay = timeUntilExpiration - 1000; // Refresh token 1 second before it expires
      console.info(`[Auth Service] Scheduling next token check in ${Math.round(nextCheckDelay / 1000)} seconds`);
      refreshTimeout = setTimeout(checkTokenExpiration, nextCheckDelay);
    }
  } catch (error) {
    console.error('[Auth Service] Error checking token expiration:', error);
    setAccessToken(undefined);
  }
};

// Initialize token check if we have a token
const token = getAccessToken();
console.info('[Auth Service] Initializing auth service. Token:', token ? 'Token present' : 'No token');
setAccessToken(token);
