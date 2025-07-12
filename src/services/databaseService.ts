import { getSupabaseClient } from './supabaseClient';
import {
  getCurrentSchemaVersion,
  applyMigrations,
  rollbackMigrations,
  verifySchema,
  getMigrationFiles,
  getMigrationSql
} from '../utils/migrationUtils';
import { appLog } from '../components/LogViewer';
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { handleServiceError } from '../utils/errorHandling';
import { DbSchema } from '../types/database';
import { SupabaseClientOptions } from '@supabase/supabase-js';
import { ErrorCode, AppError } from '../utils/errorHandling';
import { UserProfile } from '../types/user';
import { BookDetails } from '../types/book';

/**
 * Database Service Interface
 */
export interface DatabaseServiceInterface {
  getCurrentSchemaVersion: () => Promise<number>;
  getAvailableMigrations: () => any[];
  applyMigrations: (targetVersion: number) => Promise<boolean>;
  rollbackMigrations: (targetVersion: number) => Promise<boolean>;
  verifySchema: () => Promise<boolean>;
  getTableInfo: () => Promise<{ data: any; error: any }>;
  executeSQL: (sql: string) => Promise<{ success: boolean; error: any }>;
  checkDatabaseConnection: () => Promise<{ connected: boolean; error: any }>;
  getSchemaVersionHistory: () => Promise<{ data: any; error: any }>;
}

/**
 * Create Database Service
 *
 * Factory function to create the database service implementation
 */
const createDatabaseService = async (): Promise<DatabaseServiceInterface> => {
  appLog('DatabaseService', 'Creating database service', 'info');

  // Get Supabase client
  const supabase = await getSupabaseClient();

  // Create service implementation
  const databaseService: DatabaseServiceInterface = {
    /**
     * Get the current schema version
     */
    getCurrentSchemaVersion: () => getCurrentSchemaVersion(supabase),

    /**
     * Get all available migrations
     */
    getAvailableMigrations: () => migrations,

    /**
     * Apply migrations up to the target version
     */
    applyMigrations: (targetVersion: number) => applyMigrations(supabase, targetVersion),

    /**
     * Roll back migrations to the target version
     */
    rollbackMigrations: (targetVersion: number) => rollbackMigrations(supabase, targetVersion),

    /**
     * Verify the database schema against expected state
     */
    verifySchema: () => verifySchema(supabase),

    /**
     * Get information about all tables in the database
     */
    getTableInfo: async () => {
      try {
        appLog('DatabaseService', 'Getting table information', 'info');
        const { data, error } = await supabase.rpc('get_tables');

        if (error) {
          appLog('DatabaseService', 'Error getting table information', 'error', error);
          throw error;
        }

        return { data, error: null };
      } catch (error) {
        appLog('DatabaseService', 'Exception in getTableInfo', 'error', error);
        return { data: null, error };
      }
    },

    /**
     * Execute a SQL query directly
     * WARNING: This is potentially dangerous and should only be used by administrators
     */
    executeSQL: async (sql: string) => {
      try {
        appLog('DatabaseService', 'Executing SQL', 'info');
        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
          appLog('DatabaseService', 'Error executing SQL', 'error', error);
          return { success: false, error };
        }

        return { success: true, error: null };
      } catch (error) {
        appLog('DatabaseService', 'Exception in executeSQL', 'error', error);
        return { success: false, error };
      }
    },

    /**
     * Check if the database is accessible
     */
    checkDatabaseConnection: async () => {
      try {
        appLog('DatabaseService', 'Checking database connection', 'info');
        const { data, error } = await supabase.from('books').select('id').limit(1);

        if (error) {
          appLog('DatabaseService', 'Database connection check failed', 'error', error);
          return { connected: false, error };
        }

        return { connected: true, error: null };
      } catch (error) {
        appLog('DatabaseService', 'Exception in checkDatabaseConnection', 'error', error);
        return { connected: false, error };
      }
    },

    /**
     * Get the database schema version history
     */
    getSchemaVersionHistory: async () => {
      try {
        appLog('DatabaseService', 'Getting schema version history', 'info');

        // Check if schema_versions table exists
        const { error: checkError } = await supabase.from('schema_versions').select('id').limit(1);

        if (checkError) {
          appLog('DatabaseService', 'Schema versions table does not exist yet', 'info');
          return { data: [], error: null };
        }

        const { data, error } = await supabase
          .from('schema_versions')
          .select('*')
          .order('version', { ascending: false });

        if (error) {
          appLog('DatabaseService', 'Error getting schema version history', 'error', error);
          return { data: null, error };
        }

        return { data, error: null };
      } catch (error) {
        appLog('DatabaseService', 'Exception in getSchemaVersionHistory', 'error', error);
        return { data: null, error };
      }
    }
  };

  return databaseService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('databaseService', async () => {
  const service = await createDatabaseService();
  registry.register('databaseService', service);
});

// Create backward-compatible exports
export const getCurrentSchemaVersion = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.getCurrentSchemaVersion();
};

export const getAvailableMigrations = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.getAvailableMigrations();
};

export const applyMigrations = async (targetVersion: number) => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.applyMigrations(targetVersion);
};

export const rollbackMigrations = async (targetVersion: number) => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.rollbackMigrations(targetVersion);
};

export const verifySchema = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.verifySchema();
};

export const getTableInfo = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.getTableInfo();
};

export const executeSQL = async (sql: string) => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.executeSQL(sql);
};

export const checkDatabaseConnection = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.checkDatabaseConnection();
};

export const getSchemaVersionHistory = async () => {
  const service = await registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
  return service.getSchemaVersionHistory();
};

// For backward compatibility
export const getDatabaseService = async () => {
  return registry.getOrInitialize<DatabaseServiceInterface>('databaseService', initManager);
};

// Default export for backward compatibility
export default {
  getCurrentSchemaVersion,
  getAvailableMigrations,
  applyMigrations,
  rollbackMigrations,
  verifySchema,
  getTableInfo,
  executeSQL,
  checkDatabaseConnection,
  getSchemaVersionHistory,
  getDatabaseService
};
