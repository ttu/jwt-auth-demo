import { cleanupExpiredTokens } from '../stores/refreshToken.store';
import { cleanupBlacklist } from '../stores/tokenBlacklist.store';

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the token cleanup process
 * @param intervalMs - Interval in milliseconds between cleanup runs (default: 5 minutes)
 */
export const startCleanup = (intervalMs: number = 5 * 60 * 1000): void => {
  if (cleanupInterval) {
    console.warn('Token cleanup is already running');
    return;
  }

  console.log('Starting token cleanup');
  cleanupInterval = setInterval(() => {
    console.log('Running token cleanup');
    cleanupExpiredTokens();
    cleanupBlacklist();
  }, intervalMs);
};

/**
 * Stop the token cleanup process
 */
export const stopCleanup = (): void => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Token cleanup stopped');
  }
};
