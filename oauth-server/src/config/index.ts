import { OAuthProviderConfig } from '../types';

export const config = {
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'fake-oauth-secret',
  accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '3600', 10), // 1 hour
  refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10), // 7 days
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'fake-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fake-google-client-secret',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google',
      authorizationEndpoint: '/oauth/authorize',
      tokenEndpoint: '/oauth/token',
      userInfoEndpoint: '/oauth/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || 'fake-microsoft-client-id',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'fake-microsoft-client-secret',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/microsoft',
      authorizationEndpoint: '/oauth/authorize',
      tokenEndpoint: '/oauth/token',
      userInfoEndpoint: '/oauth/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID || 'fake-strava-client-id',
      clientSecret: process.env.STRAVA_CLIENT_SECRET || 'fake-strava-client-secret',
      redirectUri: process.env.STRAVA_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/strava',
      authorizationEndpoint: '/oauth/authorize',
      tokenEndpoint: '/oauth/token',
      userInfoEndpoint: '/oauth/userinfo',
      scopes: ['read', 'activity:read'],
    },
    company: {
      clientId: process.env.COMPANY_CLIENT_ID || 'fake-company-client-id',
      clientSecret: process.env.COMPANY_CLIENT_SECRET || 'fake-company-client-secret',
      redirectUri: process.env.COMPANY_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/company',
      authorizationEndpoint: '/oauth/authorize',
      tokenEndpoint: '/oauth/token',
      userInfoEndpoint: '/oauth/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
  } as OAuthProviderConfig,
};
