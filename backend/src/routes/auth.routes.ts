import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, verifyRefreshToken } from '../middleware/auth.middleware';
import { storeRefreshToken, revokeDeviceRefreshTokens } from '../stores/refreshToken.store';
import { blacklistAccessToken } from '../stores/tokenBlacklist.store';
import { DeviceInfo, JwtPayload, User, RequestWithUser, RequestHandlerWithUser } from '../types/index';
import { settings } from '../config/settings';
import { setRefreshTokenCookie } from '../utils/cookie.utils';
import { createToken, commonVerifyOptions } from '../utils/token.utils';

const router = Router();

// Dummy user data (in a real app, this would be in a database)
const users: User[] = [
  {
    id: 1,
    username: 'demo',
    password: 'password123', // In a real app, this would be hashed
  },
];

// Login route
router.post('/login', async (req: Request, res: Response) => {
  // debugger; // PASSWORD LOGIN START - User submitted username/password, validating credentials
  // We're receiving: username, password, deviceId (unique per device), user agent info
  // Next: Validate credentials against user database (demo users array)
  const { username, password } = req.body;
  const deviceId = req.headers['x-device-id'] as string;
  const userAgent = req.headers['user-agent'] as string;
  const platform = (req.headers['sec-ch-ua-platform'] as string) || 'unknown';

  console.log('[Auth route] Login request:', { username, deviceId, userAgent, platform });

  // Validate required headers
  if (!deviceId) {
    console.error('[Auth route] Login failed: Device ID is required');
    return res.status(400).json({ message: 'Device ID is required' });
  }
  if (!userAgent) {
    console.error('[Auth route] Login failed: User agent is required');
    return res.status(400).json({ message: 'User agent is required' });
  }

  const deviceInfo: DeviceInfo = {
    userAgent,
    platform,
    os: platform,
  };

  // debugger; // CREDENTIAL VALIDATION - Checking username/password against user database
  // Demo users: username='demo', password='password123'
  // Next: If valid, generate JWT access and refresh tokens
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    console.error('[Auth route] Login failed: Invalid credentials for user:', username);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    // debugger; // TOKEN GENERATION - Creating JWT access and refresh tokens for authenticated user
    // Access token: Short-lived (15 seconds for demo), used for API requests
    // Refresh token: Long-lived (7 days), used to get new access tokens
    const accessToken = createToken(user.id, user.username, settings.jwt.accessSecret, settings.jwt.accessTokenExpiry, [
      'read',
      'write',
    ]);

    const refreshToken = createToken(
      user.id,
      user.username,
      settings.jwt.refreshSecret,
      settings.jwt.refreshTokenExpiry,
      ['refresh']
    );

    // debugger; // SESSION CREATION - Storing refresh token and setting cookies
    // We're creating a device-specific session by storing the refresh token
    // Refresh token goes in HTTP-only cookie for security, access token returned to client
    storeRefreshToken(refreshToken, user.id, deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    console.log('[Auth route] Login successful:', {
      userId: user.id,
      username: user.username,
      deviceId,
      userAgent,
    });

    // Set refresh token in HTTP-only cookie using helper
    setRefreshTokenCookie(res, refreshToken);

    res.json({ accessToken });
  } catch (error) {
    console.error('[Auth route] Token generation error:', error);
    res.status(500).json({ message: 'Error generating tokens' });
  }
});

// Refresh token route
router.post('/refresh', verifyRefreshToken, (async (req: RequestWithUser, res: Response) => {
  // debugger; // TOKEN REFRESH START - Access token expired, using refresh token to get new tokens
  // Middleware already validated refresh token and populated req.user
  // Next: Generate new access token and new single-use refresh token
  try {
    const deviceId = req.headers['x-device-id'] as string;
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'] as string,
      platform: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
      os: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
    };

    // debugger; // NEW TOKEN GENERATION - Creating fresh access token and rotating refresh token
    // Access token: New 15-second token for API requests
    // Refresh token: New single-use token (old one is now invalid)
    const accessToken = createToken(
      req.user!.userId,
      req.user!.username,
      settings.jwt.accessSecret,
      settings.jwt.accessTokenExpiry,
      ['read', 'write']
    );

    // Generate new refresh token
    const newRefreshToken = createToken(
      req.user!.userId,
      req.user!.username,
      settings.jwt.refreshSecret,
      settings.jwt.refreshTokenExpiry,
      ['refresh']
    );

    // debugger; // TOKEN STORAGE - Storing new refresh token and setting cookie
    // Old refresh token is automatically invalidated (single-use)
    // New refresh token stored for future refresh attempts
    storeRefreshToken(newRefreshToken, req.user!.userId, deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    // Set the new refresh token in HTTP-only cookie using helper
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    console.error('[Auth route] Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
}) as RequestHandlerWithUser);

// Logout route
router.post('/logout', verifyAccessToken, (async (req: RequestWithUser, res: Response) => {
  const deviceId = req.headers['x-device-id'] as string;

  console.log('[Auth route] Logout request:', { deviceId, userId: req.user?.userId });

  // If device ID is provided, revoke tokens for that device
  if (deviceId) {
    try {
      revokeDeviceRefreshTokens(deviceId);
    } catch (error) {
      console.error('[Auth route] Error revoking device tokens:', error);
    }
  }

  // Blacklist the current access token
  if (req.user) {
    console.log('[Auth route] Blacklisting access token');
    blacklistAccessToken(req.user.jti);
  }

  // Always clear the refresh token cookie
  res.clearCookie('refreshToken');
  console.log('[Auth route] Logout successful');
  res.json({ message: 'Logged out successfully' });
}) as RequestHandlerWithUser);

// Invalidate current access token route
// This route should not be used by the client. Only an admin should be able to invalidate a token
router.post('/invalidate-token', async (req: RequestWithUser, res: Response) => {
  console.log('[Auth route] Invalidate token request');

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, settings.jwt.accessSecret, commonVerifyOptions) as JwtPayload;

  if (!decoded) {
    console.error('[Auth route] Invalidate token failed: Invalid access token');
    return res.status(400).json({ message: 'Invalid access token' });
  }

  try {
    blacklistAccessToken(decoded.jti);
    console.log('[Auth route] Token invalidated successfully');
    res.json({ message: 'Token invalidated successfully' });
  } catch (error) {
    console.error('[Auth route] Error invalidating token:', error);
    res.status(500).json({ message: 'Error invalidating token' });
  }
});

export default router;
