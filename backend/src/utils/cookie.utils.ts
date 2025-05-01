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
    maxAge: settings.jwt.refreshTokenExpiry * 1000, // Convert to milliseconds
  });
};
