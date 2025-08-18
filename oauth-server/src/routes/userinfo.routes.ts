import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthProvider } from '../types';
import { mockUsers } from '../mock/users';

const router = express.Router();

// User info endpoint
router.get('/userinfo', (req, res) => {
  // debugger; // OAUTH SERVER: User Info Request - Main app requesting user profile with access token
  // We received: Authorization header with Bearer token
  // Next: Validate token and return user profile information
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // debugger; // OAUTH SERVER: Token Validation - Verifying access token and extracting user info
    // We're validating: JWT signature, expiration, extracting provider and user ID
    // Next: Return mock user profile data for this provider
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; provider: OAuthProvider };
    const user = mockUsers[decoded.provider];
    res.json(user);
  } catch (error) {
    // debugger; // OAUTH SERVER: Invalid Token - Access token validation failed
    // Token is expired, invalid signature, or malformed
    res.status(401).json({ error: 'invalid_token' });
  }
});

export default router;
