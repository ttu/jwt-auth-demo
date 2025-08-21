import crypto from 'crypto';

// In-memory store for blacklisted access tokens. Hashed jti (JWT ID)
const blacklistedTokens = new Set<string>();

// Add an access token to the blacklist
export const blacklistAccessToken = (jti: string): void => {
  const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
  blacklistedTokens.add(hashedJti);
};

// Check if an access token is blacklisted
export const isAccessTokenBlacklisted = (jti: string): boolean => {
  const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
  return blacklistedTokens.has(hashedJti);
};

// Clean up blacklisted tokens (optional, can be called periodically)
export const cleanupBlacklist = (): void => {
  // In a real implementation, you might want to keep track of when tokens were blacklisted
  // and remove them after their expiration time has passed
  // For this demo, we'll just clear the blacklist periodically
  blacklistedTokens.clear();
};
