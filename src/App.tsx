import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/accessibility.css';

// Components
import { ServiceStatusCheck } from '@components/Admin/ServiceStatusCheck';
import { AccessibilityProvider } from './components/common/AccessibilityMenu';
import SnackbarProvider from './components/common/SnackbarProvider';
import SkipToContent from './components/common/SkipToContent';
import { RouteGuard } from './components/common/RouteGuard';
import Header from './components/common/Header';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyPage from './pages/Auth/VerifyPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ReaderDashboard from './pages/Reader/ReaderDashboard';
import ReaderPage from './pages/Reader/ReaderPage';
import ReaderStatistics from './pages/Reader/ReaderStatistics';
import MainInteractionPage from './pages/Reader/MainInteractionPage';
import ConsultantDashboard from './pages/Consultant/ConsultantDashboard';
import ReadersList from './pages/Consultant/ReadersList';
import HelpRequests from './pages/Consultant/HelpRequests';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProxySettingsPage from './pages/Admin/ProxySettingsPage';
import SupabaseTestPage from './pages/Admin/SupabaseTestPage';
import { ConsultantDashboardPage } from './pages/Consultant/ConsultantDashboardPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
// Import test pages only in development mode
// These imports are conditionally loaded to prevent 404 errors in production
const TestPage = import.meta.env.DEV ? React.lazy(() => import('./pages/TestPage')) : () => null;
// Import simple test pages that don't rely on services
import TestSimple from './TestSimple';
import TestSupabase from './TestSupabase';

// Services
import { initializeServices } from './services';
import { AppError } from './utils/errorHandling';
import { appLog } from './components/LogViewer';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  console.log('App.tsx: Component rendering');
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        appLog('App', 'Initializing services', 'info');
        console.log('App: Initializing services - VERBOSE DEBUG');

        // Log environment variables (without exposing sensitive data)
        console.log('App: Environment check - VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
        console.log('App: Environment check - VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Initialize services
        console.log('App: About to call initializeServices()');
        const result = await initializeServices();
        console.log('App: Services initialization result:', result);

        // Even if initializeServices returns false, we'll continue
        // This is to handle the case where services are already initialized
        console.log('App: Setting initialized state to true');
        setInitialized(true);
        appLog('App', 'Services initialized successfully', 'success');
        console.log('App: Services initialized successfully');
      } catch (err: any) {
        console.error('App: Failed to initialize services:', err);
        console.error('App: Error details:', err.stack || 'No stack trace available');
        appLog('App', `Failed to initialize services: ${err.message}`, 'error');
        setError('Failed to initialize application. Please check the console for details.');
      }
    };

    console.log('App: Running init effect');
    init();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h2>Initialization Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="loading-container">
        <h2>Initializing Application...</h2>
        <p>Please wait while the services are being initialized.</p>
      </div>
    );
  }

  const AppContent = () => (
    <Router>
      <div className="App">
        <SkipToContent contentId="main-content" />
        <Header />
        <main id="main-content">
          <Routes>
            {/* Public Routes - Accessible to everyone */}
            <Route path="/" element={<RouteGuard routeType="public"><LandingPage /></RouteGuard>} />
            <Route path="/login" element={<RouteGuard routeType="public"><LoginPage /></RouteGuard>} />
            <Route path="/register" element={<RouteGuard routeType="public"><RegisterPage /></RouteGuard>} />
            <Route path="/forgot-password" element={<RouteGuard routeType="public"><ForgotPasswordPage /></RouteGuard>} />

            {/* Auth Routes - Require authentication but not verification */}
            <Route path="/verify" element={<RouteGuard routeType="auth"><VerifyPage /></RouteGuard>} />

            {/* Reader Routes - Require authentication and verification */}
            <Route path="/reader" element={<RouteGuard routeType="verified"><ReaderDashboard /></RouteGuard>} />
            <Route path="/reader/interaction" element={<RouteGuard routeType="verified"><MainInteractionPage /></RouteGuard>} />
            <Route path="/reader/book/:bookId" element={<RouteGuard routeType="verified"><MainInteractionPage /></RouteGuard>} />
            <Route path="/reader/:bookId/page/:pageNumber" element={<RouteGuard routeType="verified"><ReaderPage /></RouteGuard>} />
            <Route path="/reader/statistics" element={<RouteGuard routeType="verified"><ReaderStatistics /></RouteGuard>} />

            {/* Consultant Routes */}
            <Route path="/consultant" element={<RouteGuard routeType="verified"><ConsultantDashboard /></RouteGuard>} />
            <Route path="/consultant/readers" element={<RouteGuard routeType="verified"><ReadersList /></RouteGuard>} />
            <Route path="/consultant/help-requests" element={<RouteGuard routeType="verified"><HelpRequests /></RouteGuard>} />
            <Route
              path="/consultant-dashboard"
              element={
                <RouteGuard routeType="verified">
                  <ProtectedRoute requiredRole="consultant">
                    <ConsultantDashboardPage />
                  </ProtectedRoute>
                </RouteGuard>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<RouteGuard routeType="admin"><AdminDashboard /></RouteGuard>} />

            {/* Admin Routes - Service Status */}
            <Route path="/service-status" element={<RouteGuard routeType="admin"><ServiceStatusCheck /></RouteGuard>} />

            {/* Admin Routes - Proxy Settings */}
            <Route path="/proxy-settings" element={<ProxySettingsPage />} />

            {/* Admin Routes - Supabase Test */}
            <Route path="/supabase-test" element={<SupabaseTestPage />} />

            {/* Test Routes - Only available in development mode */}
            {/* We need to use individual conditional rendering for each Route */}
            {import.meta.env.DEV && <Route path="/test" element={<TestPage />} />}
            {import.meta.env.DEV && <Route path="/test-reader-page/:pageNumber" element={<ReaderPage />} />}
            {import.meta.env.DEV && <Route path="/test-main-interaction" element={<MainInteractionPage />} />}
            {/* Simple test routes that don't rely on services */}
            <Route path="/test-simple" element={<TestSimple />} />
            <Route path="/test-supabase" element={<TestSupabase />} />
            {/* Direct access routes are removed for production */}
          </Routes>
        </main>
      </div>
    </Router>
  );

  // Wrap with providers
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <SnackbarProvider>
          <AppContent />
        </SnackbarProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
