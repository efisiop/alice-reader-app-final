// Debug script to help diagnose GitHub Pages issues
document.addEventListener('DOMContentLoaded', function() {
  console.log('Debug script loaded');

  // Check if main script has loaded
  const mainScriptLoaded = document.querySelector('script[src*="main"]') !== null;
  console.log('Main script tag found:', mainScriptLoaded);

  // Check if the app has loaded within 5 seconds
  setTimeout(function() {
    const root = document.getElementById('root');
    const appLoaded = root && root.children.length > 1; // More than just the loading message
    console.log('App loaded check:', appLoaded);

    if (!appLoaded) {
      // If app hasn't loaded, show debug info
      const debugInfo = document.createElement('div');
      debugInfo.style.padding = '20px';
      debugInfo.style.maxWidth = '800px';
      debugInfo.style.margin = '0 auto';
      debugInfo.style.fontFamily = 'sans-serif';

      // Check for script errors
      const scriptErrors = [];
      window.onerror = function(message, source, lineno, colno, error) {
        scriptErrors.push({ message, source, lineno, colno });
        return false;
      };

      debugInfo.innerHTML = `
        <h2>Debug Info</h2>
        <p><strong>GitHub Pages:</strong> ${window.location.hostname.includes('github.io')}</p>
        <p><strong>Base URL:</strong> ${window.location.href}</p>
        <p><strong>Path:</strong> ${window.location.pathname}</p>
        <p><strong>Supabase URL:</strong> ${!!window.SUPABASE_URL}</p>
        <p><strong>Supabase Key:</strong> ${!!window.SUPABASE_KEY}</p>
        <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Main Script Found:</strong> ${mainScriptLoaded}</p>

        <h3>Possible Issues:</h3>
        <ul>
          <li>The base path in vite.config.ts might not match the repository name</li>
          <li>The React router might not be configured for GitHub Pages</li>
          <li>There might be a JavaScript error preventing the app from loading</li>
          <li>The main.tsx script might not be loading correctly</li>
        </ul>

        <p>Try checking the browser console for errors.</p>

        <button onclick="window.location.href='/#/'" style="margin-top: 20px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Try Hash Router Path
        </button>

        <button onclick="window.location.reload()" style="margin-top: 20px; margin-left: 10px; padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      `;

      root.innerHTML = '';
      root.appendChild(debugInfo);
    }
  }, 5000);
});
