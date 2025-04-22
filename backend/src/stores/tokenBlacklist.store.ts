// In-memory store for blacklisted access tokens
const blacklistedTokens = new Set<string>();

// Add a token to the blacklist
export const blacklistToken = (token: string): void => {
  blacklistedTokens.add(token);
};

// Check if a token is blacklisted
export const isTokenBlacklisted = (token: string): boolean => {
  return blacklistedTokens.has(token);
};

// Clean up blacklisted tokens (optional, can be called periodically)
export const cleanupBlacklist = (): void => {
  // In a real implementation, you might want to keep track of when tokens were blacklisted
  // and remove them after their expiration time has passed
  // For this demo, we'll just clear the blacklist periodically
  blacklistedTokens.clear();
};
