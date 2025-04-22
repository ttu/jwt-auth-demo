import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import { DeviceInfo, User } from '../types';
import { describe, it, expect } from '@jest/globals';

// Set up test environment variables
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ACCESS_TOKEN_EXPIRY = '15';
process.env.REFRESH_TOKEN_EXPIRY = '7d';
process.env.NODE_ENV = 'test';

// Helper functions
const createTestUser = (): User => ({
  id: 1,
  username: 'demo',
  password: 'password123',
});

interface TestDevice {
  deviceId: string;
  deviceInfo: DeviceInfo;
}

const createTestDevice = (): TestDevice => ({
  deviceId: 'test-device-' + Math.random().toString(36).substring(7),
  deviceInfo: {
    userAgent: 'test-agent',
    platform: 'test-platform',
    os: 'test-os',
  },
});

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

const loginUser = async (user: User, device: TestDevice): Promise<LoginResponse> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: user.username, password: user.password })
    .set('x-device-id', device.deviceId)
    .set('user-agent', device.deviceInfo.userAgent)
    .set('sec-ch-ua-platform', device.deviceInfo.platform);

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.headers['set-cookie'][0].split(';')[0].split('=')[1],
  };
};

describe('Authentication Flow', () => {
  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const user = createTestUser();
      const device = createTestDevice();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: user.username, password: user.password })
        .set('x-device-id', device.deviceId)
        .set('user-agent', device.deviceInfo.userAgent)
        .set('sec-ch-ua-platform', device.deviceInfo.platform);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should successfully login without platform header', async () => {
      const user = createTestUser();
      const device = createTestDevice();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: user.username, password: user.password })
        .set('x-device-id', device.deviceId)
        .set('user-agent', device.deviceInfo.userAgent);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail login with invalid credentials', async () => {
      const device = createTestDevice();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid',
          password: 'invalid',
        })
        .set('x-device-id', device.deviceId)
        .set('user-agent', device.deviceInfo.userAgent);

      expect(response.status).toBe(401);
    });

    it('should return 400 when device ID is missing', async () => {
      const user = createTestUser();
      const device = createTestDevice();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: user.username, password: user.password })
        .set('user-agent', device.deviceInfo.userAgent);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Device ID is required');
    });

    it('should return 400 when user agent is missing', async () => {
      const user = createTestUser();
      const device = createTestDevice();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: user.username, password: user.password })
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User agent is required');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { accessToken } = await loginUser(user, device);

      const response = await request(app)
        .get('/api/users/list')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(200);
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app).get('/api/users/list').set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { refreshToken } = await loginUser(user, device);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail refresh with invalid refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh').set('Cookie', ['refreshToken=invalid-token']);

      expect(response.status).toBe(401);
    });
  });

  describe('Session Management', () => {
    it('should get active sessions', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { accessToken } = await loginUser(user, device);

      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(200);
      expect(response.body.sessions).toBeDefined();
    });

    it('should revoke specific session', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { accessToken } = await loginUser(user, device);

      const response = await request(app)
        .post('/api/auth/sessions/revoke')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ deviceId: device.deviceId });

      expect(response.status).toBe(200);
    });
  });

  describe('Logout', () => {
    it('should successfully logout and clear tokens', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { accessToken, refreshToken } = await loginUser(user, device);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(200);

      // Verify tokens are cleared
      const tokenCheck = await request(app)
        .get('/api/users/list')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-device-id', device.deviceId);

      expect(tokenCheck.status).toBe(401);
    });
  });

  describe('Token Expiration', () => {
    it('should handle expired access token', async () => {
      const user = createTestUser();
      const device = createTestDevice();
      const { accessToken } = await loginUser(user, device);

      // Create an expired token
      const expiredToken = jwt.sign({ userId: 1, username: user.username }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: '1s',
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(app)
        .get('/api/users/list')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('x-device-id', device.deviceId);

      expect(response.status).toBe(401);
    });
  });
});
