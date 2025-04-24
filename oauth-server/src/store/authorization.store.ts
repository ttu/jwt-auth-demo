import { OAuthProvider } from '../types';

export interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  provider: OAuthProvider;
  expiresAt: number;
}

const store = new Map<string, AuthorizationCode>();

export function setAuthorizationCode(code: string, data: AuthorizationCode): void {
  store.set(code, data);
}

export function getAuthorizationCode(code: string): AuthorizationCode | undefined {
  return store.get(code);
}

export function deleteAuthorizationCode(code: string): boolean {
  return store.delete(code);
}

export function hasAuthorizationCode(code: string): boolean {
  return store.has(code);
}

export function clearExpiredAuthorizationCodes(): void {
  const now = Date.now();
  for (const [code, data] of store.entries()) {
    if (data.expiresAt < now) {
      store.delete(code);
    }
  }
}
