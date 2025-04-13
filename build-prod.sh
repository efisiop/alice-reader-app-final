#!/bin/bash

# Create a temporary directory for the production build
mkdir -p temp-prod-build

# Copy only the necessary files to the temporary directory
echo "Copying files to temporary directory..."
cp -r src temp-prod-build/
cp -r public temp-prod-build/
cp package.json temp-prod-build/
cp tsconfig.json temp-prod-build/
cp tsconfig.node.json temp-prod-build/
cp index.html temp-prod-build/
cp .env.production temp-prod-build/

# Create a simplified vite.config.ts
cat > temp-prod-build/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/alice-reader/',
  define: {
    'import.meta.env.VITE_APP_ENV': JSON.stringify('production'),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_BETA_MODE': JSON.stringify(false),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})
EOF

# Create a simplified App.tsx without Beta components
cat > temp-prod-build/src/App.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/accessibility.css';

// Components
import TestServiceRegistry from './components/TestServiceRegistry';
import { ServiceStatusCheck } from '@components/Admin/ServiceStatusCheck';
import { AccessibilityProvider } from './components/common/AccessibilityMenu';
import SkipToContent from './components/common/SkipToContent';

// Pages
import ServiceTestPage from './pages/test/ServiceTestPage';
import ServiceRegistryTestPage from './pages/ServiceRegistryTestPage';
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
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Reader Routes */}
            <Route path="/reader" element={<ReaderDashboard />} />
            <Route path="/reader/:bookId/page/:pageNumber" element={<ReaderPage />} />
            <Route path="/reader/statistics" element={<ReaderStatistics />} />

            {/* Consultant Routes */}
            <Route path="/consultant" element={<ConsultantDashboard />} />
            <Route path="/consultant/readers" element={<ReadersList />} />
            <Route path="/consultant/help-requests" element={<HelpRequests />} />
            <Route 
              path="/consultant-dashboard" 
              element={
                <ProtectedRoute requiredRole="consultant">
                  <ConsultantDashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Development Routes */}
            <Route path="/test-registry" element={<TestServiceRegistry />} />
            <Route path="/service-test" element={<ServiceTestPage />} />
            <Route path="/service-status" element={<ServiceStatusCheck />} />
            <Route path="/service-registry-test" element={<ServiceRegistryTestPage />} />
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
EOF

# Remove Beta directories
echo "Removing Beta directories..."
rm -rf temp-prod-build/src/components/Beta
rm -rf temp-prod-build/src/pages/Beta

# Create empty placeholder Beta directories
mkdir -p temp-prod-build/src/components/Beta
mkdir -p temp-prod-build/src/pages/Beta

# Create placeholder BetaWrapper component
cat > temp-prod-build/src/components/BetaWrapper.tsx << 'EOF'
import React from 'react';

type BetaWrapperProps = React.PropsWithChildren<{}>;

export function BetaWrapper({ children }: BetaWrapperProps) {
  return <>{children}</>;
}

export default BetaWrapper;
EOF

# Run the build in the temporary directory
echo "Running build in temporary directory..."
cd temp-prod-build
npm install
npm run build

# Copy the build output back to the main directory
echo "Copying build output back to main directory..."
cd ..
rm -rf dist
cp -r temp-prod-build/dist .

# Clean up
echo "Cleaning up..."
rm -rf temp-prod-build

echo "Build completed successfully!"
