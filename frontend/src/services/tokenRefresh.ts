import {
  getAccessTokenTimeUntilExpiration,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  TOKEN_EXPIRATION_THRESHOLD,
} from '../utils/token';
import { api } from '../api/auth';

// NOTE: This implementation differs from common more simple approaches:
// - Typically, applications know the access token's validity duration and set an interval to check expiration
// - Here, we check the access token's expiration time and schedule the next refresh
// - After refreshing, we schedule the next check based on the new token's expiration

// TODO: Consider moving token refresh logic to a React hook for simpler implementation

let refreshTimeout: NodeJS.Timeout | undefined = undefined;

export const clearRefreshTimeout = () => {
  if (refreshTimeout) {
    console.info('[Token Refresh] Clearing refresh timeout');
    clearTimeout(refreshTimeout);
    refreshTimeout = undefined;
  }
};

export const getNewAccessTokenWithRefresh = async (): Promise<string | undefined> => {
  // debugger; // TOKEN REFRESH API CALL - Making refresh request to backend with HTTP-only cookie
  // We're sending: refresh token (automatically in cookie), device ID in headers
  // Backend will validate refresh token and return new access token
  try {
    const response = await api.post('/auth/refresh');
    // debugger; // REFRESH SUCCESS - Backend returned new access token
    // Got fresh access token, this extends user session without re-login
    console.info('[Token Refresh] Token refresh successful');
    return response.data.accessToken;
  } catch (error) {
    // debugger; // REFRESH FAILED - Refresh token invalid/expired, user needs to re-login
    // Refresh token was rejected, user session has ended
    console.error('[Token Refresh] Token refresh failed:', error);
    return undefined;
  }
};

export const startTokenRefresh = async (accessToken: string, logoutFunction: () => void): Promise<void> => {
  // debugger; // PROACTIVE REFRESH SETUP - Starting automatic token refresh system
  // We calculate when to refresh based on token expiration time minus threshold
  // This prevents users from experiencing token expiration during API calls
  const timeUntilExpiration = getAccessTokenTimeUntilExpiration(accessToken);

  if (refreshTimeout) {
    console.info('[Token Refresh] Clearing existing refresh timeout');
    clearTimeout(refreshTimeout);
  }

  const nextCheckDelay = timeUntilExpiration - TOKEN_EXPIRATION_THRESHOLD; // Refresh token x second before it expires
  console.info(`[Token Refresh] Scheduling next token check in ${Math.round(nextCheckDelay / 1000)} seconds`);
  // debugger; // REFRESH TIMER SET - Timer scheduled to refresh token before expiration
  // Timer will trigger token refresh 5 seconds before expiration (demo: very frequent)
  refreshTimeout = setTimeout(() => checkTokenExpiration(logoutFunction), nextCheckDelay);
};

const checkTokenExpiration = async (logoutFunction: () => void): Promise<void> => {
  // debugger; // TOKEN EXPIRATION CHECK - Timer fired, checking if token needs refresh
  // This runs automatically based on the scheduled timer
  // We'll check token expiration and decide whether to refresh or schedule next check
  const token = getAccessToken();
  if (!token) {
    console.info('[Token Refresh] No token to check expiration for');
    return;
  }

  try {
    const timeUntilExpiration = getAccessTokenTimeUntilExpiration(token);
    console.info(`[Token Refresh] Token expires in ${Math.round(timeUntilExpiration / 1000)} seconds`);

    // Token should be refreshed if it expires in less than 2 seconds
    if (timeUntilExpiration <= TOKEN_EXPIRATION_THRESHOLD) {
      // debugger; // TOKEN REFRESH NEEDED - Token close to expiration, refreshing now
      // Token is about to expire, we need to refresh it immediately
      console.info('[Token Refresh] Token close to expiration, refreshing');
      const newAccessToken = await getNewAccessTokenWithRefresh();

      if (newAccessToken) {
        // debugger; // REFRESH CYCLE COMPLETE - Got new token, restarting refresh cycle
        // Successfully refreshed! Store new token and restart the refresh cycle
        setAccessToken(newAccessToken);
        clearRefreshTimeout();
        startTokenRefresh(newAccessToken, logoutFunction);
      } else {
        // debugger; // REFRESH FAILED - Forcing logout due to refresh failure
        // Refresh failed, user session is over, redirect to login
        clearAccessToken();
        clearRefreshTimeout();
        logoutFunction();
      }
    } else {
      // debugger; // TOKEN STILL VALID - Rescheduling next check
      // Token still has time left, schedule the next expiration check
      startTokenRefresh(token, logoutFunction);
    }
  } catch (error) {
    // debugger; // TOKEN CHECK ERROR - Error during expiration check, clearing auth state
    console.error('[Token Refresh] Error checking token expiration:', error);
    clearAccessToken();
    clearRefreshTimeout();
  }
};
