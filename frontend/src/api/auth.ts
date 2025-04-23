import api from './config';
import { getAccessToken, tryRefreshToken } from '../services/auth';

// Set up response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Interceptor] Received 401, refreshing token');
      originalRequest._retry = true;
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        console.log('[Interceptor] Token refreshed, retrying request');
        originalRequest.headers['Authorization'] = `Bearer ${getAccessToken()}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
};

export const getActiveSessions = async () => {
  const response = await api.get('/auth/sessions');
  return response.data.sessions;
};

export const revokeSession = async (deviceId: string) => {
  await api.post('/auth/sessions/revoke', { deviceId });
};

export { api };
