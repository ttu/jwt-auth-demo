import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActiveSessions, revokeSession } from '../api/sessions';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  os: string;
}

interface Session {
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
  const { logout } = useAuth();

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

  // TODO: Sessions should have unique id, not just userAgent
  const handleRevokeSession = async (userAgent: string) => {
    try {
      await revokeSession(userAgent);
      // If the current session was revoked, log out
      if (userAgent === navigator.userAgent) {
        await logout();
        return;
      }
      // Otherwise, just refresh the sessions list
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session, index) => (
              <tr key={`${session.deviceInfo.userAgent}-${index}`} className={session.isRevoked ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4">
                  <div
                    className={`text-sm max-w-md break-words ${session.isRevoked ? 'text-gray-500' : 'text-gray-900'}`}
                    title={session.deviceInfo.userAgent}
                  >
                    {session.deviceInfo.userAgent}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${session.isRevoked ? 'text-gray-500' : 'text-gray-900'}`}>
                    {session.deviceInfo.platform} ({session.deviceInfo.os})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${session.isRevoked ? 'text-gray-500' : 'text-gray-900'}`}>
                    {new Date(session.lastUsedAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${session.isRevoked ? 'text-gray-500' : 'text-gray-900'}`}>
                    {new Date(session.expiresAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {!session.isRevoked && (
                    <button
                      onClick={() => handleRevokeSession(session.deviceInfo.userAgent)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sessions;
