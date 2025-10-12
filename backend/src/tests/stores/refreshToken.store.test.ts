import {
  refreshTokens,
  storeRefreshToken,
  findRefreshToken,
  markRefreshTokenAsUsed,
  revokeRefreshToken,
  revokeDeviceRefreshTokens,
  getUserSessions,
  cleanupExpiredTokens,
} from '../../stores/refreshToken.store';
import { DeviceInfo } from '../../types';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Refresh Token Store', () => {
  const userId = 1;
  const deviceId = 'device-123';
  const token = 'test-refresh-token';
  const deviceInfo: DeviceInfo = {
    userAgent: 'Mozilla/5.0',
    platform: 'macOS',
    os: 'macOS',
  };

  beforeEach(() => {
    // Clear the store before each test
    refreshTokens.clear();
  });

  describe('storeRefreshToken', () => {
    it('should store a refresh token successfully', () => {
      const expiresIn = 3600;
      storeRefreshToken(token, userId, deviceId, deviceInfo, expiresIn);

      expect(refreshTokens.size).toBe(1);
    });

    it('should store token with correct expiration time', () => {
      const expiresIn = 3600;
      const beforeStore = Date.now();

      storeRefreshToken(token, userId, deviceId, deviceInfo, expiresIn);

      const storedToken = findRefreshToken(token, userId, deviceId);
      expect(storedToken).toBeDefined();

      const expectedExpiry = beforeStore + expiresIn * 1000;
      const actualExpiry = storedToken!.expiresAt.getTime();

      // Allow 100ms difference for test execution time
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(100);
    });

    it('should store token with isRevoked false', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      const storedToken = findRefreshToken(token, userId, deviceId);
      expect(storedToken?.isRevoked).toBe(false);
    });

    it('should store token with isUsed false', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      const storedToken = findRefreshToken(token, userId, deviceId);
      expect(storedToken?.isUsed).toBe(false);
    });

    it('should generate unique ID for each token', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 3600);

      const token1 = findRefreshToken(token, userId, deviceId);
      const token2 = findRefreshToken('token2', userId, 'device2');

      expect(token1?.id).toBeDefined();
      expect(token2?.id).toBeDefined();
      expect(token1?.id).not.toBe(token2?.id);
    });
  });

  describe('findRefreshToken', () => {
    it('should find stored token with correct userId and deviceId', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      const found = findRefreshToken(token, userId, deviceId);
      expect(found).toBeDefined();
      expect(found?.userId).toBe(userId);
      expect(found?.deviceId).toBe(deviceId);
    });

    it('should return null for non-existent token', () => {
      const found = findRefreshToken('non-existent-token', userId, deviceId);
      expect(found).toBeNull();
    });

    it('should return null for wrong userId', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      const found = findRefreshToken(token, 999, deviceId);
      expect(found).toBeNull();
    });

    it('should return null for wrong deviceId', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      const found = findRefreshToken(token, userId, 'wrong-device');
      expect(found).toBeNull();
    });

    it('should return null for expired token', () => {
      const expiresIn = 1; // 1 second
      storeRefreshToken(token, userId, deviceId, deviceInfo, expiresIn);

      // Wait for token to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const found = findRefreshToken(token, userId, deviceId);
          expect(found).toBeNull();
          resolve(undefined);
        }, 1100);
      });
    }, 2000);

    it('should return null for revoked token', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);
      revokeRefreshToken(token);

      const found = findRefreshToken(token, userId, deviceId);
      expect(found).toBeNull();
    });

    it('should return null for used token', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);
      markRefreshTokenAsUsed(token);

      const found = findRefreshToken(token, userId, deviceId);
      expect(found).toBeNull();
    });
  });

  describe('markRefreshTokenAsUsed', () => {
    it('should mark token as used', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      markRefreshTokenAsUsed(token);

      const found = findRefreshToken(token, userId, deviceId);
      expect(found).toBeNull(); // Used tokens should not be found
    });

    it('should not throw error for non-existent token', () => {
      expect(() => markRefreshTokenAsUsed('non-existent')).not.toThrow();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a token', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);

      revokeRefreshToken(token);

      const found = findRefreshToken(token, userId, deviceId);
      expect(found).toBeNull(); // Revoked tokens should not be found
    });

    it('should not throw error for non-existent token', () => {
      expect(() => revokeRefreshToken('non-existent')).not.toThrow();
    });
  });

  describe('revokeDeviceRefreshTokens', () => {
    it('should revoke all tokens for a device', () => {
      storeRefreshToken('token1', userId, deviceId, deviceInfo, 3600);
      storeRefreshToken('token2', userId, deviceId, deviceInfo, 3600);
      storeRefreshToken('token3', userId, 'other-device', deviceInfo, 3600);

      revokeDeviceRefreshTokens(deviceId);

      expect(findRefreshToken('token1', userId, deviceId)).toBeNull();
      expect(findRefreshToken('token2', userId, deviceId)).toBeNull();
      expect(findRefreshToken('token3', userId, 'other-device')).toBeDefined();
    });

    it('should not revoke already revoked tokens again', () => {
      storeRefreshToken(token, userId, deviceId, deviceInfo, 3600);
      revokeRefreshToken(token);

      expect(() => revokeDeviceRefreshTokens(deviceId)).not.toThrow();
    });
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for a user', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 3600);
      storeRefreshToken('token3', 999, 'device3', deviceInfo, 3600);

      const sessions = getUserSessions(userId);

      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.isRevoked === false)).toBe(true);
    });

    it('should not include expired sessions', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 1);

      return new Promise(resolve => {
        setTimeout(() => {
          const sessions = getUserSessions(userId);
          expect(sessions).toHaveLength(1);
          resolve(undefined);
        }, 1100);
      });
    }, 2000);

    it('should not include revoked sessions', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 3600);

      revokeRefreshToken('token1');

      const sessions = getUserSessions(userId);
      expect(sessions).toHaveLength(1);
    });

    it('should not include used sessions', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 3600);

      markRefreshTokenAsUsed('token1');

      const sessions = getUserSessions(userId);
      expect(sessions).toHaveLength(1);
    });

    it('should return empty array for user with no sessions', () => {
      const sessions = getUserSessions(999);
      expect(sessions).toEqual([]);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 1);

      return new Promise(resolve => {
        setTimeout(() => {
          cleanupExpiredTokens();
          expect(refreshTokens.size).toBe(1);
          resolve(undefined);
        }, 1100);
      });
    }, 2000);

    it('should not remove valid tokens', () => {
      storeRefreshToken('token1', userId, 'device1', deviceInfo, 3600);
      storeRefreshToken('token2', userId, 'device2', deviceInfo, 3600);

      cleanupExpiredTokens();

      expect(refreshTokens.size).toBe(2);
    });

    it('should handle empty store', () => {
      expect(() => cleanupExpiredTokens()).not.toThrow();
      expect(refreshTokens.size).toBe(0);
    });
  });
});
