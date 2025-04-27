import { OAuthState } from '../types';

export const encodeState = (state: OAuthState): string => {
  return Buffer.from(JSON.stringify(state)).toString('base64');
};

export const decodeState = (encodedState: string): OAuthState => {
  return JSON.parse(Buffer.from(encodedState, 'base64').toString());
};
