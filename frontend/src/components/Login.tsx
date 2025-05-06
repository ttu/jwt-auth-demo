import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initiateOAuthLogin, OAuthProvider } from '../services/oauth';
import LoginForm from './auth/LoginForm';
import OAuthButtons from './auth/OAuthButtons';
import Divider from './common/Divider';

const Login: React.FC = () => {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { passwordLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await passwordLogin(username, password);
      navigate('/users');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setIsLoading(true);
    setError('');

    try {
      await initiateOAuthLogin(provider);
    } catch (err) {
      setError('Failed to initiate OAuth login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Demo credentials are pre-filled</p>
        </div>

        <LoginForm
          username={username}
          password={password}
          error={error}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />

        <Divider text="Or continue with" />

        <OAuthButtons onOAuthLogin={handleOAuthLogin} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Login;
