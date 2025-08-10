import { Response } from 'express';
import { settings } from '../config/settings';

/**
 * Sets a refresh token cookie with consistent configuration
 * @param res Express Response object
 * @param refreshToken The refresh token to set
 */
export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: false, // This should be true. Now false for demo purposes
    secure: settings.server.nodeEnv === 'production',
    sameSite: 'strict',
    // Only sent with requests to the refresh endpoint. The client could also decide when to send the refresh token to the backend, but this keeps control with the backend
    path: '/api/auth/refresh',
    maxAge: settings.jwt.refreshTokenExpiry * 1000, // Convert to milliseconds
  });
};
