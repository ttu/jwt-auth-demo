import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { getUserSessions, refreshTokens } from '../stores/refreshToken.store';
import { RequestWithUser, RequestHandlerWithUser } from '../types/index';

const router = Router();

// Get active sessions route
router.get('/', verifyAccessToken, (async (req: RequestWithUser, res) => {
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
router.post('/revoke', verifyAccessToken, (async (req: RequestWithUser, res) => {
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

export default router;
