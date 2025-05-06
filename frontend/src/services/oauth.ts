import api from '../api/config';

// TODO: Move to AuthContext

export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export const initiateOAuthLogin = async (provider: OAuthProvider) => {
  try {
    const response = await api.get(`/auth/oauth/${provider}`);
    const { redirectUrl } = response.data;

    if (!redirectUrl) {
      throw new Error('Invalid redirect URL received from server');
    }

    window.location.href = redirectUrl;
  } catch (error) {
    console.error('OAuth login error:', error);
    throw error;
  }
};
