import api from './config';

export type DeviceInfo = {
  userAgent: string;
  platform: string;
  os: string;
};

export type Session = {
  id: string;
  deviceInfo: DeviceInfo;
  lastUsedAt: string;
  expiresAt: string;
  isRevoked: boolean;
};

export type SessionsResponse = {
  sessions: Session[];
};

export const getActiveSessions = async (): Promise<SessionsResponse> => {
  try {
    const response = await api.get('/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const revokeSession = async (deviceId: string): Promise<void> => {
  try {
    console.log('Revoking session with device ID:', deviceId);
    const response = await api.post('/sessions/revoke', { deviceId });
    console.log('Revoke response:', response.data);
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};
