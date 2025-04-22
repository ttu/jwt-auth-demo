import api from './config';
import jwt_decode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

const AUTH_INTERVAL_MS = 60000; // Check every minute
const TOKEN_REFRESH_THRESHOLD = 5; // Refresh 5 minutes before expiration
const INITIAL_REFRESH_DELAY = 5000; // Wait 5 seconds before first refresh check
const ACCESS_TOKEN_KEY = 'access_token';
const DEVICE_ID_KEY = 'device_id';

// Generate or retrieve device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// Set device ID in headers for all requests
api.defaults.headers.common['x-device-id'] = getDeviceId();

let refreshTimeout: NodeJS.Timeout | null = null;
let isRefreshing = false;

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Schedule the first refresh check after a delay
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(checkTokenExpiration, INITIAL_REFRESH_DELAY);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  }
};

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    setAccessToken(response.data.accessToken);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  }
};

export const getActiveSessions = async () => {
  try {
    const response = await api.get('/auth/sessions');
    return response.data.sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const revokeSession = async (deviceId: string) => {
  try {
    await api.post('/auth/sessions/revoke', { deviceId });
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};

export const tryRefreshToken = async () => {
  if (isRefreshing) {
    return false;
  }

  isRefreshing = true;
  try {
    const response = await api.post('/auth/refresh');
    setAccessToken(response.data.accessToken);
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    setAccessToken(null);
    return false;
  } finally {
    isRefreshing = false;
  }
};

const checkTokenExpiration = () => {
  const token = getAccessToken();
  if (!token) {
    return;
  }

  try {
    const decoded = jwt_decode<{ exp: number }>(token);
    const expirationTime = decoded.exp * 1000;
    const timeUntilExpiration = expirationTime - Date.now();

    // We refresh the token before it expires to:
    // 1. Avoid race conditions where the token might expire during a request
    // 2. Ensure smooth user experience without interruptions
    // 3. Prevent failed requests due to expired tokens
    // 4. Allow time for the refresh operation to complete before the current token expires
    if (timeUntilExpiration <= AUTH_INTERVAL_MS * TOKEN_REFRESH_THRESHOLD) {
      tryRefreshToken();
    } else {
      // Schedule next check
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(
        checkTokenExpiration,
        timeUntilExpiration - AUTH_INTERVAL_MS * TOKEN_REFRESH_THRESHOLD
      );
    }
  } catch (error) {
    console.error('Error checking token expiration:', error);
    setAccessToken(null);
  }
};

// Set up response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        originalRequest.headers['Authorization'] = `Bearer ${getAccessToken()}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Initialize token check if we have a token
const token = getAccessToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  setTimeout(checkTokenExpiration, INITIAL_REFRESH_DELAY);
}

// Export the configured API instance
export default api;
