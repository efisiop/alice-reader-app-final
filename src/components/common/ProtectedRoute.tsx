import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { appLog } from '../LogViewer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'consultant';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requiredRole 
}) => {
  const { user, loading, isConsultant } = useAuth();
  const location = useLocation();

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!user) {
    appLog('ProtectedRoute', 'User not authenticated, redirecting to login', 'info');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required, check it
  if (requiredRole === 'consultant' && !isConsultant()) {
    appLog('ProtectedRoute', 'User not authorized as consultant, redirecting to home', 'warning');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}; 