import { OAuthProvider, OAuthUserInfo } from '../types';

export const mockUsers: Record<OAuthProvider, OAuthUserInfo> = {
  google: {
    id: 'google-123',
    email: 'google.user@example.com',
    name: 'Google User',
    provider: 'google',
  },
  microsoft: {
    id: 'microsoft-123',
    email: 'microsoft.user@example.com',
    name: 'Microsoft User',
    provider: 'microsoft',
  },
  strava: {
    id: 'strava-123',
    email: 'strava.user@example.com',
    name: 'Strava User',
    provider: 'strava',
  },
  company: {
    id: 'company-123',
    email: 'company.user@example.com',
    name: 'Company User',
    provider: 'company',
  },
};
