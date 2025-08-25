import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCustomers } from '../api/customers';

interface Customer {
  id: number;
  name: string;
  email: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchCustomers = async () => {
      try {
        const response = await getCustomers();
        if (Array.isArray(response)) {
          setCustomers(response);
        } else {
          console.error('Invalid response format:', response);
          setError('Invalid data format received from server');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to fetch customers');
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {customers.map(customer => (
              <li key={customer.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Customers;
