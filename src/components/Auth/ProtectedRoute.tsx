import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireVerification?: boolean;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerification = true
}) => {
  const { user, loading, isVerified } = useAuth();
  const location = useLocation();

  // For testing, allow access even without authentication
  const bypassAuth = true;
  if (bypassAuth) return <>{children}</>;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerification && !isVerified) {
    return <Navigate to="/verify" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;