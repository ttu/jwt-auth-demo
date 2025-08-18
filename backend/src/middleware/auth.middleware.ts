import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findRefreshToken, markRefreshTokenAsUsed } from '../stores/refreshToken.store';
import { isAccessTokenBlacklisted } from '../stores/tokenBlacklist.store';
import { JwtPayload, RequestWithUser } from '../types/index';
import { settings } from '../config/settings';

export const verifyAccessToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
  // debugger; // ACCESS TOKEN VALIDATION - Checking if user has valid access token for protected routes
  // We're validating: Authorization header format, token signature, blacklist status
  // This runs before every protected API call (users list, sessions, etc.)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // debugger; // BLACKLIST CHECK - Verifying token hasn't been manually revoked/invalidated
  // Blacklisted tokens are immediately invalid even if signature is valid
  // This prevents use of tokens after logout or manual invalidation
  if (isAccessTokenBlacklisted(token)) {
    return res.status(401).json({ message: 'Token has been revoked' });
  }

  try {
    // debugger; // JWT SIGNATURE VERIFICATION - Validating token signature and extracting user info
    // If successful: req.user populated with userId, username, scope, etc.
    // If failed: Token is invalid/expired, user must refresh or re-login
    const decoded = jwt.verify(token, settings.jwt.accessSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyRefreshToken = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  // debugger; // REFRESH TOKEN VALIDATION START - User's access token expired, validating refresh token
  // We need: refresh token from HTTP-only cookie + device ID from headers
  // This is more complex than access token due to single-use requirement
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
    // debugger; // REFRESH TOKEN SIGNATURE CHECK - Verifying JWT signature and extracting claims
    // First validation: Is the token structurally valid and properly signed?
    const decoded = jwt.verify(refreshToken, settings.jwt.refreshSecret) as JwtPayload;

    // Ensure userId is a number
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;

    // debugger; // SINGLE-USE TOKEN VALIDATION - Checking if token is still valid (not used/revoked)
    // This is the key security feature: refresh tokens can only be used once
    // We check: token exists in store, not marked as used, matches device
    const storedToken = findRefreshToken(refreshToken, userId, deviceId);

    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid, revoked, or already used refresh token' });
    }

    // debugger; // TOKEN CONSUMPTION - Marking refresh token as used (single-use enforcement)
    // Once marked as used, this token can never be used again
    // New refresh token will be generated in the auth route
    markRefreshTokenAsUsed(refreshToken);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Refresh token verification error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};
