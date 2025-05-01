import { Request as ExpressRequest, RequestHandler } from 'express';

export type User = {
  id: number;
  username: string;
  password: string;
};

export type DeviceInfo = {
  userAgent: string;
  platform: string;
  os: string;
};

export type StoredToken = {
  userId: number;
  deviceId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  isUsed: boolean;
  id: string;
};

export type JwtPayload = {
  iss: string; // Issuer
  sub: string; // Subject (user ID)
  aud: string[]; // Audience
  jti: string; // JWT ID
  userId: number;
  username: string;
  deviceId: string;
  scope: string[];
  version: string;
  iat?: number;
  exp?: number;
};

export type RequestWithUser = ExpressRequest & {
  user?: JwtPayload;
  session?: {
    oauthState?: string;
  };
};

export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export type OAuthUserInfo = {
  id: string;
  email: string;
  name: string;
  provider: OAuthProvider;
};

export type OAuthErrorResponse = {
  error: string;
  error_description?: string;
};

// TODO: Can this be removed?
export type RequestHandlerWithUser = RequestHandler<
  any,
  any,
  any,
  any,
  { user?: JwtPayload; session?: { oauthState?: string } }
>;

export type OAuthState = {
  deviceId: string;
  timestamp: number;
};
