import { OAuthUserInfo } from '../types/index';

// In-memory store for OAuth user information
// In production, this would be stored in a database
const oauthUsers: { [key: string]: OAuthUserInfo } = {};

export const storeOAuthUser = (email: string, userInfo: OAuthUserInfo): void => {
  oauthUsers[email] = userInfo;
};

export const getOAuthUser = (email: string): OAuthUserInfo | null => {
  return oauthUsers[email] || null;
};

export const removeOAuthUser = (email: string): void => {
  delete oauthUsers[email];
};
