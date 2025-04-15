export const mcpConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  mockEnabled: false, // Disable mock mode to ensure real authentication
  cacheEnabled: true,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  debug: import.meta.env.DEV
};