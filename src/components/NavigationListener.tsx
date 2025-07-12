import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { appLog } from './LogViewer';

/**
 * Component that listens for navigation events and logs them
 * This helps with debugging navigation issues
 */
const NavigationListener = () => {
  const location = useLocation();

  // Listen for location changes
  useEffect(() => {
    appLog('Navigation', `Route changed to: ${location.pathname}`, 'info', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    });
  }, [location]);

  // Listen for popstate events (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      appLog('Navigation', 'Browser navigation (back/forward) detected', 'info');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default NavigationListener;
