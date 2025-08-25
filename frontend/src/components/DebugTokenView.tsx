import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import jwt_decode from 'jwt-decode';

type DecodedToken = {
  exp: number;
  iat: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// CSS styles as a string to be injected
const debugTokenCSS = `
  .debug-token-toggle {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 3px 8px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1001;
    font-family: monospace;
    font-size: 11px;
  }

  .debug-token-toggle:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .debug-token-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px;
    font-family: monospace;
    font-size: 13px;
    width: 40vw;
    height: 70vh;
    z-index: 1000;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top-left-radius: 8px;
  }

  .debug-token-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .debug-token-title {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
  }

  .debug-token-current-time {
    color: #aaa;
    font-size: 11px;
  }

  .debug-token-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    height: 100%;
  }

  .debug-token-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .debug-token-section-header {
    border-bottom: 1px solid #444;
    padding-bottom: 4px;
  }

  .debug-token-access-header {
    color: #4CAF50;
    font-weight: bold;
  }

  .debug-token-refresh-header {
    color: #FF9800;
    font-weight: bold;
  }

  .debug-token-raw-label {
    color: #ccc;
    font-size: 11px;
  }

  .debug-token-raw-container {
    word-break: break-all;
    font-size: 8px;
    max-height: 100px;
    overflow: auto;
    background-color: #333;
    padding: 4px;
    border-radius: 2px;
    white-space: pre-wrap;
  }

  .debug-token-raw-container::-webkit-scrollbar {
    width: 4px;
  }

  .debug-token-raw-container::-webkit-scrollbar-track {
    background: #444;
  }

  .debug-token-raw-container::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 2px;
  }

  .debug-token-fetched-time {
    font-size: 10px;
    color: #aaa;
  }

  .debug-token-claims-label {
    color: #ccc;
    font-size: 11px;
    margin-bottom: 4px;
  }

  .debug-token-claims-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 8px;
    font-size: 11px;
  }

  .debug-token-claim-label {
    color: #888;
  }

  .debug-token-claim-value {
    font-family: monospace;
  }

  .debug-token-expires-red {
    color: #ff6b6b;
    font-weight: bold;
  }

  .debug-token-expires-orange {
    color: #ff9800;
    font-weight: bold;
  }

  .debug-token-expires-green {
    color: #4CAF50;
  }

  .debug-token-footer {
    border-top: 1px solid #444;
    padding-top: 4px;
    margin-top: auto;
  }

  .debug-token-last-updated {
    font-size: 10px;
    color: #666;
  }
`;

export const DebugTokenView: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    lastUpdated: Date.now(),
  });

  // Inject CSS styles
  // TODO: Fix styles in frontend
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = debugTokenCSS;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const updateTokenInfo = () => {
      const accessToken = getAccessToken();
      // For demo purposes refresh token is accessible in javascript
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
      <button onClick={() => setIsVisible(!isVisible)} className="debug-token-toggle">
        {isVisible ? 'Hide Token Debug' : 'Show Token Debug'}
      </button>

      {isVisible && (
        <div className="debug-token-panel">
          <div className="debug-token-header">
            <h3 className="debug-token-title">Token Debug View</h3>
            <div className="debug-token-current-time">Current Time: {currentTime.toLocaleString()}</div>
          </div>

          <div className="debug-token-grid">
            {/* Access Token Column */}
            <div className="debug-token-column">
              <div className="debug-token-section-header">
                <strong className="debug-token-access-header">ACCESS TOKEN</strong>
              </div>

              <div>
                <div className="debug-token-raw-label">Raw Token:</div>
                <div className="debug-token-raw-container">
                  {tokenInfo.accessToken ? tokenInfo.accessToken.replace(/(.{50})/g, '$1\n') : 'None'}
                </div>
                {tokenInfo.accessTokenFetchedAt && (
                  <div className="debug-token-fetched-time">Fetched: {formatDate(tokenInfo.accessTokenFetchedAt)}</div>
                )}
              </div>

              {tokenInfo.accessTokenDecoded && (
                <div>
                  <div className="debug-token-claims-label">Claims:</div>
                  <div className="debug-token-claims-grid">
                    <span className="debug-token-claim-label">sub:</span>
                    <span>{tokenInfo.accessTokenDecoded.sub}</span>

                    <span className="debug-token-claim-label">iss:</span>
                    <span>{tokenInfo.accessTokenDecoded.iss}</span>

                    <span className="debug-token-claim-label">aud:</span>
                    <span>{tokenInfo.accessTokenDecoded.aud}</span>

                    <span className="debug-token-claim-label">jti:</span>
                    <span className="debug-token-claim-value">{tokenInfo.accessTokenDecoded.jti}</span>

                    <span className="debug-token-claim-label">scope:</span>
                    <span>{tokenInfo.accessTokenDecoded.scope}</span>

                    <span className="debug-token-claim-label">version:</span>
                    <span>{tokenInfo.accessTokenDecoded.version}</span>

                    <span className="debug-token-claim-label">iat:</span>
                    <span>{formatDate(tokenInfo.accessTokenDecoded.iat * 1000)}</span>

                    <span className="debug-token-claim-label">exp:</span>
                    <span>{formatDate(tokenInfo.accessTokenDecoded.exp * 1000)}</span>

                    <span className="debug-token-claim-label">expires in:</span>
                    <span
                      className={
                        Math.max(0, Math.round((tokenInfo.accessTokenDecoded.exp * 1000 - Date.now()) / 1000)) < 30
                          ? 'debug-token-expires-red'
                          : 'debug-token-expires-green'
                      }
                    >
                      {Math.max(0, Math.round((tokenInfo.accessTokenDecoded.exp * 1000 - Date.now()) / 1000))}s
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Token Column */}
            <div className="debug-token-column">
              <div className="debug-token-section-header">
                <strong className="debug-token-refresh-header">REFRESH TOKEN</strong>
              </div>

              <div>
                <div className="debug-token-raw-label">Raw Token:</div>
                <div className="debug-token-raw-container">
                  {tokenInfo.refreshToken
                    ? tokenInfo.refreshToken.replace(/(.{50})/g, '$1\n')
                    : 'None - may be restricted by cookie path configuration'}
                </div>
                {tokenInfo.refreshTokenFetchedAt && (
                  <div className="debug-token-fetched-time">Fetched: {formatDate(tokenInfo.refreshTokenFetchedAt)}</div>
                )}
              </div>

              {tokenInfo.refreshTokenDecoded && (
                <div>
                  <div className="debug-token-claims-label">Claims:</div>
                  <div className="debug-token-claims-grid">
                    <span className="debug-token-claim-label">sub:</span>
                    <span>{tokenInfo.refreshTokenDecoded.sub}</span>

                    <span className="debug-token-claim-label">iss:</span>
                    <span>{tokenInfo.refreshTokenDecoded.iss}</span>

                    <span className="debug-token-claim-label">aud:</span>
                    <span>{tokenInfo.refreshTokenDecoded.aud}</span>

                    <span className="debug-token-claim-label">jti:</span>
                    <span className="debug-token-claim-value">{tokenInfo.refreshTokenDecoded.jti}</span>

                    <span className="debug-token-claim-label">scope:</span>
                    <span>{tokenInfo.refreshTokenDecoded.scope}</span>

                    <span className="debug-token-claim-label">version:</span>
                    <span>{tokenInfo.refreshTokenDecoded.version}</span>

                    <span className="debug-token-claim-label">iat:</span>
                    <span>{formatDate(tokenInfo.refreshTokenDecoded.iat * 1000)}</span>

                    <span className="debug-token-claim-label">exp:</span>
                    <span>{formatDate(tokenInfo.refreshTokenDecoded.exp * 1000)}</span>

                    <span className="debug-token-claim-label">expires in:</span>
                    <span
                      className={
                        Math.max(0, Math.round((tokenInfo.refreshTokenDecoded.exp * 1000 - Date.now()) / 1000)) < 3600
                          ? 'debug-token-expires-orange'
                          : 'debug-token-expires-green'
                      }
                    >
                      {Math.max(0, Math.round((tokenInfo.refreshTokenDecoded.exp * 1000 - Date.now()) / 1000))}s
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="debug-token-footer">
            <div className="debug-token-last-updated">Last Updated: {formatDate(tokenInfo.lastUpdated)}</div>
          </div>
        </div>
      )}
    </>
  );
};
