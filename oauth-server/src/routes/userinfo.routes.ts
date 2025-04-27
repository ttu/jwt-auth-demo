import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthProvider } from '../types';
import { mockUsers } from '../mock/users';

const router = express.Router();

// User info endpoint
router.get('/userinfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; provider: OAuthProvider };
    const user = mockUsers[decoded.provider];
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'invalid_token' });
  }
});

export default router;
