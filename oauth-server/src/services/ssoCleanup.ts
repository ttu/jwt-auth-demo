import { cleanupExpiredSSOSessions } from '../stores/sso-session.store';
import { clearExpiredAuthorizationCodes } from '../stores/authorization.store';

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the SSO session cleanup process
 * @param intervalMs - Interval in milliseconds between cleanup runs (default: 5 minutes, same as backend)
 */
export const startSSOCleanup = (intervalMs: number = 5 * 60 * 1000): void => {
  if (cleanupInterval) {
    console.warn('SSO cleanup is already running');
    return;
  }

  console.log('Starting SSO session cleanup');
  cleanupInterval = setInterval(() => {
    console.log('Running SSO session cleanup');
    cleanupExpiredSSOSessions();
    clearExpiredAuthorizationCodes();
  }, intervalMs);
};

/**
 * Stop the SSO session cleanup process
 */
export const stopSSOCleanup = (): void => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('SSO cleanup stopped');
  }
};
