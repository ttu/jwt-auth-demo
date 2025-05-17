import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (success === 'true' && token) {
      // Store the access token
      // TODO: Check how this is handled in the auth context
      // setAccessToken(token);
      // Redirect to home page
      navigate('/');
    } else if (error) {
      // Handle error case
      console.error('OAuth error:', error);
      navigate('/login?error=' + encodeURIComponent(error));
    }
  }, [searchParams, navigate]);

  return <div>Processing OAuth callback...</div>;
};

export default OAuthCallback;
