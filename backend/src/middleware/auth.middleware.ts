import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findRefreshToken, markRefreshTokenAsUsed } from '../stores/refreshToken.store';
import { isAccessTokenBlacklisted } from '../stores/tokenBlacklist.store';
import { JwtPayload, RequestWithUser } from '../types/index';
import { settings } from '../config/settings';

export const verifyAccessToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted
  if (isAccessTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, settings.jwt.accessSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyRefreshToken = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.headers['x-device-id'] as string;

  if (!refreshToken) {
    console.log('[Auth Middleware] No refresh token provided');
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  if (!deviceId) {
    console.log('[Auth Middleware] No device ID provided');
    return res.status(401).json({ message: 'Device ID is required' });
  }

  try {
    // Verify the JWT signature first
    const decoded = jwt.verify(refreshToken, settings.jwt.refreshSecret) as JwtPayload;

    // Ensure userId is a number
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;

    // Check if the token exists in our store and is not revoked or used
    const storedToken = findRefreshToken(refreshToken, userId, deviceId);

    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid, revoked, or already used refresh token' });
    }

    // Mark the token as used before proceeding
    markRefreshTokenAsUsed(refreshToken);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Refresh token verification error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};
