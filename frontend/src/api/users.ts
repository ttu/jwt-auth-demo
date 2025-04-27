import api from './config';

export type User = {
  id: number;
  name: string;
  email: string;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users/list');
  return response.data;
};
