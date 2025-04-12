// Mock auth service for debugging
const mockAuthService = {
  users: new Map<string, { email: string; id: string; verified: boolean }>(),
  
  // Set verification status
  setUserVerified(id: string, verified: boolean) {
    const user = this.users.get(id);
    if (user) {
      user.verified = verified;
      this.users.set(id, user);
      console.log(`User ${id} verification status set to: ${verified}`);
      return true;
    }
    console.error(`User ${id} not found for verification`);
    return false;
  }
};

export function initializeDebugHelpers() {
  // Make mock auth service available globally for debugging
  if (process.env.NODE_ENV === 'development') {
    (window as any)._mockAuthService = mockAuthService;
    
    // Add debug utilities
    (window as any)._debug = {
      // Get auth state from localStorage
      getStoredAuth: () => {
        try {
          const stored = localStorage.getItem('mockAuthSession');
          return stored ? JSON.parse(stored) : null;
        } catch (e) {
          console.error('Error parsing stored session:', e);
          return null;
        }
      },
      
      // List all mock users
      listMockUsers: () => {
        const users = Array.from(mockAuthService.users.entries())
          .map(([id, user]) => ({
            id,
            email: user.email,
            verified: user.verified
          }));
        console.table(users);
        return users;
      },
      
      // Manually set verification status
      setUserVerified: (userId: string, status: boolean) => {
        const result = mockAuthService.setUserVerified(userId, status);
        console.log(`Set user ${userId} verified status to ${status}: ${result ? 'Success' : 'Failed'}`);
        return result;
      },
      
      // Clear all stored auth
      clearAuth: () => {
        localStorage.removeItem('mockAuthSession');
        console.log('Cleared stored auth session');
      }
    };
    
    console.log('Debug helpers initialized. Try window._debug in console');
  }
}
