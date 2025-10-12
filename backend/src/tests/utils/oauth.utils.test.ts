import { encodeState, decodeState } from '../../utils/oauth.utils';
import { OAuthState } from '../../types';
import { describe, it, expect } from '@jest/globals';

describe('OAuth Utils', () => {
  describe('encodeState', () => {
    it('should encode OAuth state to base64 string', () => {
      const state: OAuthState = {
        deviceId: 'device-456',
        timestamp: Date.now(),
      };

      const encoded = encodeState(state);

      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should produce different strings for different states', () => {
      const state1: OAuthState = {
        deviceId: 'device-1',
        timestamp: 1000000,
      };

      const state2: OAuthState = {
        deviceId: 'device-2',
        timestamp: 2000000,
      };

      const encoded1 = encodeState(state1);
      const encoded2 = encodeState(state2);

      expect(encoded1).not.toBe(encoded2);
    });

    it('should handle special characters in deviceId', () => {
      const state: OAuthState = {
        deviceId: 'device-&*()_+',
        timestamp: Date.now(),
      };

      const encoded = encodeState(state);
      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe('string');
    });
  });

  describe('decodeState', () => {
    it('should decode base64 string back to OAuth state', () => {
      const originalState: OAuthState = {
        deviceId: 'device-789',
        timestamp: 1234567890,
      };

      const encoded = encodeState(originalState);
      const decoded = decodeState(encoded);

      expect(decoded).toEqual(originalState);
      expect(decoded.deviceId).toBe(originalState.deviceId);
      expect(decoded.timestamp).toBe(originalState.timestamp);
    });

    it('should handle empty deviceId', () => {
      const originalState: OAuthState = {
        deviceId: '',
        timestamp: 0,
      };

      const encoded = encodeState(originalState);
      const decoded = decodeState(encoded);

      expect(decoded).toEqual(originalState);
    });

    it('should preserve data types', () => {
      const originalState: OAuthState = {
        deviceId: 'device-123',
        timestamp: 9876543210,
      };

      const encoded = encodeState(originalState);
      const decoded = decodeState(encoded);

      expect(typeof decoded.deviceId).toBe('string');
      expect(typeof decoded.timestamp).toBe('number');
    });
  });

  describe('encode/decode round trip', () => {
    it('should preserve state through encode and decode cycle', () => {
      const testCases: OAuthState[] = [
        {
          deviceId: 'simple-device',
          timestamp: 1000000,
        },
        {
          deviceId: 'complex-&*()_+-device',
          timestamp: 1234567890,
        },
        {
          deviceId: 'unicode-デバイス-device',
          timestamp: 9999999999,
        },
      ];

      testCases.forEach(originalState => {
        const encoded = encodeState(originalState);
        const decoded = decodeState(encoded);
        expect(decoded).toEqual(originalState);
      });
    });

    it('should handle various timestamp values', () => {
      const timestamps = [0, 1, Date.now(), Number.MAX_SAFE_INTEGER];

      timestamps.forEach(timestamp => {
        const state: OAuthState = {
          deviceId: 'test-device',
          timestamp,
        };

        const encoded = encodeState(state);
        const decoded = decodeState(encoded);

        expect(decoded.timestamp).toBe(timestamp);
      });
    });
  });
});
