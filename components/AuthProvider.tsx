// ============================================================================
// MARKET ORACLE - AUTH PROVIDER
// Wraps app with centralized authentication context
// Created: December 15, 2025
// ============================================================================

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  credits: number;
  subscriptionTier: string;
  signIn: (provider: 'google' | 'github' | 'apple' | 'azure' | 'discord') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
