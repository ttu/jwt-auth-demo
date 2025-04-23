import { Request } from 'express';

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

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}
