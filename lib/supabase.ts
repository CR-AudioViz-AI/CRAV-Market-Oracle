// ============================================================================
// MARKET ORACLE - CENTRALIZED SUPABASE CLIENT
// Connects to CR AudioViz AI central database
// All users, credits, payments in ONE place
// Created: December 15, 2025
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// CENTRALIZED Supabase - same as main website
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (server-side with service role)
export const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Create browser client for client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Create server client for server components
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Types for centralized user
export interface CentralUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits_balance: number;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  created_at: string;
}

// Get current user with credits
export async function getCurrentUser(): Promise<CentralUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return null;
  
  // Get user profile with credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, user_credits(balance)')
    .eq('id', user.id)
    .single();
  
  return profile ? {
    id: user.id,
    email: user.email!,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    credits_balance: profile.user_credits?.[0]?.balance || 0,
    subscription_tier: profile.subscription_tier || 'free',
    created_at: user.created_at,
  } : null;
}
