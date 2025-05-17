import api from './config';

// Set up response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
