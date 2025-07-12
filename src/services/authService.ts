// src/services/authService.ts
import { registry } from '@services/serviceRegistry';
import { initManager } from './initManager';
import { getSupabaseClient } from './supabaseClient';
import { appLog } from '../components/LogViewer';
import { handleServiceError } from '../utils/errorHandling';
import { mockBackend } from './mockBackend';
import { isBackendAvailable } from './backendConfig';
import { Session, User } from '@supabase/supabase-js';
import { logInteraction, InteractionEventType } from './loggingService';

/**
 * Auth Service Interface
 */
export interface AuthServiceInterface {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<any>;
  signOut: () => Promise<any>;
  getSession: () => Promise<any>;
  getUser: () => Promise<any>;
  getUserProfile: (userId: string) => Promise<any>;
  createUserProfile: (userId: string, data: any) => Promise<any>;
  updateUserProfile: (userId: string, data: any) => Promise<any>;
  onAuthStateChange: (callback: (event: any, session: Session | null) => void) => any;
  resetPassword: (email: string) => Promise<any>;
  verifyBookCode: (code: string) => Promise<any>;
}

/**
 * Create Auth Service
 *
 * Factory function to create the auth service implementation
 */
export const createAuthService = async (): Promise<AuthServiceInterface> => {
  appLog('AuthService', 'Creating auth service', 'info');

  // Helper function to check if we should use the real backend
  const useRealBackend = async (): Promise<boolean> => {
    return await isBackendAvailable();
  };

  // Create service implementation
  const authService: AuthServiceInterface = {
    signIn: async (email: string, password: string) => {
      try {
        appLog('AuthService', 'Signing in user', 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const result = await client.auth.signInWithPassword({ email, password });
          if (result.error) throw result.error;

          // Log successful login
          if (result.data?.user) {
            await logInteraction(result.data.user.id, InteractionEventType.LOGIN, {
              content: 'User logged in successfully'
            }).catch(err => {
              // Just log the error but don't fail the login
              appLog('AuthService', 'Error logging login interaction', 'error', err);
            });
          }

          return result;
        } else {
          return mockBackend.auth.signIn(email, password);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'signIn');
      }
    },

    signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
      try {
        appLog('AuthService', 'Signing up user', 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();

          // Include first_name and last_name in user metadata if provided
          const options = firstName && lastName ? {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          } : undefined;

          const result = await client.auth.signUp({ email, password, options });
          if (result.error) throw result.error;
          return result;
        } else {
          return mockBackend.auth.signUp(email, password);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'signUp');
      }
    },

    signOut: async () => {
      try {
        appLog('AuthService', 'Signing out user', 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const result = await client.auth.signOut();
          if (result.error) throw result.error;
          return result;
        } else {
          return mockBackend.auth.signOut();
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'signOut');
      }
    },

    getSession: async () => {
      try {
        appLog('AuthService', 'Getting session', 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const result = await client.auth.getSession();
          if (result.error) throw result.error;
          return result;
        } else {
          return mockBackend.auth.getSession();
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'getSession');
      }
    },

    getUser: async () => {
      try {
        appLog('AuthService', 'Getting user', 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data, error } = await client.auth.getUser();
          if (error) throw error;
          return { data, error: null };
        } else {
          return mockBackend.auth.getUser();
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'getUser');
      }
    },

    getUserProfile: async (userId: string) => {
      try {
        appLog('AuthService', `Getting user profile for ${userId}`, 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            appLog('AuthService', `Error fetching profile for user ${userId}:`, 'error', error.message);
            throw error;
          }

          appLog('AuthService', `Profile fetched successfully for user ${userId}`, 'success');
          return { data, error: null };
        } else {
          return mockBackend.auth.getUserProfile(userId);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'getUserProfile');
      }
    },

    createUserProfile: async (userId: string, data: any) => {
      try {
        appLog('AuthService', `Creating user profile for ${userId}`, 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data: profile, error } = await client
            .from('profiles')
            .insert({
              id: userId,
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          return { data: profile, error: null };
        } else {
          return mockBackend.auth.createUserProfile(userId, data);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'createUserProfile');
      }
    },

    updateUserProfile: async (userId: string, data: any) => {
      try {
        appLog('AuthService', `Updating user profile for ${userId}`, 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data: profile, error } = await client
            .from('profiles')
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;
          return { data: profile, error: null };
        } else {
          return mockBackend.auth.updateUserProfile(userId, data);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'updateUserProfile');
      }
    },

    onAuthStateChange: (callback) => {
      try {
        appLog('AuthService', 'Setting up auth state change listener', 'info');

        if (useRealBackend()) {
          const client = getSupabaseClient();
          return client.auth.onAuthStateChange(callback);
        } else {
          return mockBackend.auth.onAuthStateChange(callback);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'onAuthStateChange');
      }
    },

    resetPassword: async (email: string) => {
      try {
        appLog('AuthService', `Sending password reset email to ${email}`, 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data, error } = await client.auth.resetPasswordForEmail(email);
          if (error) throw error;
          return { data, error: null };
        } else {
          return mockBackend.auth.resetPassword(email);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'resetPassword');
      }
    },

    verifyBookCode: async (code: string) => {
      try {
        appLog('AuthService', `Verifying book code: ${code}`, 'info');

        if (await useRealBackend()) {
          const client = await getSupabaseClient();
          const { data, error } = await client
            .from('verification_codes')
            .select('*')
            .eq('code', code)
            .eq('is_used', false)
            .single();

          if (error) throw error;
          return { data, error: null };
        } else {
          return mockBackend.auth.verifyBookCode(code);
        }
      } catch (error) {
        throw handleServiceError(error, 'authService', 'verifyBookCode');
      }
    }
  };

  return authService;
};

// Register initialization function
// The dependencies are automatically loaded from SERVICE_DEPENDENCIES
initManager.register('authService', async () => {
  const service = await createAuthService();
  registry.register('authService', service);
});

// Create backward-compatible exports
export const signIn = async (email: string, password: string) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.signIn(email, password);
};

export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.signUp(email, password, firstName, lastName);
};

export const signOut = async () => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.signOut();
};

export const getSession = async () => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.getSession();
};

export const getUser = async () => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.getUser();
};

export const getUserProfile = async (userId: string) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.getUserProfile(userId);
};

export const createUserProfile = async (userId: string, data: any) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.createUserProfile(userId, data);
};

export const updateUserProfile = async (userId: string, data: any) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.updateUserProfile(userId, data);
};

export const onAuthStateChange = (callback: (event: any, session: Session | null) => void) => {
  const service = registry.get<AuthServiceInterface>('authService');
  return service.onAuthStateChange(callback);
};

export const resetPassword = async (email: string) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.resetPassword(email);
};

export const verifyBookCode = async (code: string) => {
  const service = await registry.getOrInitialize<AuthServiceInterface>('authService', initManager);
  return service.verifyBookCode(code);
};

// Default export for backward compatibility
export default {
  signIn,
  signUp,
  signOut,
  getSession,
  getUser,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  onAuthStateChange,
  resetPassword,
  verifyBookCode
};
