import { Router, Response } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { RequestWithUser } from '../types/index';
import { getOAuthUser } from '../stores/oauth-users.store';

const router = Router();

// Protected route to get user profile (for the authenticated user)
router.get('/profile', verifyAccessToken, (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const oauthUserInfo = getOAuthUser(req.user.username);

  if (oauthUserInfo) {
    res.json({
      userId: req.user.userId,
      username: req.user.username,
      email: oauthUserInfo.email,
      name: oauthUserInfo.name,
      provider: oauthUserInfo.provider,
      authType: 'oauth',
    });
  } else {
    res.json({
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.username, // For local users, username is the email
      provider: 'local',
      authType: 'password',
    });
  }
});

export default router;
