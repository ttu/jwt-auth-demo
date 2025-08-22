import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Common JWT verification options for the application
 */
export const commonVerifyOptions: jwt.VerifyOptions = {
  algorithms: ['HS256'],
  issuer: 'your-app-name',
  audience: 'api',
};

/**
 * Creates a JWT token with standard claims
 * @param userId - User ID
 * @param username - Username
 * @param secret - JWT secret for signing
 * @param expiresIn - Token expiration time in seconds
 * @param scope - Array of scopes/permissions for the token
 * @returns Signed JWT token string
 */
export const createToken = (
  userId: number,
  username: string,
  secret: string,
  expiresIn: number,
  scope: string[]
): string => {
  return jwt.sign(
    {
      iss: 'your-app-name', // Your application name
      sub: userId.toString(), // Subject (user ID)
      aud: ['api'], // Audience (which services can use this token)
      jti: uuidv4(), // Unique token ID
      userId,
      username,
      scope,
      version: '1.0', // Token version
      iat: Math.floor(Date.now() / 1000), // Add issued at timestamp
    },
    secret,
    { expiresIn }
  );
};
