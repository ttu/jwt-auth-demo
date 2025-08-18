import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // debugger; // OAUTH CALLBACK - User returned from OAuth server, processing result
    // Backend has processed OAuth flow and redirected user here with success/error status
    // We're checking URL parameters to determine if OAuth login succeeded
    const success = searchParams.get('success');
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (success === 'true' && token) {
      // debugger; // OAUTH SUCCESS - OAuth login completed, got access token
      // Backend successfully completed OAuth flow and provided access token
      // TODO: This should integrate with AuthContext to properly set up authentication state
      // Store the access token
      // TODO: Check how this is handled in the auth context
      // setAccessToken(token);
      // Redirect to home page
      navigate('/');
    } else if (error) {
      // debugger; // OAUTH FAILED - OAuth login failed, redirecting to login with error
      // OAuth flow failed at some point (user denied, server error, etc.)
      console.error('OAuth error:', error);
      navigate('/login?error=' + encodeURIComponent(error));
    }
  }, [searchParams, navigate]);

  return <div>Processing OAuth callback...</div>;
};

export default OAuthCallback;
