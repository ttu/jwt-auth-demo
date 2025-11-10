import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { OAuthAuthorizationRequest } from '../types';
import { setAuthorizationCode } from '../store/authorization.store';

const router = express.Router();

// Authorization endpoint
router.get('/authorize', (req, res) => {
  // debugger; // OAUTH SERVER: Authorization Request - User redirected here from main app
  // We received: response_type, client_id, redirect_uri, scope, state, nonce, provider
  // PKCE: code_challenge, code_challenge_method (optional, for public clients)
  // Next: Validate request parameters and show authorization consent page
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    provider,
    code_challenge,
    code_challenge_method,
  } = req.query as unknown as OAuthAuthorizationRequest;

  console.log('Authorization request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    provider,
    code_challenge: code_challenge ? `${code_challenge.substring(0, 20)}...` : undefined,
    code_challenge_method,
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

  // debugger; // OAUTH SERVER: Parameter Validation - Checking client credentials and redirect URI
  // We're validating: client_id matches config, redirect_uri is valid format and matches expected pattern
  // This prevents malicious apps from hijacking the OAuth flow
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    console.log('Invalid redirect URI format:', redirect_uri);
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // Check if the redirect URI matches the configured pattern
  // Support both main app (3001) and frontend-standalone (3003) redirect URIs
  const mainAppPattern = new RegExp(`^http://localhost:3001/api/auth/callback/${provider}$`);
  const standaloneAppPattern = new RegExp(`^http://localhost:3003/callback$`);

  const isMainApp = mainAppPattern.test(redirect_uri);
  const isStandaloneApp = standaloneAppPattern.test(redirect_uri);

  console.log('Checking redirect URI:', {
    received: redirect_uri,
    mainAppPattern: mainAppPattern.toString(),
    standaloneAppPattern: standaloneAppPattern.toString(),
    isMainApp,
    isStandaloneApp,
    providerConfig: {
      redirectUri: providerConfig.redirectUri,
      clientId: providerConfig.clientId,
    },
  });

  if (!isMainApp && !isStandaloneApp) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // debugger; // OAUTH SERVER: Consent Page Display - All validation passed, showing user consent form
  // We're rendering the authorization page where user will grant/deny permission
  // Page contains: provider info, requested scopes, approve/deny buttons
  // PKCE: If code_challenge is present, it will be stored with the authorization code
  res.render('authorize', {
    provider,
    scope,
    redirect_uri,
    response_type,
    client_id,
    state,
    nonce,
    code_challenge,
    code_challenge_method,
  });
});

// Authorization confirmation endpoint
router.post('/authorize/confirm', (req, res) => {
  // debugger; // OAUTH SERVER: User Consent - User clicked 'Approve' on consent page
  // We received: user's decision to grant access, now generating authorization code
  // PKCE: code_challenge and code_challenge_method will be stored with the auth code
  // Next: Create authorization code and redirect back to main application
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    provider,
    code_challenge,
    code_challenge_method,
  } = req.body;

  console.log('Authorization confirmation request:', {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    provider,
    code_challenge: code_challenge ? `${code_challenge.substring(0, 20)}...` : undefined,
    code_challenge_method,
    body: req.body,
    headers: req.headers,
  });

  // Validate redirect URI
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    console.log('Invalid redirect URI format:', redirect_uri);
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  // Check if the redirect URI matches the configured pattern
  // Support both main app (3001) and frontend-standalone (3003) redirect URIs
  const mainAppPattern = new RegExp(`^http://localhost:3001/api/auth/callback/${provider}$`);
  const standaloneAppPattern = new RegExp(`^http://localhost:3003/callback$`);

  const isMainApp = mainAppPattern.test(redirect_uri);
  const isStandaloneApp = standaloneAppPattern.test(redirect_uri);

  console.log('Checking redirect URI:', {
    received: redirect_uri,
    mainAppPattern: mainAppPattern.toString(),
    standaloneAppPattern: standaloneAppPattern.toString(),
    isMainApp,
    isStandaloneApp,
  });

  if (!isMainApp && !isStandaloneApp) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' });
  }

  try {
    // debugger; // OAUTH SERVER: Authorization Code Generation - Creating short-lived auth code
    // We're generating: unique authorization code, expiration time (10 minutes)
    // This code will be exchanged for tokens by the main application
    // PKCE: Storing code_challenge with the auth code for later verification
    const code = uuidv4();
    const expiresAt = Date.now() + 600000; // 10 minutes

    setAuthorizationCode(code, {
      code,
      clientId: client_id,
      redirectUri: redirect_uri,
      provider,
      expiresAt,
      nonce,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    });

    // debugger; // OAUTH SERVER: Redirect with Code - Sending user back to main app with authorization code
    // We're redirecting to: main app's callback URL with code and state parameters
    // Main app will use this code to request access tokens
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
