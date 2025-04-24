export type OAuthProvider = 'google' | 'microsoft' | 'strava' | 'company';

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  provider: OAuthProvider;
}

export interface OAuthAuthorizationRequest {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  provider: OAuthProvider;
}

export interface OAuthTokenRequest {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  provider: OAuthProvider;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
}

export interface OAuthProviderConfig {
  [key: string]: OAuthConfig;
}
