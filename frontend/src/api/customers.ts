import api from './config';

export type Customer = {
  id: number;
  name: string;
  email: string;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get('/customers/list');
  return response.data;
};
