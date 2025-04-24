import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { storeToken } from '../stores/refreshToken.store';
import { DeviceInfo, RequestWithUser, OAuthUserInfo } from '../types/index';
import { settings } from '../config/settings';
import { v4 as uuidv4 } from 'uuid';

// Define token response type
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

const router = Router();

// In-memory store for OAuth users
const oauthUsers: { [key: string]: OAuthUserInfo } = {};

// In-memory store for OAuth states
const oauthStates = new Map<string, { state: string; deviceId: string; timestamp: number }>();

// OAuth login endpoint
router.get('/oauth/:provider', async (req: RequestWithUser, res) => {
  const { provider } = req.params;
  const deviceId = req.headers['x-device-id'] as string;

  if (!['google', 'microsoft', 'strava', 'company'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID is required' });
  }

  const state = uuidv4();
  const config = {
    clientId: `fake-${provider}-client-id`,
    redirectUri: `http://localhost:3001/api/auth/callback/${provider}`,
    authorizationEndpoint: 'http://localhost:3002/oauth/authorize',
    scopes: provider === 'strava' ? ['read', 'activity:read'] : ['openid', 'profile', 'email'],
  };

  // Store state in memory with device ID and timestamp
  oauthStates.set(state, {
    state,
    deviceId,
    timestamp: Date.now(),
  });

  // Clean up old states (older than 1 hour)
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of oauthStates.entries()) {
    if (value.timestamp < oneHourAgo) {
      oauthStates.delete(key);
    }
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    provider,
  });

  const redirectUrl = `${config.authorizationEndpoint}?${params.toString()}`;
  res.json({ redirectUrl });
});

// Handle OAuth callback
router.get('/callback/:provider', async (req: RequestWithUser, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;

  console.log('OAuth callback received:', {
    provider,
    code,
    state,
  });

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Validate state
  const storedState = oauthStates.get(state as string);
  if (!storedState) {
    console.log('State validation failed: State not found');
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  // Remove used state
  oauthStates.delete(state as string);

  try {
    // Exchange code for tokens
    console.log(`[${new Date().toISOString()}] Token exchange request:`, {
      code,
      redirect_uri: `http://localhost:3001/api/auth/callback/${provider}`,
      client_id: `fake-${provider}-client-id`,
      provider,
    });

    const tokenResponse = await fetch('http://localhost:3002/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `http://localhost:3001/api/auth/callback/${provider}`,
        client_id: `fake-${provider}-client-id`,
        client_secret: `fake-${provider}-client-secret`,
        provider,
      }),
    });

    console.log(`[${new Date().toISOString()}] Token exchange response status:`, tokenResponse.status);

    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text();
      console.error(`[${new Date().toISOString()}] Token exchange failed:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        responseText,
      });
      throw new Error(`Failed to exchange code for tokens: ${responseText}`);
    }

    const tokens = (await tokenResponse.json()) as TokenResponse;
    console.log(`[${new Date().toISOString()}] Token exchange successful:`, {
      accessToken: tokens.access_token ? 'present' : 'missing',
      refreshToken: tokens.refresh_token ? 'present' : 'missing',
      expiresIn: tokens.expires_in,
    });

    // Get user info
    console.log(`[${new Date().toISOString()}] Fetching user info with access token`);
    const userInfoResponse = await fetch('http://localhost:3002/oauth/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    console.log(`[${new Date().toISOString()}] User info response status:`, userInfoResponse.status);

    if (!userInfoResponse.ok) {
      const responseText = await userInfoResponse.text();
      console.error(`[${new Date().toISOString()}] User info request failed:`, {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        responseText,
      });
      throw new Error(`Failed to get user info: ${responseText}`);
    }

    const userInfo = (await userInfoResponse.json()) as OAuthUserInfo;
    console.log(`[${new Date().toISOString()}] User info retrieved:`, {
      id: userInfo.id,
      email: userInfo.email,
      provider: userInfo.provider,
    });

    // Store user info in memory
    oauthUsers[userInfo.email] = userInfo;

    // Generate application tokens
    const userId = parseInt(userInfo.id.split('-')[1], 10); // Extract the numeric part from the ID
    const accessToken = jwt.sign({ userId, email: userInfo.email }, settings.jwt.accessSecret, {
      expiresIn: settings.jwt.accessTokenExpiry,
    });

    const refreshToken = jwt.sign({ userId, email: userInfo.email }, settings.jwt.refreshSecret, {
      expiresIn: settings.jwt.refreshTokenExpiry,
    });

    // Store refresh token
    const deviceInfo: DeviceInfo = {
      userAgent: req.headers['user-agent'] as string,
      platform: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
      os: (req.headers['sec-ch-ua-platform'] as string) || 'unknown',
    };

    // Use the device ID from the stored state
    storeToken(refreshToken, userId, storedState.deviceId, deviceInfo, settings.jwt.refreshTokenExpiry);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: false, // This should be true. Now false for demo purposes
      secure: settings.server.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: settings.jwt.refreshTokenExpiry * 1000, // Convert to milliseconds
    });

    // Redirect to frontend with tokens
    res.redirect(`http://localhost:3000/auth/callback?success=true&token=${accessToken}`);
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] OAuth callback error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.redirect(`http://localhost:3000/auth/callback?success=false&error=${encodeURIComponent(errorMessage)}`);
  }
});

export default router;
