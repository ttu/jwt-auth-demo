import api from './config';

// Set up response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    // debugger; // API ERROR INTERCEPTOR - HTTP request failed, checking if it's auth-related
    // This interceptor catches all API errors, especially 401 (unauthorized)
    // We handle token expiration here, but this app uses proactive refresh instead
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // debugger; // 401 UNAUTHORIZED - Access token expired or invalid
      // Token is expired/invalid, but this app uses background refresh
      // In other implementations, this is where you'd attempt token refresh
      // In interceptor if we don't have refresh mechanism, we should just redirect to login
      // If we have refresh mechanism, we should try to refresh the token
      // In this app we have background refresh handling, so we don't need to do anything
      //console.log('[Interceptor] Received 401, redirecting to login');
      //clearAccessToken();
      //window.location.href = '/login';
      /* Example of how we could refresh the token*/
      //console.log('[Interceptor] Received 401, trying to refresh token');
      //originalRequest._retry = true;
      //const refreshed = await tryRefreshToken();
      //if (refreshed) {
      //  console.log('[Interceptor] Token refreshed, retrying request');
      //  originalRequest.headers['Authorization'] = `Bearer ${getAccessToken()}`;
      //  return api(originalRequest);
      //}
    }

    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  // debugger; // LOGIN API CALL - Sending credentials to backend for authentication
  // We're posting username/password to /auth/login with device ID in headers
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  // debugger; // LOGOUT API CALL - Notifying backend to invalidate refresh token
  // This will revoke the refresh token on the backend
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
