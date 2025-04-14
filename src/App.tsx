import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/accessibility.css';

// Components
import { ServiceStatusCheck } from '@components/Admin/ServiceStatusCheck';
import { AccessibilityProvider } from './components/common/AccessibilityMenu';
import SkipToContent from './components/common/SkipToContent';
import { RouteGuard } from './components/common/RouteGuard';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyPage from './pages/Auth/VerifyPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ReaderDashboard from './pages/Reader/ReaderDashboard';
import ReaderPage from './pages/Reader/ReaderPage';
import ReaderStatistics from './pages/Reader/ReaderStatistics';
import ConsultantDashboard from './pages/Consultant/ConsultantDashboard';
import ReadersList from './pages/Consultant/ReadersList';
import HelpRequests from './pages/Consultant/HelpRequests';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { ConsultantDashboardPage } from './pages/Consultant/ConsultantDashboardPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Services
import { initializeServices } from './services';
import { AppError } from './utils/errorHandling';
import { appLog } from './components/LogViewer';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        appLog('App', 'Initializing services', 'info');
        await initializeServices();
        setInitialized(true);
        appLog('App', 'Services initialized successfully', 'success');
      } catch (err: any) {
        console.error('Failed to initialize services:', err);
        appLog('App', `Failed to initialize services: ${err.message}`, 'error');
        setError('Failed to initialize application. Please check the console for details.');
      }
    };

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
          </Routes>
        </main>
      </div>
    </Router>
  );

  // Wrap with providers
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
