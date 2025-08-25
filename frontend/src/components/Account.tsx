import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveSessions, revokeSession } from '../api/sessions';
import { getUserProfile } from '../api/auth';
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

interface UserProfile {
  userId: number;
  username: string;
  email: string;
  name?: string;
  provider: string;
  authType: 'oauth' | 'password';
}

const Account: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to fetch user profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const data: SessionsResponse = await getActiveSessions();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to fetch sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (deviceId: string) => {
    try {
      await revokeSession(deviceId);
      await fetchSessions();
    } catch (err) {
      setError('Failed to revoke session');
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchUserProfile();
    fetchSessions();
  }, [isAuthenticated, navigate]);

  if (loadingProfile || loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading account information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          <p className="text-gray-600 mt-2">Manage your profile and active sessions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* User Profile Section */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
            </div>
            <div className="px-6 py-4">
              {userProfile ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {userProfile.name && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userProfile.name}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userProfile.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Authentication Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userProfile.authType === 'oauth' ? `OAuth (${userProfile.provider})` : 'Password'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{userProfile.userId}</dd>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Unable to load profile information</p>
              )}
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
              <p className="text-sm text-gray-600 mt-1">Manage devices that are currently signed into your account</p>
            </div>
            <div className="px-6 py-4">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Current Device ID:</span>{' '}
                  <span className="font-mono">{localStorage.getItem('deviceId')}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Current User Agent:</span>{' '}
                  <span className="font-mono text-xs">{navigator.userAgent}</span>
                </p>
              </div>

              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map(session => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">Session ID: {session.id}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Device:</span> {session.deviceInfo.userAgent}
                            </p>
                            <p>
                              <span className="font-medium">Platform:</span> {session.deviceInfo.platform}
                            </p>
                            <p>
                              <span className="font-medium">Last Used:</span>{' '}
                              {new Date(session.lastUsedAt).toLocaleString()}
                            </p>
                            <p>
                              <span className="font-medium">Expires:</span>{' '}
                              {new Date(session.expiresAt).toLocaleString()}
                            </p>
                            {session.isRevoked && <p className="text-red-600 font-semibold">Revoked</p>}
                          </div>
                        </div>
                        {!session.isRevoked && (
                          <button
                            onClick={() => handleRevokeSession(getDeviceId())}
                            className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active sessions found</p>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Account Actions</h2>
            </div>
            <div className="px-6 py-4">
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
              <p className="text-sm text-gray-500 mt-2">
                This will sign you out of all devices and redirect you to the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
