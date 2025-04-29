import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthTokenRequest, OAuthTokenResponse } from '../types';
import { getAuthorizationCode, deleteAuthorizationCode } from '../store/authorization.store';
import { mockUsers } from '../mock/users';

const router = express.Router();

// Token endpoint
router.post('/token', (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, provider } = req.body as OAuthTokenRequest;

  // Validate request
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  const providerConfig = config.providers[provider];
  if (!providerConfig) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid provider' });
  }

  if (client_id !== providerConfig.clientId || client_secret !== providerConfig.clientSecret) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  const authCode = getAuthorizationCode(code);
  if (!authCode) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  if (authCode.expiresAt < Date.now()) {
    deleteAuthorizationCode(code);
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired' });
  }

  if (authCode.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid redirect_uri' });
  }

  // Generate tokens
  const accessToken = jwt.sign({ sub: mockUsers[provider].id, provider }, config.jwtSecret, {
    expiresIn: config.accessTokenExpiry,
  });

  const refreshToken = jwt.sign({ sub: mockUsers[provider].id, provider }, config.jwtSecret, {
    expiresIn: config.refreshTokenExpiry,
  });

  // Generate ID token with nonce
  const idToken = jwt.sign(
    {
      iss: 'http://localhost:3002', // Issuer
      sub: mockUsers[provider].id, // Subject
      aud: client_id, // Audience
      exp: Math.floor(Date.now() / 1000) + config.accessTokenExpiry, // Expiration time
      iat: Math.floor(Date.now() / 1000), // Issued at
      nonce: authCode.nonce, // Nonce for replay attack prevention
      provider,
    },
    config.jwtSecret
  );

  const response: OAuthTokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenExpiry,
    refresh_token: refreshToken,
    id_token: idToken,
  };

  // Clean up used authorization code
  deleteAuthorizationCode(code);

  res.json(response);
});

export default router;
