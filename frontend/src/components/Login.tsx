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
    // debugger; // PASSWORD FORM SUBMIT - User clicked login button with username/password
    // Form validation passed, now calling AuthContext to perform login
    e.preventDefault();
    setError('');

    try {
      await passwordLogin(username, password);
      // debugger; // PASSWORD LOGIN SUCCESS - Login successful, navigating to protected content
      // AuthContext confirmed login success, user is now authenticated
      navigate('/users');
    } catch (err) {
      // debugger; // PASSWORD LOGIN FAILED - Login failed, showing error to user
      // Login attempt failed, display error message for user to try again
      setError('Invalid credentials');
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    // debugger; // OAUTH BUTTON CLICK - User clicked OAuth provider button (Google, Microsoft, etc.)
    // Starting OAuth flow for selected provider
    setIsLoading(true);
    setError('');

    try {
      await initiateOAuthLogin(provider);
      // Note: If successful, user will be redirected to OAuth server, so this code won't continue
    } catch (err) {
      // debugger; // OAUTH INITIATION FAILED - Failed to start OAuth flow
      // OAuth initiation failed, showing error and resetting UI state
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
