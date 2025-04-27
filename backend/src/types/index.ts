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
  id: string;
};

export type JwtPayload = {
  userId: number;
  username: string;
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
