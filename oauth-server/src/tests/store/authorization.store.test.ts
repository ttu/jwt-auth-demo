import {
  AuthorizationCode,
  setAuthorizationCode,
  getAuthorizationCode,
  deleteAuthorizationCode,
  hasAuthorizationCode,
  clearExpiredAuthorizationCodes,
} from '../../store/authorization.store';
import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock to access the store directly for cleanup
// Since we can't import the Map directly, we'll work with the exported functions
const clearStore = () => {
  // Get all codes and delete them
  const testCode = 'cleanup-test';
  const testData: AuthorizationCode = {
    code: testCode,
    clientId: 'test',
    redirectUri: 'http://test',
    provider: 'google',
    expiresAt: Date.now() + 1000,
    nonce: 'test',
  };
  setAuthorizationCode(testCode, testData);

  // Delete and clear any remaining codes through expiration
  clearExpiredAuthorizationCodes();
  deleteAuthorizationCode(testCode);
};

describe('Authorization Store', () => {
  const code = 'test-auth-code-123';
  const authData: AuthorizationCode = {
    code,
    clientId: 'test-client-id',
    redirectUri: 'http://localhost:3000/callback',
    provider: 'google',
    expiresAt: Date.now() + 60000, // 1 minute from now
    nonce: 'test-nonce-456',
  };

  beforeEach(() => {
    clearStore();
  });

  describe('setAuthorizationCode', () => {
    it('should store authorization code', () => {
      setAuthorizationCode(code, authData);
      expect(hasAuthorizationCode(code)).toBe(true);
    });

    it('should store code with all properties', () => {
      setAuthorizationCode(code, authData);
      const stored = getAuthorizationCode(code);

      expect(stored).toBeDefined();
      expect(stored?.code).toBe(authData.code);
      expect(stored?.clientId).toBe(authData.clientId);
      expect(stored?.redirectUri).toBe(authData.redirectUri);
      expect(stored?.provider).toBe(authData.provider);
      expect(stored?.expiresAt).toBe(authData.expiresAt);
      expect(stored?.nonce).toBe(authData.nonce);
    });

    it('should overwrite existing code', () => {
      setAuthorizationCode(code, authData);

      const newData: AuthorizationCode = {
        ...authData,
        clientId: 'new-client-id',
      };

      setAuthorizationCode(code, newData);

      const stored = getAuthorizationCode(code);
      expect(stored?.clientId).toBe('new-client-id');
    });
  });

  describe('getAuthorizationCode', () => {
    it('should retrieve stored code', () => {
      setAuthorizationCode(code, authData);
      const retrieved = getAuthorizationCode(code);

      expect(retrieved).toEqual(authData);
    });

    it('should return undefined for non-existent code', () => {
      const retrieved = getAuthorizationCode('non-existent-code');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('deleteAuthorizationCode', () => {
    it('should delete existing code and return true', () => {
      setAuthorizationCode(code, authData);

      const deleted = deleteAuthorizationCode(code);

      expect(deleted).toBe(true);
      expect(hasAuthorizationCode(code)).toBe(false);
    });

    it('should return false when deleting non-existent code', () => {
      const deleted = deleteAuthorizationCode('non-existent-code');
      expect(deleted).toBe(false);
    });

    it('should make code unavailable after deletion', () => {
      setAuthorizationCode(code, authData);
      deleteAuthorizationCode(code);

      const retrieved = getAuthorizationCode(code);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('hasAuthorizationCode', () => {
    it('should return true for existing code', () => {
      setAuthorizationCode(code, authData);
      expect(hasAuthorizationCode(code)).toBe(true);
    });

    it('should return false for non-existent code', () => {
      expect(hasAuthorizationCode('non-existent-code')).toBe(false);
    });

    it('should return false after code is deleted', () => {
      setAuthorizationCode(code, authData);
      deleteAuthorizationCode(code);

      expect(hasAuthorizationCode(code)).toBe(false);
    });
  });

  describe('clearExpiredAuthorizationCodes', () => {
    it('should remove expired codes', () => {
      const expiredData: AuthorizationCode = {
        ...authData,
        code: 'expired-code',
        expiresAt: Date.now() - 1000, // Already expired
      };

      setAuthorizationCode('expired-code', expiredData);
      setAuthorizationCode(code, authData); // Valid code

      clearExpiredAuthorizationCodes();

      expect(hasAuthorizationCode('expired-code')).toBe(false);
      expect(hasAuthorizationCode(code)).toBe(true);
    });

    it('should keep valid codes', () => {
      const validData: AuthorizationCode = {
        ...authData,
        expiresAt: Date.now() + 60000,
      };

      setAuthorizationCode(code, validData);
      clearExpiredAuthorizationCodes();

      expect(hasAuthorizationCode(code)).toBe(true);
    });

    it('should handle empty store', () => {
      expect(() => clearExpiredAuthorizationCodes()).not.toThrow();
    });

    it('should remove multiple expired codes', () => {
      const expired1: AuthorizationCode = {
        ...authData,
        code: 'expired-1',
        expiresAt: Date.now() - 1000,
      };

      const expired2: AuthorizationCode = {
        ...authData,
        code: 'expired-2',
        expiresAt: Date.now() - 2000,
      };

      setAuthorizationCode('expired-1', expired1);
      setAuthorizationCode('expired-2', expired2);

      clearExpiredAuthorizationCodes();

      expect(hasAuthorizationCode('expired-1')).toBe(false);
      expect(hasAuthorizationCode('expired-2')).toBe(false);
    });
  });

  describe('multiple providers', () => {
    it('should handle different OAuth providers', () => {
      const providers: Array<'google' | 'microsoft' | 'strava' | 'company'> = [
        'google',
        'microsoft',
        'strava',
        'company',
      ];

      providers.forEach(provider => {
        const data: AuthorizationCode = {
          ...authData,
          code: `code-${provider}`,
          provider,
        };
        setAuthorizationCode(`code-${provider}`, data);
      });

      providers.forEach(provider => {
        const retrieved = getAuthorizationCode(`code-${provider}`);
        expect(retrieved?.provider).toBe(provider);
      });
    });
  });
});
