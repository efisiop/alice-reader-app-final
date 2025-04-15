import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  signIn as backendSignIn,
  signUp as backendSignUp,
  signOut as backendSignOut,
  getUserProfile as backendGetUserProfile,
  createUserProfile as backendCreateUserProfile,
  getSession as backendGetSession,
  onAuthStateChange as backendOnAuthStateChange,
  verifyBookCodeComprehensive
} from '../services/backendService';
import { checkSupabaseConnection } from '../services/supabaseClient';
import { isBackendAvailable } from '../services/backendConfig';
import { appLog } from '../components/LogViewer';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_consultant: boolean;
    is_verified: boolean;
    book_verified: boolean;
  } | null;
  loading: boolean;
  isVerified: boolean;
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signOut: () => Promise<void>;
  verifyBook: (code: string, firstName?: string, lastName?: string) => Promise<{
    success: boolean;
    error?: Error | null;
  }>;
  isConsultant: () => boolean;
};

// Export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('AuthProvider: Mounting / Initializing');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Sign out using backend service
  const signOut = async () => {
    try {
      await backendSignOut();
      // Clear all local state immediately
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsVerified(false);
      setLoading(false);

      // Clear any localStorage data that might have been set by Supabase
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Check for session on initial load
  useEffect(() => {
    console.log('AuthProvider: Initial useEffect running...');
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      try {
        // Set up the auth state change listener first
        const { data: listenerData } = await backendOnAuthStateChange(async (_event: any, newSession: Session | null) => {
          if (!mounted) return;

          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            try {
              const { data: userProfile, error: profileError } = await backendGetUserProfile(newSession.user.id);

              if (profileError) {
                appLog('AuthContext', `Error fetching profile for user ${newSession.user.id}:`, 'error', profileError);
                if (mounted) {
                  setProfile(null);
                  setIsVerified(false);
                }
              } else if (userProfile && mounted) {
                appLog('AuthContext', `Profile loaded for user ${newSession.user.id}`, 'success');
                setProfile(userProfile);
                setIsVerified(userProfile.book_verified || false);
              }
            } catch (error) {
              appLog('AuthContext', 'Error in profile fetch flow:', 'error', error);
              if (mounted) {
                setProfile(null);
                setIsVerified(false);
              }
            }
          } else if (mounted) {
            setProfile(null);
            setIsVerified(false);
          }
        });

        if (listenerData?.subscription) {
          subscription = listenerData.subscription;
          console.log('AuthProvider: State Change Listener Attached');
        }

        // Then get the initial session
        const { data: sessionData, error: sessionError } = await backendGetSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        const currentSession = sessionData.session;
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);

          try {
            const { data: userProfile, error: profileError } = await backendGetUserProfile(currentSession.user.id);

            if (profileError) {
              appLog('AuthContext', `Error fetching profile for user ${currentSession.user.id}:`, 'error', profileError);
            } else if (mounted) {
              appLog('AuthContext', `Profile loaded for user ${currentSession.user.id}`, 'success');
              setProfile(userProfile);
              setIsVerified(userProfile?.book_verified || false);
            }
          } catch (error) {
            appLog('AuthContext', 'Error in profile fetch flow:', 'error', error);
          }
        }
      } catch (error) {
        console.error('Error in auth setup:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password using backend service
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await backendSignIn(email, password);

      if (error) throw error;
      if (!data?.user) throw new Error('User not found');

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password using backend service
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      appLog('AuthContext', `Signing up user with email: ${email}`, 'info');

      // Create auth user
      const { data, error } = await backendSignUp(email, password);

      if (error) {
        appLog('AuthContext', 'Error during signup', 'error', error);
        throw error;
      }

      if (!data?.user) {
        appLog('AuthContext', 'User creation failed - no user returned', 'error');
        throw new Error('User creation failed');
      }

      // The database trigger should automatically create the profile
      // No manual profile creation here - rely solely on the database trigger
      appLog('AuthContext', `User created successfully. Database trigger should create profile for: ${data.user.id}`, 'info');

      return { user: data.user, error: null };
    } catch (error) {
      appLog('AuthContext', 'Error signing up', 'error', error);
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    } finally {
      setLoading(false);
    }
  };

  // Verify book code
  const verifyBook = async (code: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: Error | null }> => {
    try {
      if (!user) {
        return { success: false, error: new Error('User not authenticated') };
      }

      const result = await verifyBookCodeComprehensive(code, user.id, firstName, lastName);
      if (result.error) {
        return {
          success: false,
          error: new Error(String(result.error))
        };
      }
      setIsVerified(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during verification')
      };
    }
  };

  // Helper function to check if user is a consultant
  const isConsultant = () => {
    return profile?.is_consultant || false;
  };

  const value = {
    session,
    user,
    profile,
    loading,
    isVerified,
    setIsVerified,
    signIn,
    signUp,
    signOut,
    verifyBook,
    isConsultant
  };

  console.log('AuthProvider: Initial loading state:', loading);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};