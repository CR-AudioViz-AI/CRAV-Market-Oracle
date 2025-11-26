// lib/supabase.ts - Market Oracle V3 with Live Price Tracking
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type Category = 'regular' | 'penny' | 'crypto' | 'all';
export type Direction = 'UP' | 'DOWN' | 'HOLD';
export type PickStatus = 'active' | 'won' | 'lost' | 'expired';

export interface StockPick {
  id: string;
  competition_id: string;
  ai_model_id: string;
  ticker: string;
  symbol: string;
  category: Category;
  direction: Direction;
  confidence: number;
  confidence_score: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  current_price: number | null;
  price_change: number | null;
  price_change_percent: number | null;
  last_price_update: string | null;
  status: PickStatus;
  result: string | null;
  profit_loss: number | null;
  points_earned: number | null;
  week_number: number;
  pick_date: string;
  expiry_date: string;
  created_at: string;
  ai_name?: string;
  ai_color?: string;
}

export interface AIModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  color: string;
  is_active: boolean;
  total_picks: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  specialty?: string;
  tagline?: string;
}

export interface WeeklyStanding {
  id: string;
  week_number: number;
  ai_model_id: string;
  ai_name: string;
  category: Category;
  total_picks: number;
  winning_picks: number;
  losing_picks: number;
  win_rate: number;
  total_profit_loss: number;
  rank_position: number;
  points_earned: number;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

// Get all picks with filters
export async function getPicks(filters?: {
  category?: Category;
  aiName?: string;
  status?: PickStatus;
  ticker?: string;
  weekNumber?: number;
  limit?: number;
}): Promise<StockPick[]> {
  try {
    let query = supabase
      .from('stock_picks')
      .select(`*, ai_models (name, display_name, color)`)
      .order('created_at', { ascending: false });
    
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.ticker) {
      query = query.eq('ticker', filters.ticker.toUpperCase());
    }
    if (filters?.weekNumber) {
      query = query.eq('week_number', filters.weekNumber);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    let result = (data || []).map(mapPick);
    
    if (filters?.aiName) {
      result = result.filter(p => p.ai_name?.toLowerCase().includes(filters.aiName!.toLowerCase()));
    }
    
    return result;
  } catch (e) {
    console.error('getPicks error:', e);
    return [];
  }
}

// Get all AI models
export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getAIModels error:', e);
    return [];
  }
}

// Get AI statistics (computed from picks) - accepts optional category
export async function getAIStatistics(category?: Category): Promise<any[]> {
  try {
    const picks = await getPicks({ category: category === 'all' ? undefined : category, limit: 500 });
    const stats: Record<string, { name: string; wins: number; losses: number; total: number; winRate: number; avgProfit: number; profitSum: number; color: string }> = {};
    
    picks.forEach(pick => {
      const aiName = pick.ai_name || 'Unknown';
      if (!stats[aiName]) {
        stats[aiName] = { name: aiName, wins: 0, losses: 0, total: 0, winRate: 0, avgProfit: 0, profitSum: 0, color: pick.ai_color || '#6366f1' };
      }
      stats[aiName].total++;
      if (pick.status === 'won') stats[aiName].wins++;
      if (pick.status === 'lost') stats[aiName].losses++;
      if (pick.price_change_percent) stats[aiName].profitSum += pick.price_change_percent;
    });
    
    return Object.values(stats).map(s => ({
      ...s,
      winRate: (s.wins + s.losses) > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0,
      avgProfit: s.total > 0 ? s.profitSum / s.total : 0,
    }));
  } catch (e) {
    console.error('getAIStatistics error:', e);
    return [];
  }
}

// Get hot picks (highest positive change) - accepts optional category
export async function getHotPicks(category?: Category): Promise<StockPick[]> {
  try {
    let query = supabase
      .from('stock_picks')
      .select(`*, ai_models (name, display_name, color)`)
      .eq('status', 'active')
      .not('current_price', 'is', null)
      .order('price_change_pct', { ascending: false })
      .limit(5);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapPick);
  } catch (e) {
    console.error('getHotPicks error:', e);
    return [];
  }
}

// Get leaderboard
export async function getLeaderboard(category?: Category): Promise<any[]> {
  try {
    const picks = await getPicks({ category: category === 'all' ? undefined : category, limit: 500 });
    
    const aiStats: Record<string, {
      name: string;
      color: string;
      wins: number;
      losses: number;
      total: number;
      points: number;
      avgChange: number;
      changeSum: number;
    }> = {};
    
    picks.forEach(pick => {
      const aiName = pick.ai_name || 'Unknown';
      if (!aiStats[aiName]) {
        aiStats[aiName] = { name: aiName, color: pick.ai_color || '#6366f1', wins: 0, losses: 0, total: 0, points: 0, avgChange: 0, changeSum: 0 };
      }
      aiStats[aiName].total++;
      if (pick.status === 'won') { aiStats[aiName].wins++; aiStats[aiName].points += 10; }
      if (pick.status === 'lost') { aiStats[aiName].losses++; aiStats[aiName].points -= 5; }
      if (pick.price_change_percent) aiStats[aiName].changeSum += pick.price_change_percent;
    });
    
    return Object.values(aiStats)
      .map(s => ({ ...s, avgChange: s.total > 0 ? s.changeSum / s.total : 0, winRate: (s.wins + s.losses) > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0 }))
      .sort((a, b) => b.points - a.points);
  } catch (e) {
    console.error('getLeaderboard error:', e);
    return [];
  }
}

// Get price update stats
export async function getPriceStats(): Promise<{ total: number; withPrice: number; lastUpdate: string | null }> {
  try {
    const { data, error } = await supabase
      .from('stock_picks')
      .select('current_price, last_price_update')
      .eq('status', 'active');
    
    if (error) throw error;
    
    const total = data?.length || 0;
    const withPrice = data?.filter(p => p.current_price !== null).length || 0;
    const updates = data?.filter(p => p.last_price_update).map(p => p.last_price_update) || [];
    const lastUpdate = updates.length > 0 ? updates.sort().reverse()[0] : null;
    
    return { total, withPrice, lastUpdate };
  } catch (e) {
    console.error('getPriceStats error:', e);
    return { total: 0, withPrice: 0, lastUpdate: null };
  }
}

// Category stats
export async function getCategoryStats(): Promise<Record<Category, { total: number; winners: number; winRate: number }>> {
  const picks = await getPicks({ limit: 1000 });
  const stats: Record<string, { total: number; winners: number; winRate: number }> = {
    regular: { total: 0, winners: 0, winRate: 0 },
    penny: { total: 0, winners: 0, winRate: 0 },
    crypto: { total: 0, winners: 0, winRate: 0 },
  };
  
  picks.forEach(p => {
    if (stats[p.category]) {
      stats[p.category].total++;
      if (p.status === 'won') stats[p.category].winners++;
    }
  });
  
  Object.keys(stats).forEach(cat => {
    const s = stats[cat];
    const closed = picks.filter(p => p.category === cat && ['won', 'lost'].includes(p.status)).length;
    s.winRate = closed > 0 ? (s.winners / closed) * 100 : 0;
  });
  
  return stats as any;
}

// ============================================
// HELPERS
// ============================================

function mapPick(row: any): StockPick {
  return {
    ...row,
    symbol: row.ticker,
    confidence_score: row.confidence,
    price_change_percent: row.price_change_pct ?? row.price_change_percent ?? null,
    ai_name: row.ai_models?.display_name || row.ai_models?.name || 'Unknown',
    ai_color: row.ai_models?.color || '#6366f1',
  };
}
