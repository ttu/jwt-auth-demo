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
    const response = await api.get('/auth/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  try {
    console.log('Revoking session with ID:', sessionId);
    const response = await api.post('/auth/sessions/revoke', { sessionId });
    console.log('Revoke response:', response.data);
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};
