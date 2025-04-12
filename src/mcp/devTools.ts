import mcpInstance from './instance';

// Development tools for Cursor integration
export const mcpDevTools = {
  // Toggle mock mode
  toggleMock: (enabled: boolean) => {
    mcpInstance.setMockEnabled(enabled);
  },

  // Toggle caching
  toggleCache: (enabled: boolean) => {
    mcpInstance.setCacheEnabled(enabled);
  },

  // Clear cache
  clearCache: () => {
    mcpInstance.clearCache();
  },

  // Get current state
  getState: () => {
    return mcpInstance.getConfig();
  },

  // Set mock user data
  setMockUser: (userData: any) => {
    mcpInstance.setMockData('mockUser', userData);
  }
};

// Make devTools available globally in development
if (import.meta.env.DEV) {
  (window as any).mcpDevTools = mcpDevTools;
} 