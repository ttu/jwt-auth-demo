import { v4 as uuidv4 } from 'uuid';
import api from '../api/config';

export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export const initiateOAuthLogin = async (provider: OAuthProvider) => {
  try {
    // Generate a unique device ID if not already stored
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('deviceId', deviceId);
    }

    const response = await api.get(`/auth/oauth/${provider}`);
    const { redirectUrl } = response.data;

    if (!redirectUrl) {
      throw new Error('Invalid redirect URL received from server');
    }

    // Store the current URL to return after OAuth flow
    localStorage.setItem('preOAuthUrl', window.location.href);

    // Perform the redirect
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('OAuth login error:', error);
    throw error;
  }
};
