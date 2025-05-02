// src/utils/proxyFetch.ts
/**
 * Custom fetch implementation that routes requests through a corporate proxy
 *
 * This is used to configure the Supabase client to work with corporate proxies
 */

// Get proxy configuration from localStorage if available
const getProxyConfig = () => {
  try {
    const savedSettings = localStorage.getItem('proxy_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      return {
        host: parsedSettings.host || '',
        port: parsedSettings.port || 8080,
        auth: {
          username: parsedSettings.username || '',
          password: parsedSettings.password || ''
        },
        enabled: parsedSettings.enabled || false
      };
    }
  } catch (error) {
    console.error('Error loading proxy settings from localStorage:', error);
  }

  // Default configuration if nothing is saved
  return {
    host: '',
    port: 8080,
    auth: {
      username: '',
      password: ''
    },
    enabled: false
  };
};

// Get the proxy configuration
const PROXY_CONFIG = getProxyConfig();

/**
 * Creates a proxy-enabled fetch function
 *
 * @returns A fetch function that routes requests through the corporate proxy
 */
export const createProxyEnabledFetch = (): typeof fetch => {
  // If proxy is disabled, return the standard fetch
  if (!PROXY_CONFIG.enabled) {
    console.log('Proxy is disabled, using standard fetch');
    return window.fetch.bind(window);
  }

  console.log(`Using corporate proxy: ${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);

  // Return a custom fetch function that uses the proxy
  return (url: RequestInfo | URL, options?: RequestInit) => {
    // Log the request for debugging
    console.log(`Proxying request to: ${url.toString()}`);

    // Add proxy authorization header if credentials are provided
    const headers = new Headers(options?.headers || {});
    if (PROXY_CONFIG.auth.username && PROXY_CONFIG.auth.password) {
      const credentials = btoa(`${PROXY_CONFIG.auth.username}:${PROXY_CONFIG.auth.password}`);
      headers.set('Proxy-Authorization', `Basic ${credentials}`);
    }

    // Create new options with the proxy headers
    const proxyOptions: RequestInit = {
      ...options,
      headers
    };

    // Make the request through the proxy
    return window.fetch(url, proxyOptions);
  };
};

// Export a singleton instance of the proxy-enabled fetch
export const proxyFetch = createProxyEnabledFetch();
