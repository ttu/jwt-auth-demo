import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { OAuthProvider } from '../types';
import { config } from '../config';

export type SSOSession = {
  id: string;
  userId: string;
  provider: OAuthProvider;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
};

/**
 * Helper function to hash session tokens (following backend pattern)
 */
const hashSessionToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

/**
 * In-memory store for SSO sessions (keyed by hashed session ID)
 */
const ssoSessions = new Map<string, SSOSession>();

/**
 * Generate a cryptographically secure session ID
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * Store an SSO session
 */
export const storeSSOSession = (sessionId: string, userId: string, provider: OAuthProvider): void => {
  const sessionHash = hashSessionToken(sessionId);
  const now = new Date();
  const expiresAt = new Date(Date.now() + config.sso.sessionExpiry * 1000);

  ssoSessions.set(sessionHash, {
    id: sessionId,
    userId,
    provider,
    createdAt: now,
    lastUsedAt: now,
    expiresAt,
    isRevoked: false,
  });

  console.log(`[SSO Store] Created session for user ${userId} with provider ${provider}`, {
    sessionId: sessionId.substring(0, 16) + '...',
    expiresAt: expiresAt.toISOString(),
  });
};

/**
 * Find an SSO session
 */
export const findSSOSession = (sessionId: string): SSOSession | null => {
  if (!sessionId) {
    return null;
  }

  const sessionHash = hashSessionToken(sessionId);
  const session = ssoSessions.get(sessionHash);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    console.log(`[SSO Store] Session expired for user ${session.userId}`, {
      sessionId: sessionId.substring(0, 16) + '...',
      expiredAt: session.expiresAt.toISOString(),
    });
    ssoSessions.delete(sessionHash);
    return null;
  }

  // Check if session is revoked
  if (session.isRevoked) {
    return null;
  }

  // Update last used timestamp
  session.lastUsedAt = new Date();

  return session;
};

/**
 * Revoke an SSO session
 */
export const revokeSSOSession = (sessionId: string): boolean => {
  if (!sessionId) {
    return false;
  }

  const sessionHash = hashSessionToken(sessionId);
  const session = ssoSessions.get(sessionHash);

  if (session) {
    session.isRevoked = true;
    console.log(`[SSO Store] Revoked session for user ${session.userId}`, {
      sessionId: sessionId.substring(0, 16) + '...',
    });
    return true;
  }

  return false;
};

/**
 * Delete an SSO session
 */
export const deleteSSOSession = (sessionId: string): boolean => {
  if (!sessionId) {
    return false;
  }

  const sessionHash = hashSessionToken(sessionId);
  const deleted = ssoSessions.delete(sessionHash);

  if (deleted) {
    console.log(`[SSO Store] Deleted session`, {
      sessionId: sessionId.substring(0, 16) + '...',
    });
  }

  return deleted;
};

/**
 * Get all active sessions for a user
 */
export const getUserSSOSessions = (
  userId: string
): Array<{
  id: string;
  provider: OAuthProvider;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}> => {
  const sessions = [];
  const now = new Date();

  for (const session of ssoSessions.values()) {
    if (session.userId === userId && now < session.expiresAt && !session.isRevoked) {
      sessions.push({
        id: session.id,
        provider: session.provider,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        isRevoked: session.isRevoked,
      });
    }
  }

  return sessions;
};

/**
 * Clean up expired SSO sessions
 */
export const cleanupExpiredSSOSessions = (): void => {
  const now = new Date();

  for (const [sessionHash, session] of ssoSessions.entries()) {
    if (now > session.expiresAt) {
      ssoSessions.delete(sessionHash);
    }
  }
};

/**
 * Get SSO session statistics
 */
export const getSSOSessionStats = () => {
  const now = new Date();
  let activeCount = 0;
  let expiredCount = 0;

  for (const session of ssoSessions.values()) {
    if (now < session.expiresAt && !session.isRevoked) {
      activeCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    active: activeCount,
    expired: expiredCount,
    total: ssoSessions.size,
  };
};
