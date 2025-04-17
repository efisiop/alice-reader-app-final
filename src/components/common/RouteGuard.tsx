import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../LogViewer';

// Define route types
type RouteType = 'public' | 'auth' | 'verified' | 'admin';

interface RouteGuardProps {
  children: React.ReactNode;
  routeType: RouteType;
}

/**
 * RouteGuard component to handle routing based on authentication and verification status
 *
 * routeType options:
 * - 'public': Accessible to everyone (landing, login, register, etc.)
 * - 'auth': Requires authentication but not verification (verify page, logout)
 * - 'verified': Requires authentication and verification (reader dashboard, etc.)
 * - 'admin': Requires admin privileges
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ children, routeType }) => {
  const { user, loading, isVerified, profile } = useAuth();
  const location = useLocation();

  // Log for debugging
  appLog('RouteGuard', `Checking access to ${location.pathname} (type: ${routeType})`, 'info', {
    isAuthenticated: !!user,
    isVerified,
    routeType
  });

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  // Handle different route types
  switch (routeType) {
    case 'public':
      // Public routes are always accessible
      // If user is logged in and verified, some public routes might redirect to reader interaction page
      if (user && isVerified && (location.pathname === '/login' || location.pathname === '/register')) {
        appLog('RouteGuard', 'User is verified, redirecting from public route to reader interaction page', 'info');
        return <Navigate to="/reader/interaction" replace />;
      }
      return <>{children}</>;

    case 'auth':
      // Auth routes require authentication but not verification
      if (!user) {
        appLog('RouteGuard', 'User not authenticated, redirecting to login', 'info');
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
      return <>{children}</>;

    case 'verified':
      // Verified routes require authentication and verification
      if (!user) {
        appLog('RouteGuard', 'User not authenticated, redirecting to login', 'info');
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      if (!isVerified) {
        appLog('RouteGuard', 'User not verified, redirecting to verification page', 'info');
        return <Navigate to="/verify" state={{ from: location }} replace />;
      }

      return <>{children}</>;

    case 'admin':
      // Admin routes require authentication and admin privileges
      if (!user) {
        appLog('RouteGuard', 'User not authenticated, redirecting to login', 'info');
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      // Check admin status (adjust this based on how admin status is stored)
      const isAdmin = profile?.is_admin ||
                     user.email?.endsWith('@alicereader.com') ||
                     user.email === 'admin@example.com';

      if (!isAdmin) {
        appLog('RouteGuard', 'User not authorized for admin access', 'warning');
        return <Navigate to="/reader" replace />;
      }

      return <>{children}</>;

    default:
      // Default to requiring verification for unknown route types
      appLog('RouteGuard', `Unknown route type: ${routeType}, treating as verified route`, 'warning');

      if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      if (!isVerified) {
        return <Navigate to="/verify" state={{ from: location }} replace />;
      }

      return <>{children}</>;
  }
};
