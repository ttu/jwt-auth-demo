import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { OAuthAuthorizationRequest, OAuthTokenRequest, OAuthTokenResponse, OAuthProvider } from '../types';
import { setAuthorizationCode, getAuthorizationCode, deleteAuthorizationCode } from '../store/authorization.store';
import { mockUsers } from '../mock/users';

const router = express.Router();

// Authorization endpoint
router.get('/authorize', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state, provider } =
    req.query as unknown as OAuthAuthorizationRequest;

  console.log('Authorization request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    provider,
    query: req.query,
    headers: req.headers,
  });

  // Validate request
  if (response_type !== 'code') {
    return res.status(400).json({ error: 'invalid_request', error_description: 'response_type must be code' });
  }

  const providerConfig = config.providers[provider];
  if (!providerConfig) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid provider' });
  }

  if (client_id !== providerConfig.clientId) {
    return res.status(400).json({ error: 'invalid_client', error_description: 'Invalid client_id' });
  }

  // Validate redirect URI more flexibly
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    console.log('Invalid redirect URI format:', redirect_uri);
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // Check if the redirect URI matches the configured pattern
  const expectedPattern = new RegExp(`^http://localhost:3001/api/auth/callback/${provider}$`);
  console.log('Checking redirect URI:', {
    received: redirect_uri,
    expectedPattern: expectedPattern.toString(),
    matches: expectedPattern.test(redirect_uri),
    providerConfig: {
      redirectUri: providerConfig.redirectUri,
      clientId: providerConfig.clientId,
    },
  });

  if (!expectedPattern.test(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // Render authorization page using EJS template
  res.render('authorize', {
    provider,
    scope,
    redirect_uri,
    response_type,
    client_id,
    state,
  });
});

// Authorization confirmation endpoint
router.post('/authorize/confirm', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state, provider } = req.body;

  console.log('Authorization confirmation request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    provider,
  });

  // Validate redirect URI
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    console.log('Invalid redirect URI format:', redirect_uri);
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // Check if the redirect URI matches the configured pattern
  const expectedPattern = new RegExp(`^http://localhost:3001/api/auth/callback/${provider}$`);
  console.log('Checking redirect URI:', {
    received: redirect_uri,
    expectedPattern: expectedPattern.toString(),
    matches: expectedPattern.test(redirect_uri),
  });

  if (!expectedPattern.test(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  try {
    // Generate authorization code
    const code = uuidv4();
    const expiresAt = Date.now() + 600000; // 10 minutes

    setAuthorizationCode(code, {
      code,
      clientId: client_id,
      redirectUri: redirect_uri,
      provider,
      expiresAt,
    });

    // Build redirect URL with parameters
    const params = new URLSearchParams();
    params.append('code', code);
    if (state) {
      params.append('state', state);
    }

    // Construct the redirect URL
    const separator = redirect_uri.includes('?') ? '&' : '?';
    const redirectUrl = `${redirect_uri}${separator}${params.toString()}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error during authorization confirmation:', error);
    res.status(500).json({ error: 'server_error', error_description: 'An error occurred during authorization' });
  }
});

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

  const response: OAuthTokenResponse = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenExpiry,
    refresh_token: refreshToken,
  };

  // Clean up used authorization code
  deleteAuthorizationCode(code);

  res.json(response);
});

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
