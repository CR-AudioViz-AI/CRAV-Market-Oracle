// ============================================================================
// MARKET ORACLE - CENTRALIZED AUTH HOOK
// Single auth state across all CR AudioViz AI apps
// Created: December 15, 2025
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  credits: number;
  subscriptionTier: string;
}

interface UseAuthReturn extends AuthState {
  signIn: (provider: 'google' | 'github' | 'apple' | 'azure' | 'discord') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

// Main website URL for auth redirects
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://craudiovizai.com';

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    credits: 0,
    subscriptionTier: 'free',
  });

  const supabase = createSupabaseBrowserClient();

  // Fetch user credits from centralized system
  const refreshCredits = useCallback(async () => {
    if (!state.user) return;
    
    try {
      const { data } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', state.user.id)
        .single();
      
      if (data) {
        setState(prev => ({ ...prev, credits: data.balance }));
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }, [state.user, supabase]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      setState(prev => ({
        ...prev,
        user: session?.user || null,
        session,
        loading: false,
      }));

      if (session?.user) {
        // Fetch credits
        const { data: credits } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single();

        setState(prev => ({
          ...prev,
          credits: credits?.balance || 0,
          subscriptionTier: profile?.subscription_tier || 'free',
        }));
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false,
        }));

        if (session?.user) {
          const { data: credits } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', session.user.id)
            .single();
          
          setState(prev => ({
            ...prev,
            credits: credits?.balance || 0,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // OAuth sign in
  const signIn = async (provider: 'google' | 'github' | 'apple' | 'azure' | 'discord') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    
    if (error) throw error;
  };

  // Email/password sign in
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Magic link sign in
  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      loading: false,
      credits: 0,
      subscriptionTier: 'free',
    });
  };

  return {
    ...state,
    signIn,
    signInWithEmail,
    signInWithMagicLink,
    signOut,
    refreshCredits,
  };
}
