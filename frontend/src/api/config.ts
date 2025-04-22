import axios from 'axios';

const DEVICE_ID_KEY = 'device_id';

// Generate a unique device ID or get it from storage
const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

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

export default api;
