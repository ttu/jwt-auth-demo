import React, { useState, useEffect } from 'react';
import { getActiveSessions, revokeSession } from '../api/sessions';
import { getDeviceId } from '../utils/device';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  os: string;
}

interface Session {
  id: string;
  deviceInfo: DeviceInfo;
  lastUsedAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

interface SessionsResponse {
  sessions: Session[];
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data: SessionsResponse = await getActiveSessions();
      setSessions(data.sessions);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (deviceId: string) => {
    try {
      await revokeSession(deviceId);
      // Refresh the sessions list after successful revocation
      await fetchSessions();
    } catch (err) {
      setError('Failed to revoke session');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Current Device ID:</span>{' '}
          <span className="font-mono">{localStorage.getItem('deviceId')}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Current User Agent:</span>{' '}
          <span className="font-mono">{navigator.userAgent}</span>
        </p>
      </div>
      <div className="grid gap-4">
        {sessions.map(session => (
          <div key={session.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">Session ID: {session.id}</p>
                <p className="text-gray-600">Device: {session.deviceInfo.userAgent}</p>
                <p className="text-gray-600">Platform: {session.deviceInfo.platform}</p>
                <p className="text-gray-600">Last Used: {new Date(session.lastUsedAt).toLocaleString()}</p>
                <p className="text-gray-600">Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                {session.isRevoked && <p className="text-red-500 font-semibold">Revoked</p>}
              </div>
              {!session.isRevoked && (
                <button
                  onClick={() => handleRevokeSession(getDeviceId())}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sessions;
