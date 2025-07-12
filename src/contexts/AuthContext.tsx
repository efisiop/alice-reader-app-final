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
      appLog('AuthContext', `Signing in user with email: ${email}`, 'info');
      console.log('AuthContext: Signing in user with email:', email);

      const { data, error } = await backendSignIn(email, password);

      if (error) {
        appLog('AuthContext', 'Error during sign in', 'error', error);
        console.error('AuthContext: Error during sign in:', error);
        throw error;
      }

      if (!data?.user) {
        appLog('AuthContext', 'User not found during sign in', 'error');
        console.error('AuthContext: User not found during sign in');
        throw new Error('User not found');
      }

      appLog('AuthContext', 'Sign in successful', 'success');
      console.log('AuthContext: Sign in successful, user:', data.user);

      // Fetch the user profile after successful sign in
      try {
        const { data: profile, error: profileError } = await backendGetUserProfile(data.user.id);

        if (profileError) {
          appLog('AuthContext', 'Warning: Could not fetch profile after sign in', 'warning', profileError);
          console.warn('AuthContext: Could not fetch profile after sign in:', profileError);
        } else if (profile) {
          appLog('AuthContext', 'Profile fetched successfully after sign in', 'success');
          console.log('AuthContext: Profile fetched successfully after sign in:', profile);
          setProfile(profile);
          setIsVerified(profile.book_verified || false);
        }
      } catch (profileError) {
        appLog('AuthContext', 'Error fetching profile after sign in', 'warning', profileError);
        console.warn('AuthContext: Error fetching profile after sign in:', profileError);
      }

      return { user: data.user, error: null };
    } catch (error) {
      appLog('AuthContext', 'Error signing in', 'error', error);
      console.error('AuthContext: Error signing in:', error);
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
      console.log('AuthContext: Signing up user with email:', email);

      // Create auth user
      const { data, error } = await backendSignUp(email, password);

      if (error) {
        appLog('AuthContext', 'Error during signup', 'error', error);
        console.error('AuthContext: Error during signup:', error);
        throw error;
      }

      if (!data?.user) {
        appLog('AuthContext', 'User creation failed - no user returned', 'error');
        console.error('AuthContext: User creation failed - no user returned');
        throw new Error('User creation failed');
      }

      // The database trigger should create the profile, but let's explicitly update it with first/last name
      appLog('AuthContext', `User created successfully. Updating profile for: ${data.user.id}`, 'info');
      console.log('AuthContext: User created successfully. Updating profile for:', data.user.id);

      try {
        // Wait a moment for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now update the profile with first name and last name
        const { error: updateError } = await backendCreateUserProfile(
          data.user.id,
          firstName,
          lastName,
          email
        );

        if (updateError) {
          appLog('AuthContext', `Warning: Could not update profile with names: ${updateError.message}`, 'warning');
          console.warn('AuthContext: Could not update profile with names:', updateError);
          // Continue despite this error - we'll try to fix it during verification
        } else {
          appLog('AuthContext', 'Profile updated successfully with names', 'success');
          console.log('AuthContext: Profile updated successfully with names');
        }
      } catch (profileError) {
        appLog('AuthContext', 'Error updating profile during signup', 'warning', profileError);
        console.warn('AuthContext: Error updating profile during signup:', profileError);
        // Continue despite this error - we'll try to fix it during verification
      }

      return { user: data.user, error: null };
    } catch (error) {
      appLog('AuthContext', 'Error signing up', 'error', error);
      console.error('AuthContext: Error signing up:', error);
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

      console.log('AuthContext: Starting book verification with code:', code);
      console.log('AuthContext: User ID:', user.id);
      console.log('AuthContext: First name:', firstName);
      console.log('AuthContext: Last name:', lastName);

      const result = await verifyBookCodeComprehensive(code, user.id, firstName, lastName);
      console.log('AuthContext: Verification result:', result);

      if (result.error) {
        console.error('AuthContext: Verification error:', result.error);
        return {
          success: false,
          error: new Error(String(result.error))
        };
      }

      // Immediately update our local state to reflect verification
      console.log('AuthContext: Verification successful, updating isVerified state to true');
      setIsVerified(true);

      // Note: After verification, the user will be redirected to the reader dashboard
      // This happens in the VerifyPage component's useEffect that watches isVerified

      // Force a re-fetch of the profile to ensure all data is in sync
      try {
        console.log('AuthContext: Re-fetching user profile after verification');
        const { data: userProfile } = await backendGetUserProfile(user.id);
        if (userProfile) {
          console.log('AuthContext: Updated profile after verification:', userProfile);
          setProfile(userProfile);
        }
      } catch (profileError) {
        console.error('AuthContext: Error fetching profile after verification:', profileError);
        // Continue with success even if profile fetch fails - the verification was successful
      }

      console.log('AuthContext: Book verification completed successfully');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Unexpected error during verification:', error);
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