import api from './config';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  os: string;
}

export interface Session {
  deviceInfo: DeviceInfo;
  lastUsedAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

interface SessionsResponse {
  sessions: Session[];
}

export const getActiveSessions = async (): Promise<SessionsResponse> => {
  try {
    const response = await api.get('/auth/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const revokeSession = async (userAgent: string): Promise<void> => {
  try {
    await api.post('/auth/sessions/revoke', { userAgent });
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};
