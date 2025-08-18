import api from '../api/config';

// TODO: Move to AuthContext

export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export const initiateOAuthLogin = async (provider: OAuthProvider) => {
  // debugger; // OAUTH INITIATION - User clicked OAuth provider button, requesting authorization URL
  // We're calling backend to get OAuth authorization URL with state/nonce parameters
  // Backend will prepare CSRF protection and redirect URL for this provider
  try {
    const response = await api.get(`/auth/oauth/${provider}`);
    const { redirectUrl } = response.data;

    if (!redirectUrl) {
      throw new Error('Invalid redirect URL received from server');
    }

    // debugger; // OAUTH REDIRECT - Got authorization URL, redirecting user to OAuth server
    // User will be redirected to fake OAuth server for authentication
    // After authentication, OAuth server will redirect back to our callback
    window.location.href = redirectUrl;
  } catch (error) {
    // debugger; // OAUTH ERROR - Failed to initiate OAuth flow
    console.error('OAuth login error:', error);
    throw error;
  }
};
