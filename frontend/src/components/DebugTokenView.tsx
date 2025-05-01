import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import jwt_decode from 'jwt-decode';

type DecodedToken = {
  exp: number;
  iat: number;
  [key: string]: any;
};

type TokenInfo = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenDecoded?: DecodedToken;
  refreshTokenDecoded?: DecodedToken;
  lastUpdated: number;
  accessTokenFetchedAt?: number;
  refreshTokenFetchedAt?: number;
};

export const DebugTokenView: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    lastUpdated: Date.now(),
  });

  useEffect(() => {
    const updateTokenInfo = () => {
      const accessToken = getAccessToken();
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refreshToken='))
        ?.split('=')[1];

      let accessTokenDecoded: DecodedToken | undefined;
      let refreshTokenDecoded: DecodedToken | undefined;

      if (accessToken) {
        try {
          accessTokenDecoded = jwt_decode<DecodedToken>(accessToken);
        } catch (e) {
          console.error('Failed to decode access token:', e);
        }
      }

      if (refreshToken) {
        try {
          refreshTokenDecoded = jwt_decode<DecodedToken>(refreshToken);
        } catch (e) {
          console.error('Failed to decode refresh token:', e);
        }
      }

      setTokenInfo(prev => ({
        accessToken,
        refreshToken,
        accessTokenDecoded,
        refreshTokenDecoded,
        lastUpdated: Date.now(),
        // Only update fetch timestamps when tokens change
        accessTokenFetchedAt: accessToken !== prev.accessToken ? Date.now() : prev.accessTokenFetchedAt,
        refreshTokenFetchedAt: refreshToken !== prev.refreshToken ? Date.now() : prev.refreshTokenFetchedAt,
      }));
    };

    // Update immediately
    updateTokenInfo();
    setCurrentTime(new Date());

    // Update every second
    const interval = setInterval(() => {
      updateTokenInfo();
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [getAccessToken]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '3px 8px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1001,
          fontFamily: 'monospace',
          fontSize: '11px',
        }}
      >
        {isVisible ? 'Hide Token Debug' : 'Show Token Debug'}
      </button>

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '11px',
            width: '600px',
            height: '600px',
            zIndex: 1000,
          }}
        >
          <h3 style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Token Debug View</h3>
          <div style={{ marginBottom: '8px', color: '#aaa' }}>Current Time: {currentTime.toLocaleString()}</div>

          <div style={{ marginBottom: '8px' }}>
            <strong>Access Token:</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '2px' }}>{tokenInfo.accessToken || 'None'}</div>
            {tokenInfo.accessTokenFetchedAt && (
              <div style={{ marginTop: '2px' }}>Fetched At: {formatDate(tokenInfo.accessTokenFetchedAt)}</div>
            )}
          </div>

          {tokenInfo.accessTokenDecoded && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Access Token Info:</strong>
              <div style={{ marginTop: '2px' }}>Issued At: {formatDate(tokenInfo.accessTokenDecoded.iat * 1000)}</div>
              <div style={{ marginTop: '2px' }}>Expires At: {formatDate(tokenInfo.accessTokenDecoded.exp * 1000)}</div>
              <div style={{ marginTop: '2px' }}>
                Time Until Expiry:{' '}
                {Math.max(0, Math.round((tokenInfo.accessTokenDecoded.exp * 1000 - Date.now()) / 1000))} seconds
              </div>
            </div>
          )}

          <div style={{ marginBottom: '8px' }}>
            <strong>Refresh Token:</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '2px' }}>{tokenInfo.refreshToken || 'None'}</div>
            {tokenInfo.refreshTokenFetchedAt && (
              <div style={{ marginTop: '2px' }}>Fetched At: {formatDate(tokenInfo.refreshTokenFetchedAt)}</div>
            )}
          </div>

          {tokenInfo.refreshTokenDecoded && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Refresh Token Info:</strong>
              <div style={{ marginTop: '2px' }}>Issued At: {formatDate(tokenInfo.refreshTokenDecoded.iat * 1000)}</div>
              <div style={{ marginTop: '2px' }}>Expires At: {formatDate(tokenInfo.refreshTokenDecoded.exp * 1000)}</div>
              <div style={{ marginTop: '2px' }}>
                Time Until Expiry:{' '}
                {Math.max(0, Math.round((tokenInfo.refreshTokenDecoded.exp * 1000 - Date.now()) / 1000))} seconds
              </div>
            </div>
          )}

          <div>
            <strong>Last Updated:</strong> {formatDate(tokenInfo.lastUpdated)}
          </div>
        </div>
      )}
    </>
  );
};
