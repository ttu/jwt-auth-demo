import { OAuthProvider } from '../types';

export type AuthorizationCode = {
  code: string;
  clientId: string;
  redirectUri: string;
  provider: OAuthProvider;
  expiresAt: number;
};

const store = new Map<string, AuthorizationCode>();

export const setAuthorizationCode = (code: string, data: AuthorizationCode): void => {
  store.set(code, data);
};

export const getAuthorizationCode = (code: string): AuthorizationCode | undefined => {
  return store.get(code);
};

export const deleteAuthorizationCode = (code: string): boolean => {
  return store.delete(code);
};

export const hasAuthorizationCode = (code: string): boolean => {
  return store.has(code);
};

export const clearExpiredAuthorizationCodes = (): void => {
  const now = Date.now();
  for (const [code, data] of store.entries()) {
    if (data.expiresAt < now) {
      store.delete(code);
    }
  }
};
