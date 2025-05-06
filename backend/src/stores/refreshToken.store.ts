import { DeviceInfo, StoredToken } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for refresh tokens
export const refreshTokens = new Map<string, StoredToken>();

// Store a refresh token
export const storeRefreshToken = (
  token: string,
  userId: number,
  deviceId: string,
  deviceInfo: DeviceInfo,
  expiresIn: number
): void => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  refreshTokens.set(token, {
    userId,
    deviceId,
    deviceInfo,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt,
    isRevoked: false,
    isUsed: false, // Track if token has been used
    id: uuidv4(), // Generate unique ID for the refresh token
  });
};

// Find a refresh token
export const findRefreshToken = (token: string, userId: number, deviceId: string): StoredToken | null => {
  const storedToken = refreshTokens.get(token);
  if (!storedToken) return null;

  // Check if token is expired
  if (new Date() > storedToken.expiresAt) {
    refreshTokens.delete(token); // Clean up expired token
    return null;
  }

  // Check if token is revoked or already used
  if (storedToken.isRevoked || storedToken.isUsed) {
    return null;
  }

  if (storedToken.userId === userId && storedToken.deviceId === deviceId) {
    return storedToken;
  }
  return null;
};

// Mark a refresh token as used
export const markRefreshTokenAsUsed = (token: string): void => {
  const storedToken = refreshTokens.get(token);
  if (storedToken) {
    storedToken.isUsed = true;
  }
};

// Revoke a refresh token
export const revokeRefreshToken = (token: string): void => {
  const storedToken = refreshTokens.get(token);
  if (storedToken) {
    storedToken.isRevoked = true;
  }
};

// Revoke all refresh tokens for a device
export const revokeDeviceRefreshTokens = (deviceId: string): void => {
  for (const [token, data] of refreshTokens.entries()) {
    if (data.deviceId === deviceId && !data.isRevoked) {
      data.isRevoked = true;
    }
  }
};

// Get all active sessions for a user
export const getUserSessions = (
  userId: number
): Array<{
  id: string;
  deviceInfo: DeviceInfo;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}> => {
  const sessions = [];
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId && new Date() < data.expiresAt && !data.isRevoked && !data.isUsed) {
      sessions.push({
        id: data.id,
        deviceInfo: data.deviceInfo,
        lastUsedAt: data.lastUsedAt,
        expiresAt: data.expiresAt,
        isRevoked: data.isRevoked,
      });
    }
  }
  return sessions;
};

// Clean up expired tokens
export const cleanupExpiredTokens = (): void => {
  const now = new Date();

  for (const [token, data] of refreshTokens.entries()) {
    if (now > data.expiresAt) {
      refreshTokens.delete(token);
    }
  }
};
