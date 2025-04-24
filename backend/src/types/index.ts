import { Request as ExpressRequest, RequestHandler } from 'express';

export interface User {
  id: number;
  username: string;
  password: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  os: string;
}

export interface StoredToken {
  userId: number;
  deviceId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  id: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends ExpressRequest {
  user?: JwtPayload;
  session?: {
    oauthState?: string;
  };
}

export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  provider: OAuthProvider;
}

export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

// TODO: Can this be removed?
export type RequestHandlerWithUser = RequestHandler<
  any,
  any,
  any,
  any,
  { user?: JwtPayload; session?: { oauthState?: string } }
>;
