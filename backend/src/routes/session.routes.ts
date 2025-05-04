import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { getUserSessions, refreshTokens } from '../stores/refreshToken.store';
import { RequestWithUser, RequestHandlerWithUser, StoredToken } from '../types/index';

const router = Router();

// Get active sessions route
router.get('/', verifyAccessToken, (async (req: RequestWithUser, res) => {
  console.log('[Session route] Get sessions request:', { userId: req.user?.userId, username: req.user?.username });

  try {
    const sessions = getUserSessions(req.user!.userId);
    console.log('[Session route] Active sessions:', sessions);
    res.json({ sessions });
  } catch (error) {
    console.error('[Session route] Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions' });
  }
}) as RequestHandlerWithUser);

// Revoke specific session route
router.post('/revoke', verifyAccessToken, (async (req: RequestWithUser, res) => {
  const { userId, username } = req.user ?? {};
  const { deviceId } = req.body;

  console.log('[Session route] Revoke session request:', { userId, username, deviceId });

  if (!deviceId) {
    console.error('[Session route] Revoke session failed: Device ID is required');
    return res.status(400).json({ message: 'Device ID is required' });
  }

  try {
    // Find the last not used refresh token for this device
    const validTokens = Array.from(refreshTokens.entries()).filter(
      ([_, data]) => data.userId === userId && data.deviceId === deviceId && !data.isUsed && !data.isRevoked
    );

    if (validTokens.length === 0) {
      console.error('[Session route] Revoke session failed: No active session found for device');
      return res.status(404).json({ message: 'No active session found for device' });
    }

    // Find the token with the latest creation time
    const [lastNotUsedToken] = validTokens.reduce((latest, current) => {
      const [, currentData] = current;
      const [, latestData] = latest;
      return currentData.createdAt > latestData.createdAt ? current : latest;
    });

    refreshTokens.get(lastNotUsedToken)!.isRevoked = true;
    console.log('[Session route] Session revoked successfully:', { userId, deviceId });
    return res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('[Session route] Error revoking session:', error);
    res.status(500).json({ message: 'Error revoking session' });
  }
}) as RequestHandlerWithUser);

export default router;
