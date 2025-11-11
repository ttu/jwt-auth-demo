import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthTokenRequest, OAuthTokenResponse } from '../types';
import { getAuthorizationCode, deleteAuthorizationCode } from '../stores/authorization.store';
import { mockUsers } from '../mock/users';
import { verifyPKCE } from '../utils/crypto.utils';

const router = express.Router();

// Token endpoint
router.post('/token', (req, res) => {
  // debugger; // OAUTH SERVER: Token Exchange Request - Exchanging authorization code for tokens
  // We received: grant_type, code, redirect_uri, client_id, client_secret (optional), code_verifier (PKCE)
  // Next: Validate the authorization code and PKCE, then generate access/refresh/ID tokens
  const { grant_type, code, redirect_uri, client_id, client_secret, provider, code_verifier } =
    req.body as OAuthTokenRequest;

  // Validate request
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  const providerConfig = config.providers[provider];
  if (!providerConfig) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid provider' });
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

  // Client Authentication - Verify client_secret if provided (confidential client)
  // Public clients using PKCE don't need client_secret
  const hasClientSecret = client_secret !== undefined;
  const hasPKCE = authCode.codeChallenge !== undefined;

  if (hasClientSecret) {
    // Confidential client - must validate client_secret
    if (client_id !== providerConfig.clientId || client_secret !== providerConfig.clientSecret) {
      deleteAuthorizationCode(code);
      return res.status(400).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
    }
    console.log('Client authenticated with client_secret');
  } else if (!hasPKCE) {
    // No client_secret and no PKCE - invalid request
    deleteAuthorizationCode(code);
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Either client_secret or PKCE required for authentication',
    });
  }

  // PKCE Verification - Validate code_verifier against stored code_challenge
  if (authCode.codeChallenge) {
    // If authorization request included PKCE, token request MUST include code_verifier
    if (!code_verifier) {
      deleteAuthorizationCode(code);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier required for PKCE' });
    }

    // Verify the code_verifier by hashing it and comparing to stored code_challenge
    // Default to 'S256' if method not specified (as per PKCE best practices)
    const isValid = verifyPKCE(code_verifier, authCode.codeChallenge, authCode.codeChallengeMethod || 'S256');

    if (!isValid) {
      console.error('PKCE verification failed:', {
        expected: authCode.codeChallenge.substring(0, 20) + '...',
        verifier: code_verifier.substring(0, 20) + '...',
        method: authCode.codeChallengeMethod,
      });
      deleteAuthorizationCode(code);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
    }

    console.log('PKCE verification successful');
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
