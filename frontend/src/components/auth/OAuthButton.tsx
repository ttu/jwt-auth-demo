import React from 'react';
import { OAuthProvider } from '../../services/oauth';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: (provider: OAuthProvider) => void;
  disabled: boolean;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, onClick, disabled }) => {
  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return (
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        );
      case 'microsoft':
        return (
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
        );
      case 'strava':
        return (
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM9.46 13.847l-2.084-4.116H4.31l5.15 10.172 5.15-10.172h-3.066l-2.084 4.116z" />
        );
      case 'company':
        return (
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        );
    }
  };

  return (
    <button
      onClick={() => onClick(provider)}
      disabled={disabled}
      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="sr-only">Sign in with {provider}</span>
      <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
        {getProviderIcon()}
      </svg>
    </button>
  );
};

export default OAuthButton;
