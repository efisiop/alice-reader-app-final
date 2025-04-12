// src/config/env.js
// DEPRECATED: Use src/config/environment.ts instead
// This file is kept for backward compatibility

import ENV from './environment';

// Export the ENV object for backward compatibility
export { ENV };

// Export a safe Supabase instantiation function
export async function createSupabaseClient() {
  // Use the function from environment.ts
  const { createSupabaseClient: createClient } = await import('./environment');
  return createClient();
}
