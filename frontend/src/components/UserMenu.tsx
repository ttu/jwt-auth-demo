import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const UserMenu: React.FC = () => {
  const location = useLocation();

  return (
    <Link
      to="/account"
      className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
        location.pathname === '/account'
          ? 'text-indigo-600 bg-indigo-50'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <UserIcon />
      <span className="text-sm font-medium">Account</span>
    </Link>
  );
};

export default UserMenu;
