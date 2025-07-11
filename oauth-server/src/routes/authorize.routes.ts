import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { OAuthAuthorizationRequest } from '../types';
import { setAuthorizationCode } from '../store/authorization.store';

const router = express.Router();

// Authorization endpoint
router.get('/authorize', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state, nonce, provider } =
    req.query as unknown as OAuthAuthorizationRequest;

  console.log('Authorization request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
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
    nonce,
  });
});

// Authorization confirmation endpoint
router.post('/authorize/confirm', (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state, nonce, provider } = req.body;

  console.log('Authorization confirmation request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    provider,
    body: req.body,
    headers: req.headers,
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
      nonce,
    });

    // Build redirect URL with parameters
    const params = new URLSearchParams();
    params.append('code', code);
    if (state) {
      console.log('Appending state to redirect URL:', state);
      params.append('state', state);
    }

    // Construct the redirect URL
    const separator = redirect_uri.includes('?') ? '&' : '?';
    const redirectUrl = `${redirect_uri}${separator}${params.toString()}`;
    console.log('Final redirect URL:', redirectUrl);

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error during authorization confirmation:', error);
    res.status(500).json({ error: 'server_error', error_description: 'An error occurred during authorization' });
  }
});

export default router;
