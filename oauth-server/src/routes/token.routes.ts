import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthTokenRequest, OAuthTokenResponse } from '../types';
import { getAuthorizationCode, deleteAuthorizationCode } from '../store/authorization.store';
import { mockUsers } from '../mock/users';

const router = express.Router();

// Token endpoint
router.post('/token', (req, res) => {
  // debugger; // OAUTH SERVER: Token Exchange Request - Main app exchanging authorization code for tokens
  // We received: grant_type, code, redirect_uri, client_id, client_secret, provider
  // Next: Validate the authorization code and generate access/refresh/ID tokens
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

  // debugger; // OAUTH SERVER: Authorization Code Validation - Checking if code is valid and not expired
  // We're validating: code exists, not expired, matches redirect_uri
  // This ensures the code wasn't tampered with or used before
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

  // debugger; // OAUTH SERVER: Token Generation - Creating OAuth tokens for authenticated user
  // We're generating: access_token (API access), refresh_token (renewal), id_token (identity)
  // These tokens will be sent back to main application
  const accessToken = jwt.sign(
    {
      iss: 'your-oauth-server-name',
      sub: mockUsers[provider].id,
      provider,
      aud: ['idp'],
      iat: Math.floor(Date.now() / 1000),
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenExpiry,
    }
  );

  const refreshToken = jwt.sign(
    {
      iss: 'your-oauth-server-name',
      sub: mockUsers[provider].id,
      provider,
      aud: ['idp'],
      iat: Math.floor(Date.now() / 1000), // Issi
    },
    config.jwtSecret,
    {
      expiresIn: config.refreshTokenExpiry,
    }
  );

  // debugger; // OAUTH SERVER: ID Token Creation - Creating ID token with nonce for security
  // ID token contains: user identity, nonce (prevents replay attacks), standard OIDC claims
  // This proves user identity to the main application
  const idToken = jwt.sign(
    {
      iss: 'your-oauth-server-name', // Issuer
      sub: mockUsers[provider].id, // Subject
      aud: ['idp'], // Audience
      exp: Math.floor(Date.now() / 1000) + config.accessTokenExpiry, // Expiration time
      iat: Math.floor(Date.now() / 1000), // Issued at
      nonce: authCode.nonce, // Nonce for replay attack prevention
      provider,
    },
    config.jwtSecret
  );

  // debugger; // OAUTH SERVER: Token Response - Sending tokens back to main application
  // We're sending: access_token, refresh_token, id_token, expires_in, token_type
  // Main app will use these tokens to authenticate the user
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
