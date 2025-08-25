import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Customers from './components/Customers';
import Sessions from './components/Sessions';
import Account from './components/Account';
import Navigation from './components/Navigation';
import OAuthCallback from './components/OAuthCallback';
import { DebugTokenView } from './components/DebugTokenView';

interface RouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AuthRoute: React.FC<RouteProps & { isPrivate?: boolean }> = ({
  children,
  isPrivate = false,
  redirectTo = isPrivate ? '/login' : '/customers',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const shouldRedirect = isPrivate ? !isAuthenticated : isAuthenticated;

  return shouldRedirect ? <Navigate to={redirectTo} /> : <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="py-6">{children}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <AuthRoute isPrivate>
                <Layout>
                  <Customers />
                </Layout>
              </AuthRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <AuthRoute isPrivate>
                <Layout>
                  <Sessions />
                </Layout>
              </AuthRoute>
            }
          />
          <Route
            path="/account"
            element={
              <AuthRoute isPrivate>
                <Layout>
                  <Account />
                </Layout>
              </AuthRoute>
            }
          />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <DebugTokenView />
      </Router>
    </AuthProvider>
  );
};

export default App;
