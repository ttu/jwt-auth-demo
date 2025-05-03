import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, verifyRefreshToken } from '../middleware/auth.middleware';
import { storeToken, revokeDeviceTokens } from '../stores/refreshToken.store';
import { blacklistToken } from '../stores/tokenBlacklist.store';
import { DeviceInfo, User, RequestWithUser, RequestHandlerWithUser } from '../types/index';
import { settings } from '../config/settings';
import { v4 as uuidv4 } from 'uuid';
import { setRefreshTokenCookie } from '../utils/cookie.utils';

const router = Router();

// Helper function to create JWT tokens
const createToken = (
  userId: number,
  username: string,
  deviceId: string,
  secret: string,
  expiresIn: number,
  scope: string[]
): string => {
  return jwt.sign(
    {
      iss: 'your-app-name', // Your application name
      sub: userId.toString(), // Subject (user ID)
      aud: ['api'], // Audience (which services can use this token)
      jti: uuidv4(), // Unique token ID
      userId,
      username,
      deviceId,
      scope,
      version: '1.0', // Token version
      iat: Math.floor(Date.now() / 1000), // Add issued at timestamp
    },
    secret,
    { expiresIn }
  );
};

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
  const { username, password } = req.body;
  const deviceId = req.headers['x-device-id'] as string;
  const userAgent = req.headers['user-agent'] as string;
  const platform = (req.headers['sec-ch-ua-platform'] as string) || 'unknown';

  console.log('Login request:', { username, deviceId, userAgent, platform });

  // Validate required headers
  if (!deviceId) {
    console.error('Login failed: Device ID is required');
    return res.status(400).json({ message: 'Device ID is required' });
  }
  if (!userAgent) {
    console.error('Login failed: User agent is required');
    return res.status(400).json({ message: 'User agent is required' });
  }

  const deviceInfo: DeviceInfo = {
    userAgent,
    platform,
    os: platform,
  };

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    console.error('Login failed: Invalid credentials for user:', username);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    // Generate tokens
    const accessToken = createToken(
      user.id,
      user.username,
      deviceId,
      settings.jwt.accessSecret,
      settings.jwt.accessTokenExpiry,
      ['read', 'write']
    );

    const refreshToken = createToken(
      user.id,
      user.username,
      deviceId,
      settings.jwt.refreshSecret,
      settings.jwt.refreshTokenExpiry,
      ['refresh']
    );

    // Store refresh token in memory with expiration
    storeToken(refreshToken, user.id, deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    console.log('Login successful:', {
      userId: user.id,
      username: user.username,
      deviceId,
      userAgent,
    });

    // Set refresh token in HTTP-only cookie using helper
    setRefreshTokenCookie(res, refreshToken);

    res.json({ accessToken });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ message: 'Error generating tokens' });
  }
});

// Refresh token route
router.post('/refresh', verifyRefreshToken, (async (req: RequestWithUser, res: Response) => {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'] as string,
      platform: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
      os: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
    };

    // Generate new access token
    const accessToken = createToken(
      req.user!.userId,
      req.user!.username,
      deviceId,
      settings.jwt.accessSecret,
      settings.jwt.accessTokenExpiry,
      ['read', 'write']
    );

    // Generate new refresh token
    const newRefreshToken = createToken(
      req.user!.userId,
      req.user!.username,
      deviceId,
      settings.jwt.refreshSecret,
      settings.jwt.refreshTokenExpiry,
      ['refresh']
    );

    // Store the new refresh token
    storeToken(newRefreshToken, req.user!.userId, deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    // Set the new refresh token in HTTP-only cookie using helper
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
}) as RequestHandlerWithUser);

// Logout route
router.post('/logout', verifyAccessToken, (async (req: RequestWithUser, res: Response) => {
  const deviceId = req.headers['x-device-id'] as string;
  const accessToken = req.headers.authorization?.split(' ')[1];

  console.log('Logout request:', { deviceId, userId: req.user?.userId });

  // If device ID is provided, revoke tokens for that device
  if (deviceId) {
    try {
      revokeDeviceTokens(deviceId);
    } catch (error) {
      console.error('Error revoking device tokens:', error);
    }
  }

  // Blacklist the current access token
  if (accessToken) {
    console.log('Blacklisting access token');
    blacklistToken(accessToken);
  }

  // Always clear the refresh token cookie
  res.clearCookie('refreshToken');
  console.log('Logout successful');
  res.json({ message: 'Logged out successfully' });
}) as RequestHandlerWithUser);

// Invalidate current access token route
router.post('/invalidate-token', verifyRefreshToken, async (req: Request, res: Response) => {
  console.log('Invalidate token request');

  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    console.error('Invalidate token failed: No access token provided');
    return res.status(400).json({ message: 'No access token provided' });
  }

  try {
    blacklistToken(accessToken);
    console.log('Token invalidated successfully');
    res.json({ message: 'Token invalidated successfully' });
  } catch (error) {
    console.error('Error invalidating token:', error);
    res.status(500).json({ message: 'Error invalidating token' });
  }
});

export default router;
