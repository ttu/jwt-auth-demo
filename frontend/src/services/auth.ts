import { getAccessTokenTimeUntilExpiration, getAccessToken, setAccessToken, clearAccessToken } from '../utils/token';
import { api } from '../api/auth';

const TOKEN_EXPIRATION_THRESHOLD = 2000;

// NOTE: This implementation differs from common more simple approaches:
// - Typically, applications know the access token's validity duration and set an interval to check expiration
// - Here, we check the access token's expiration time and schedule the next refresh
// - After refreshing, we schedule the next check based on the new token's expiration

// TODO: Consider moving token refresh logic to a React hook for simpler implementation

let refreshTimeout: NodeJS.Timeout | undefined = undefined;

export const clearRefreshTimeout = () => {
  if (refreshTimeout) {
    console.info('[Authentication] Clearing refresh timeout');
    clearTimeout(refreshTimeout);
    refreshTimeout = undefined;
  }
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
  } catch (error) {
    console.error('[Authentication] Error checking token validity:', accessToken);
    return false;
  }
};

export const getNewAccessTokenWithRefresh = async (): Promise<string | undefined> => {
  try {
    const response = await api.post('/auth/refresh');
    console.info('[Authentication] Token refresh successful');
    return response.data.accessToken;
  } catch (error) {
    console.error('[Authentication] Token refresh failed:', error);
    return undefined;
  }
};

export const startTokenRefresh = async (accessToken: string, logoutFunction: () => void): Promise<void> => {
  const timeUntilExpiration = getAccessTokenTimeUntilExpiration(accessToken);

  if (refreshTimeout) {
    console.info('[Authentication] Clearing existing refresh timeout');
    clearTimeout(refreshTimeout);
  }

  const nextCheckDelay = timeUntilExpiration - TOKEN_EXPIRATION_THRESHOLD; // Refresh token x second before it expires
  console.info(`[Authentication] Scheduling next token check in ${Math.round(nextCheckDelay / 1000)} seconds`);
  refreshTimeout = setTimeout(() => checkTokenExpiration(logoutFunction), nextCheckDelay);
};

export const checkTokenExpiration = async (logoutFunction: () => void): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    console.info('[Authentication] No token to check expiration for');
    return;
  }

  try {
    const timeUntilExpiration = getAccessTokenTimeUntilExpiration(token);
    console.info(`[Authentication] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);

    // Token should be refreshed if it expires in less than 2 seconds
    if (timeUntilExpiration <= TOKEN_EXPIRATION_THRESHOLD) {
      console.info('[Authentication] Token close to expiration, refreshing');
      const newAccessToken = await getNewAccessTokenWithRefresh();
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        clearRefreshTimeout();
        startTokenRefresh(newAccessToken, logoutFunction);
      } else {
        clearAccessToken();
        clearRefreshTimeout();
        logoutFunction();
      }
    } else {
      startTokenRefresh(token, logoutFunction);
    }
  } catch (error) {
    console.error('[Authentication] Error checking token expiration:', error);
    clearAccessToken();
    clearRefreshTimeout();
  }
};
