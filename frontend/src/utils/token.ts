import jwt_decode from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'access_token';
export const TOKEN_EXPIRATION_THRESHOLD = 2000;

export const getAccessToken = (): string | undefined => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ?? undefined;
};

export const setAccessToken = (token: string): void => {
  console.info('[Authentication] Setting access token:', token);
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  console.info('[Authentication] Removing access token and authorization header');
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getAccessTokenTimeUntilExpiration = (accessToken: string): number => {
  const decoded = jwt_decode<{ exp: number }>(accessToken);
  const expirationTime = decoded.exp * 1000;
  return expirationTime - Date.now();
};

export const checkTokenValidity = (accessToken: string): boolean => {
  try {
    const timeUntilExpiration = getAccessTokenTimeUntilExpiration(accessToken);

    if (timeUntilExpiration <= TOKEN_EXPIRATION_THRESHOLD) {
      console.info('[Authentication] Token close to expiration.');
      return false;
    }

    console.info(`[Authentication] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);
    return true;
  } catch (_error) {
    console.error('[Authentication] Error checking token validity:', accessToken);
    return false;
  }
};

export const consoleLogTokens = () => {
  // Check if we have a token on initial load
  const token = getAccessToken();
  console.log('[Authentication] Initial token check', { hasAccessToken: !!token });

  // Check refresh token from cookie
  // NOTE: If httpOnly is true, the refresh token will not be accessible to JavaScript
  const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='));
  console.log('[Authentication] Refresh token check', { hasRefreshToken: !!refreshToken });
};
