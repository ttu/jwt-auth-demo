import { config } from '../../config';
import { describe, it, expect } from '@jest/globals';

describe('OAuth Server Config', () => {
  describe('server settings', () => {
    it('should have default port', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
    });

    it('should have JWT secret', () => {
      expect(config.jwtSecret).toBeDefined();
      expect(typeof config.jwtSecret).toBe('string');
    });

    it('should have access token expiry', () => {
      expect(config.accessTokenExpiry).toBeDefined();
      expect(typeof config.accessTokenExpiry).toBe('number');
      expect(config.accessTokenExpiry).toBeGreaterThan(0);
    });

    it('should have refresh token expiry', () => {
      expect(config.refreshTokenExpiry).toBeDefined();
      expect(typeof config.refreshTokenExpiry).toBe('number');
      expect(config.refreshTokenExpiry).toBeGreaterThan(0);
    });

    it('refresh token expiry should be longer than access token expiry', () => {
      expect(config.refreshTokenExpiry).toBeGreaterThan(config.accessTokenExpiry);
    });
  });

  describe('OAuth providers', () => {
    const providers = ['google', 'microsoft', 'strava', 'company'] as const;

    providers.forEach(provider => {
      describe(`${provider} provider`, () => {
        it('should have clientId', () => {
          expect(config.providers[provider].clientId).toBeDefined();
          expect(typeof config.providers[provider].clientId).toBe('string');
        });

        it('should have clientSecret', () => {
          expect(config.providers[provider].clientSecret).toBeDefined();
          expect(typeof config.providers[provider].clientSecret).toBe('string');
        });

        it('should have redirectUri', () => {
          expect(config.providers[provider].redirectUri).toBeDefined();
          expect(typeof config.providers[provider].redirectUri).toBe('string');
          expect(config.providers[provider].redirectUri).toMatch(/^http/);
        });

        it('should have authorizationEndpoint', () => {
          expect(config.providers[provider].authorizationEndpoint).toBe('/oauth/authorize');
        });

        it('should have tokenEndpoint', () => {
          expect(config.providers[provider].tokenEndpoint).toBe('/oauth/token');
        });

        it('should have userInfoEndpoint', () => {
          expect(config.providers[provider].userInfoEndpoint).toBe('/oauth/userinfo');
        });

        it('should have scopes array', () => {
          expect(config.providers[provider].scopes).toBeDefined();
          expect(Array.isArray(config.providers[provider].scopes)).toBe(true);
          expect(config.providers[provider].scopes.length).toBeGreaterThan(0);
        });

        it('should have valid redirect URI format', () => {
          const uri = config.providers[provider].redirectUri;
          expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/callback\/.+$/);
        });
      });
    });

    it('should have all four providers configured', () => {
      expect(Object.keys(config.providers)).toEqual(
        expect.arrayContaining(['google', 'microsoft', 'strava', 'company'])
      );
      expect(Object.keys(config.providers).length).toBe(4);
    });
  });

  describe('provider-specific scopes', () => {
    it('google should have openid scopes', () => {
      expect(config.providers.google.scopes).toContain('openid');
      expect(config.providers.google.scopes).toContain('profile');
      expect(config.providers.google.scopes).toContain('email');
    });

    it('microsoft should have openid scopes', () => {
      expect(config.providers.microsoft.scopes).toContain('openid');
      expect(config.providers.microsoft.scopes).toContain('profile');
      expect(config.providers.microsoft.scopes).toContain('email');
    });

    it('strava should have activity scopes', () => {
      expect(config.providers.strava.scopes).toContain('read');
      expect(config.providers.strava.scopes).toContain('activity:read');
    });

    it('company should have openid scopes', () => {
      expect(config.providers.company.scopes).toContain('openid');
      expect(config.providers.company.scopes).toContain('profile');
      expect(config.providers.company.scopes).toContain('email');
    });
  });
});
