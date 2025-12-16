'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type OAuthProvider = 'google' | 'github' | 'apple' | 'azure' | 'discord';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  credits: number;
  loading: boolean;
  signIn: (provider: OAuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  credits: 0,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => {},
  refreshCredits: async () => {},
});

// Export both names for compatibility
export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createSupabaseBrowserClient();

  const fetchCredits = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setCredits(data.balance);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const refreshCredits = async () => {
    if (user) {
      await fetchCredits(user.id);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchCredits(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchCredits(session.user.id);
        } else {
          setCredits(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCredits(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      credits, 
      loading, 
      signIn,
      signInWithEmail,
      signInWithMagicLink,
      signOut, 
      refreshCredits 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
