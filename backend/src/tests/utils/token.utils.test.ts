import jwt from 'jsonwebtoken';
import { createToken, commonVerifyOptions } from '../../utils/token.utils';
import { describe, it, expect } from '@jest/globals';

describe('Token Utils', () => {
  const secret = 'test-secret';
  const userId = 1;
  const username = 'testuser';
  const expiresIn = 3600;
  const scope = ['read', 'write'];

  describe('createToken', () => {
    it('should create a valid JWT token with correct claims', () => {
      const token = createToken(userId, username, secret, expiresIn, scope);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, secret, commonVerifyOptions) as jwt.JwtPayload;

      expect(decoded.iss).toBe('your-app-name');
      expect(decoded.sub).toBe(userId.toString());
      expect(decoded.aud).toEqual(['api']);
      expect(decoded.userId).toBe(userId);
      expect(decoded.username).toBe(username);
      expect(decoded.scope).toEqual(scope);
      expect(decoded.version).toBe('1.0');
      expect(decoded.jti).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should create unique tokens with different jti', () => {
      const token1 = createToken(userId, username, secret, expiresIn, scope);
      const token2 = createToken(userId, username, secret, expiresIn, scope);

      const decoded1 = jwt.verify(token1, secret) as jwt.JwtPayload;
      const decoded2 = jwt.verify(token2, secret) as jwt.JwtPayload;

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it('should create token that expires at the correct time', () => {
      const token = createToken(userId, username, secret, expiresIn, scope);
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      const expectedExpiry = decoded.iat! + expiresIn;
      expect(decoded.exp).toBe(expectedExpiry);
    });

    it('should include all scopes in the token', () => {
      const customScopes = ['admin', 'user', 'moderator'];
      const token = createToken(userId, username, secret, expiresIn, customScopes);
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      expect(decoded.scope).toEqual(customScopes);
    });

    it('should handle empty scope array', () => {
      const token = createToken(userId, username, secret, expiresIn, []);
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      expect(decoded.scope).toEqual([]);
    });
  });

  describe('commonVerifyOptions', () => {
    it('should have correct algorithm', () => {
      expect(commonVerifyOptions.algorithms).toEqual(['HS256']);
    });

    it('should have correct issuer', () => {
      expect(commonVerifyOptions.issuer).toBe('your-app-name');
    });

    it('should have correct audience', () => {
      expect(commonVerifyOptions.audience).toBe('api');
    });
  });
});
