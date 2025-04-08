import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
};

type Session = {
  user: User;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isVerified: boolean;
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Mock authentication functions for testing
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock successful sign-in
      const mockUser = { id: 'mock-id', email };
      setUser(mockUser);
      setSession({ user: mockUser });
      return { user: mockUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock successful sign-up
      const mockUser = { id: 'mock-id', email };
      setUser(mockUser);
      setSession({ user: mockUser });
      return { user: mockUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isVerified,
    setIsVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};