import { Response } from 'express';
import { config } from '../config';

/**
 * SSO session cookie name
 */
export const SSO_COOKIE_NAME = 'oauth_sso_session';

/**
 * Sets an SSO session cookie with consistent configuration
 * Follows the same pattern as backend's setRefreshTokenCookie
 * @param res Express Response object
 * @param sessionId The session ID to set
 */
export const setSSOSessionCookie = (res: Response, sessionId: string): void => {
  res.cookie(SSO_COOKIE_NAME, sessionId, {
    httpOnly: false, // This should be true. Now false for demo purposes (same as backend)
    secure: config.server.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/oauth', // Limit cookie to OAuth endpoints
    maxAge: config.sso.sessionExpiry * 1000, // Convert to milliseconds
  });

  console.log('[SSO Cookie] Set session cookie', {
    sessionId: sessionId.substring(0, 16) + '...',
    maxAge: config.sso.sessionExpiry,
  });
};

/**
 * Clears the SSO session cookie
 * @param res Express Response object
 */
export const clearSSOSessionCookie = (res: Response): void => {
  res.clearCookie(SSO_COOKIE_NAME, {
    httpOnly: false,
    secure: config.server.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/oauth',
  });

  console.log('[SSO Cookie] Cleared session cookie');
};
