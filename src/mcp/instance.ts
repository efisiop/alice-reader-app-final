import SupabaseMCP from './supabaseMcp';
import { mcpConfig } from './config';

// Create a singleton instance
const mcpInstance = new SupabaseMCP(mcpConfig);

// Export the instance
export default mcpInstance;

// Export type for TypeScript support
export type { SupabaseMCP }; 