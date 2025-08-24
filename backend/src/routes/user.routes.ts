import { Router, Response } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { RequestWithUser } from '../types/index';

const router = Router();

// Protected route to get user profile (for the authenticated user)
router.get('/profile', verifyAccessToken, (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  res.json({
    userId: req.user.userId,
    username: req.user.username,
  });
});

export default router;