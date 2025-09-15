import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // If not authenticated, show the landing page (with modal auth) instead of redirecting
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;