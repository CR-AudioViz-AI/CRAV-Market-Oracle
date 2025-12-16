// ============================================================================
// MARKET ORACLE - CENTRALIZED SUPABASE CLIENT
// Connects to CR AudioViz AI central database
// CLIENT-SIDE ONLY - includes all data fetching functions
// Created: December 15, 2025
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// CENTRALIZED Supabase - same as main website
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser client (client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create browser client for client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Types
export type Category = 'regular' | 'penny' | 'crypto' | 'all';
export type Direction = 'UP' | 'DOWN' | 'HOLD';
export type PickStatus = 'active' | 'won' | 'lost' | 'expired';

export interface StockPick {
  id: string;
  user_id?: string;
  symbol: string;
  company_name: string;
  sector: string;
  category: Category;
  ai_model: string;
  direction: Direction;
  confidence: number;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  current_price?: number;
  price_change?: number;
  thesis: string;
  full_reasoning: string;
  factor_assessments?: any[];
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  status: PickStatus;
  actual_return?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  gradient: string;
  total_picks: number;
  win_rate: number;
  avg_return: number;
  created_at: string;
}

// Get AI models
export async function getAIModels(): Promise<AIModel[]> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching AI models:', error);
    return [];
  }
  return data || [];
}

// Get picks with optional filters
export async function getPicks(filters?: {
  symbol?: string;
  aiModel?: string;
  direction?: Direction;
  category?: Category;
  status?: PickStatus;
  limit?: number;
  offset?: number;
}): Promise<StockPick[]> {
  let query = supabase
    .from('ai_picks')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.symbol) {
    query = query.eq('symbol', filters.symbol.toUpperCase());
  }
  if (filters?.aiModel) {
    query = query.eq('ai_model', filters.aiModel);
  }
  if (filters?.direction) {
    query = query.eq('direction', filters.direction);
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching picks:', error);
    return [];
  }
  return data || [];
}

// Get all stock picks
export async function getAllStockPicks(): Promise<StockPick[]> {
  const { data, error } = await supabase
    .from('ai_picks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all picks:', error);
    return [];
  }
  return data || [];
}

// Get hot picks (high confidence, bullish)
export async function getHotPicks(category?: Category): Promise<any[]> {
  let query = supabase
    .from('ai_picks')
    .select('*')
    .eq('direction', 'UP')
    .gte('confidence', 70)
    .eq('status', 'active')
    .order('confidence', { ascending: false })
    .limit(10);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hot picks:', error);
    return [];
  }
  return data || [];
}

// Get AI statistics
export async function getAIStatistics(category?: Category): Promise<any[]> {
  // For now, return aggregated data from picks
  const picks = await getAllStockPicks();
  
  const aiStats: Record<string, { 
    name: string; 
    total: number; 
    wins: number; 
    totalReturn: number;
    avgConfidence: number;
  }> = {};

  for (const pick of picks) {
    if (!aiStats[pick.ai_model]) {
      aiStats[pick.ai_model] = { 
        name: pick.ai_model, 
        total: 0, 
        wins: 0, 
        totalReturn: 0,
        avgConfidence: 0
      };
    }
    aiStats[pick.ai_model].total++;
    aiStats[pick.ai_model].avgConfidence += pick.confidence;
    if (pick.status === 'won') {
      aiStats[pick.ai_model].wins++;
    }
    if (pick.actual_return) {
      aiStats[pick.ai_model].totalReturn += pick.actual_return;
    }
  }

  return Object.values(aiStats).map(stat => ({
    name: stat.name,
    display_name: stat.name.toUpperCase(),
    total_picks: stat.total,
    win_rate: stat.total > 0 ? (stat.wins / stat.total) * 100 : 0,
    avg_return: stat.total > 0 ? stat.totalReturn / stat.total : 0,
    avg_confidence: stat.total > 0 ? stat.avgConfidence / stat.total : 0,
  }));
}

// Get overall stats
export async function getOverallStats(): Promise<{
  totalPicks: number;
  activePicks: number;
  avgWinRate: number;
  avgReturn: number;
}> {
  const picks = await getAllStockPicks();
  const activePicks = picks.filter(p => p.status === 'active');
  const closedPicks = picks.filter(p => p.status === 'won' || p.status === 'lost');
  const wins = picks.filter(p => p.status === 'won');

  return {
    totalPicks: picks.length,
    activePicks: activePicks.length,
    avgWinRate: closedPicks.length > 0 ? (wins.length / closedPicks.length) * 100 : 0,
    avgReturn: closedPicks.length > 0 
      ? closedPicks.reduce((sum, p) => sum + (p.actual_return || 0), 0) / closedPicks.length 
      : 0,
  };
}

// Get category stats
export async function getCategoryStats(): Promise<Record<string, { total: number; active: number; avgChange: number }>> {
  const picks = await getAllStockPicks();
  
  const stats: Record<string, { total: number; active: number; avgChange: number }> = {
    regular: { total: 0, active: 0, avgChange: 0 },
    penny: { total: 0, active: 0, avgChange: 0 },
    crypto: { total: 0, active: 0, avgChange: 0 },
  };

  for (const pick of picks) {
    const cat = pick.category || 'regular';
    if (stats[cat]) {
      stats[cat].total++;
      if (pick.status === 'active') stats[cat].active++;
      if (pick.price_change) stats[cat].avgChange += pick.price_change;
    }
  }

  for (const cat of Object.keys(stats)) {
    if (stats[cat].total > 0) {
      stats[cat].avgChange = stats[cat].avgChange / stats[cat].total;
    }
  }

  return stats;
}

// Get recent winners
export async function getRecentWinners(limit: number = 5): Promise<StockPick[]> {
  const { data, error } = await supabase
    .from('ai_picks')
    .select('*')
    .eq('status', 'won')
    .order('closed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent winners:', error);
    return [];
  }
  return data || [];
}

// Aliases for backward compatibility
export const getStockPicks = getPicks;
export const getStockPicksByAI = (aiName: string) => getPicks({ aiModel: aiName, limit: 100 });
export const getPicksByCategory = (category: Category) => getPicks({ category, limit: 200 });
export const getLeaderboard = getAIStatistics;
