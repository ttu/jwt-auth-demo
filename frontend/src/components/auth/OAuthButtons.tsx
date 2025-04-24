import React from 'react';
import { OAuthProvider } from '../../services/oauth';
import OAuthButton from './OAuthButton';

interface OAuthButtonsProps {
  onOAuthLogin: (provider: OAuthProvider) => void;
  isLoading: boolean;
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onOAuthLogin, isLoading }) => {
  const providers: OAuthProvider[] = ['google', 'microsoft', 'strava', 'company'];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {providers.map(provider => (
        <OAuthButton key={provider} provider={provider} onClick={onOAuthLogin} disabled={isLoading} />
      ))}
    </div>
  );
};

export default OAuthButtons;
