import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { getUserSessions, refreshTokens } from '../stores/refreshToken.store';
import { RequestWithUser, RequestHandlerWithUser } from '../types/index';

const router = Router();

// Get active sessions route
router.get('/', verifyAccessToken, (async (req: RequestWithUser, res) => {
  // debugger; // SESSION LIST REQUEST - User wants to see all their active device sessions
  // Access token already validated by middleware, req.user contains userId
  // We'll return: list of devices with active refresh token chains
  console.log('[Session route] Get sessions request:', { userId: req.user?.userId, username: req.user?.username });

  try {
    // debugger; // SESSION RETRIEVAL - Fetching all active sessions for this user across devices
    // Each session = device with valid (non-expired, non-revoked) refresh token
    // Returns: deviceId, device info, creation time, last activity
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
  // debugger; // SESSION REVOCATION REQUEST - User wants to log out a specific device/session
  // We need: deviceId from request body to identify which session to revoke
  // This will invalidate the refresh token chain for that device
  const { userId, username } = req.user ?? {};
  const { deviceId } = req.body;

  console.log('[Session route] Revoke session request:', { userId, username, deviceId });

  if (!deviceId) {
    console.error('[Session route] Revoke session failed: Device ID is required');
    return res.status(400).json({ message: 'Device ID is required' });
  }

  try {
    // debugger; // ACTIVE SESSION LOOKUP - Finding the current refresh token for this device
    // We need the most recent valid (not used, not revoked) token for this device
    // This represents the "current session" for that device
    const validTokens = Array.from(refreshTokens.entries()).filter(
      ([_, data]) => data.userId === userId && data.deviceId === deviceId && !data.isUsed && !data.isRevoked
    );

    if (validTokens.length === 0) {
      console.error('[Session route] Revoke session failed: No active session found for device');
      return res.status(404).json({ message: 'No active session found for device' });
    }

    // debugger; // SESSION TERMINATION - Marking the refresh token as revoked (session ends)
    // This immediately invalidates the session - user will need to re-login on that device
    // Any pending refresh attempts from that device will fail
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
