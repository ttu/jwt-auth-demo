import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, verifyRefreshToken } from '../middleware/auth.middleware';
import {
  storeToken,
  getUserSessions,
  cleanupExpiredTokens,
  revokeDeviceTokens,
  refreshTokens,
} from '../stores/refreshToken.store';
import { blacklistToken, cleanupBlacklist } from '../stores/tokenBlacklist.store';
import { DeviceInfo, User, RequestWithUser, OAuthUserInfo, RequestHandlerWithUser } from '../types/index';
import { settings } from '../config/settings';

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
    const accessToken = jwt.sign({ userId: user.id, username: user.username }, settings.jwt.accessSecret, {
      expiresIn: settings.jwt.accessTokenExpiry,
    });

    const refreshToken = jwt.sign({ userId: user.id, username: user.username }, settings.jwt.refreshSecret, {
      expiresIn: settings.jwt.refreshTokenExpiry,
    });

    // Store refresh token in memory with expiration
    storeToken(refreshToken, user.id, deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    console.log('Login successful:', {
      userId: user.id,
      username: user.username,
      deviceId,
      userAgent,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: false, // This should be true. Now false for demo purposes
      secure: settings.server.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: settings.jwt.refreshTokenExpiry * 1000, // Convert to milliseconds
    });

    res.json({ accessToken });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ message: 'Error generating tokens' });
  }
});

// Refresh token route
router.post('/refresh', verifyRefreshToken, (async (req: RequestWithUser, res: Response) => {
  try {
    const accessToken = jwt.sign(
      { userId: req.user!.userId, username: req.user!.username },
      settings.jwt.accessSecret,
      { expiresIn: settings.jwt.accessTokenExpiry }
    );

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

// Get active sessions route
router.get('/sessions', verifyAccessToken, (async (req: RequestWithUser, res: Response) => {
  console.log('Get sessions request:', { userId: req.user?.userId, username: req.user?.username });

  try {
    const sessions = getUserSessions(req.user!.userId);
    console.log('Active sessions:', sessions);
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
}) as RequestHandlerWithUser);

// Revoke specific session route
router.post('/sessions/revoke', verifyAccessToken, (async (req: RequestWithUser, res: Response) => {
  const { userId, username } = req.user ?? {};
  const { sessionId } = req.body;

  console.log('Revoke session request:', { userId, username, sessionId });

  if (!sessionId) {
    console.error('Revoke session failed: Session ID is required');
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    // Find the token with the matching ID
    for (const [token, data] of refreshTokens.entries()) {
      if (data.id === sessionId && data.userId === userId) {
        data.isRevoked = true;
        console.log('Session revoked successfully:', { userId, sessionId });
        return res.json({ message: 'Session revoked successfully' });
      }
    }

    console.error('Revoke session failed: Session not found');
    return res.status(404).json({ message: 'Session not found' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ message: 'Error revoking session' });
  }
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

// Clean up expired tokens and blacklist periodically
setInterval(() => {
  cleanupExpiredTokens();
  cleanupBlacklist();
}, 60 * 60 * 1000); // Every hour

export default router;
