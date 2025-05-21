import axios from 'axios';
import { getDeviceId } from '../utils/device';
import { getAccessToken } from '../utils/token';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
    // Note: The browser automatically sends User-Agent and Sec-CH-UA-Platform headers
    // It's generally best practice to let the browser handle these headers
    // rather than setting them manually in the request
    // 'user-agent': navigator.userAgent,
    // 'sec-ch-ua-platform': navigator.platform,
  },
});

// Add a request interceptor to add the auth header
// Optionally this can be set when we receive a new access token
// api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
api.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;
