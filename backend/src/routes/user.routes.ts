import { Router, Request, Response } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware';
import { RequestWithUser } from '../types/index';

const router = Router();

// Dummy user list data
const userList = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
];

// Protected route to get user list
router.get('/list', verifyAccessToken, (req: RequestWithUser, res: Response) => {
  try {
    // Ensure we're sending an array
    if (!Array.isArray(userList)) {
      throw new Error('User list is not an array');
    }
    res.json(userList);
  } catch (error) {
    console.error('Error in /users/list route:', error);
    res.status(500).json({ message: 'Error fetching user list' });
  }
});

// Protected route to get user profile
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
