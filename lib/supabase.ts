// lib/supabase.ts - Market Oracle V4
// Fixed version with reliable data fetching and AI model joining
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
  company_name: string;
  category: Category;
  asset_type: string;
  direction: Direction;
  confidence: number;
  confidence_score: number;
  entry_price: number;
  current_price: number | null;
  target_price: number;
  stop_loss: number;
  price_change_percent: number | null;
  price_change_dollars: number | null;
  reasoning: string;
  reasoning_summary: string;
  key_factors: string[];
  risk_factors: string[];
  status: PickStatus;
  result: string | null;
  profit_loss_percent: number | null;
  profit_loss_dollars: number | null;
  points_earned: number;
  week_number: number;
  pick_date: string;
  expiry_date: string;
  closed_at: string | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  ai_name?: string;
  ai_display_name?: string;
  ai_color?: string;
}

export interface AIModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  color: string;
  is_active: boolean;
  specialty?: string;
  tagline?: string;
  avatar_url?: string;
}

// Cache AI models to avoid repeated fetches
let aiModelsCache: AIModel[] | null = null;
let aiModelsCacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

// ============================================
// CORE FETCH FUNCTIONS
// ============================================

/**
 * Get all AI models (cached)
 */
export async function getAIModels(): Promise<AIModel[]> {
  const now = Date.now();
  if (aiModelsCache && (now - aiModelsCacheTime) < CACHE_TTL) {
    return aiModelsCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) throw error;
    aiModelsCache = data || [];
    aiModelsCacheTime = now;
    return aiModelsCache;
  } catch (e) {
    console.error('getAIModels error:', e);
    return [];
  }
}

/**
 * Get all picks with AI model info joined client-side
 */
export async function getPicks(filters?: {
  category?: Category;
  aiModelId?: string;
  status?: PickStatus;
  ticker?: string;
  limit?: number;
}): Promise<StockPick[]> {
  try {
    // Fetch picks and AI models separately
    const [aiModels, picksResult] = await Promise.all([
      getAIModels(),
      (async () => {
        let query = supabase
          .from('stock_picks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters?.aiModelId) {
          query = query.eq('ai_model_id', filters.aiModelId);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.ticker) {
          query = query.eq('ticker', filters.ticker.toUpperCase());
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        
        return query;
      })()
    ]);
    
    const { data: picks, error } = picksResult;
    if (error) throw error;
    
    // Create AI model lookup map
    const aiMap = new Map<string, AIModel>();
    aiModels.forEach(ai => aiMap.set(ai.id, ai));
    
    // Join AI info to picks
    return (picks || []).map(pick => {
      const ai = aiMap.get(pick.ai_model_id);
      return {
        ...pick,
        symbol: pick.ticker,
        confidence_score: pick.confidence,
        ai_name: ai?.name || 'Unknown',
        ai_display_name: ai?.display_name || 'Unknown AI',
        ai_color: ai?.color || '#6366f1',
      };
    });
  } catch (e) {
    console.error('getPicks error:', e);
    return [];
  }
}

/**
 * Get all picks (no filters)
 */
export async function getAllStockPicks(): Promise<StockPick[]> {
  return getPicks({ limit: 500 });
}

/**
 * Get hot/consensus picks (stocks picked by 2+ AIs)
 */
export async function getHotPicks(category?: Category): Promise<any[]> {
  try {
    const picks = await getPicks({ category, limit: 500 });
    
    // Group by ticker
    const tickerMap = new Map<string, StockPick[]>();
    picks.forEach(pick => {
      if (!tickerMap.has(pick.ticker)) {
        tickerMap.set(pick.ticker, []);
      }
      tickerMap.get(pick.ticker)!.push(pick);
    });
    
    // Filter to tickers with 2+ picks and format
    return Array.from(tickerMap.entries())
      .filter(([_, p]) => p.length >= 2)
      .map(([ticker, picks]) => ({
        ticker,
        symbol: ticker,
        company_name: picks[0].company_name,
        category: picks[0].category,
        consensus: picks.length,
        aiNames: picks.map(p => p.ai_display_name),
        aiColors: picks.map(p => p.ai_color),
        avgConfidence: Math.round(picks.reduce((s, p) => s + p.confidence, 0) / picks.length),
        avgEntryPrice: picks.reduce((s, p) => s + p.entry_price, 0) / picks.length,
        avgTargetPrice: picks.reduce((s, p) => s + p.target_price, 0) / picks.length,
        currentPrice: picks[0].current_price,
        direction: picks.filter(p => p.direction === 'UP').length > picks.length / 2 ? 'UP' : 'DOWN',
        picks,
      }))
      .sort((a, b) => b.consensus - a.consensus);
  } catch (e) {
    console.error('getHotPicks error:', e);
    return [];
  }
}

/**
 * Get AI statistics for leaderboard
 */
export async function getAIStatistics(category?: Category): Promise<any[]> {
  try {
    const [aiModels, picks] = await Promise.all([
      getAIModels(),
      getPicks({ category, limit: 1000 })
    ]);
    
    return aiModels.map(ai => {
      const aiPicks = picks.filter(p => p.ai_model_id === ai.id);
      const wins = aiPicks.filter(p => p.status === 'won').length;
      const losses = aiPicks.filter(p => p.status === 'lost').length;
      const active = aiPicks.filter(p => p.status === 'active').length;
      const closed = wins + losses;
      
      // Calculate total P/L
      const totalPL = aiPicks.reduce((sum, p) => {
        if (p.current_price && p.entry_price) {
          return sum + ((p.current_price - p.entry_price) / p.entry_price) * 100;
        }
        return sum;
      }, 0);
      
      return {
        id: ai.id,
        name: ai.name,
        displayName: ai.display_name,
        color: ai.color,
        specialty: ai.specialty,
        tagline: ai.tagline,
        totalPicks: aiPicks.length,
        activePicks: active,
        closedPicks: closed,
        wins,
        losses,
        winRate: closed > 0 ? Math.round((wins / closed) * 100) : 0,
        avgConfidence: aiPicks.length > 0 
          ? Math.round(aiPicks.reduce((s, p) => s + p.confidence, 0) / aiPicks.length) 
          : 0,
        totalProfitLossPercent: Math.round(totalPL * 10) / 10,
        points: aiPicks.reduce((s, p) => s + (p.points_earned || 0), 0),
      };
    }).sort((a, b) => b.totalProfitLossPercent - a.totalProfitLossPercent);
  } catch (e) {
    console.error('getAIStatistics error:', e);
    return [];
  }
}

/**
 * Get overall statistics
 */
export async function getOverallStats(): Promise<{
  totalPicks: number;
  activePicks: number;
  winners: number;
  losers: number;
  winRate: number;
  totalPL: number;
  avgConfidence: number;
}> {
  try {
    const picks = await getPicks({ limit: 1000 });
    
    const active = picks.filter(p => p.status === 'active').length;
    const winners = picks.filter(p => p.status === 'won').length;
    const losers = picks.filter(p => p.status === 'lost').length;
    const closed = winners + losers;
    
    // Calculate total P/L from all picks with prices
    let totalPL = 0;
    let picksWithPrices = 0;
    picks.forEach(p => {
      if (p.current_price && p.entry_price) {
        totalPL += p.current_price - p.entry_price;
        picksWithPrices++;
      }
    });
    
    const avgConfidence = picks.length > 0
      ? Math.round(picks.reduce((s, p) => s + p.confidence, 0) / picks.length)
      : 0;
    
    return {
      totalPicks: picks.length,
      activePicks: active,
      winners,
      losers,
      winRate: closed > 0 ? Math.round((winners / closed) * 100) : 0,
      totalPL: Math.round(totalPL * 100) / 100,
      avgConfidence,
    };
  } catch (e) {
    console.error('getOverallStats error:', e);
    return {
      totalPicks: 0,
      activePicks: 0,
      winners: 0,
      losers: 0,
      winRate: 0,
      totalPL: 0,
      avgConfidence: 0,
    };
  }
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<Record<string, { total: number; active: number; avgChange: number }>> {
  try {
    const picks = await getPicks({ limit: 1000 });
    
    const stats: Record<string, { total: number; active: number; avgChange: number; totalChange: number }> = {
      regular: { total: 0, active: 0, avgChange: 0, totalChange: 0 },
      penny: { total: 0, active: 0, avgChange: 0, totalChange: 0 },
      crypto: { total: 0, active: 0, avgChange: 0, totalChange: 0 },
    };
    
    picks.forEach(p => {
      if (stats[p.category]) {
        stats[p.category].total++;
        if (p.status === 'active') stats[p.category].active++;
        if (p.price_change_percent) {
          stats[p.category].totalChange += p.price_change_percent;
        }
      }
    });
    
    // Calculate averages
    Object.keys(stats).forEach(cat => {
      if (stats[cat].total > 0) {
        stats[cat].avgChange = Math.round((stats[cat].totalChange / stats[cat].total) * 10) / 10;
      }
    });
    
    return stats;
  } catch (e) {
    console.error('getCategoryStats error:', e);
    return {};
  }
}

/**
 * Get recent winners
 */
export async function getRecentWinners(limit: number = 5): Promise<StockPick[]> {
  try {
    const picks = await getPicks({ limit: 100 });
    
    // Find picks where current price > entry price (winners)
    return picks
      .filter(p => p.current_price && p.entry_price && p.current_price > p.entry_price)
      .sort((a, b) => {
        const aGain = ((a.current_price! - a.entry_price) / a.entry_price) * 100;
        const bGain = ((b.current_price! - b.entry_price) / b.entry_price) * 100;
        return bGain - aGain;
      })
      .slice(0, limit);
  } catch (e) {
    console.error('getRecentWinners error:', e);
    return [];
  }
}

// Export legacy functions for backward compatibility
export const getStockPicks = getPicks;
export const getStockPicksByAI = (aiName: string) => getPicks({ limit: 100 });
export const getPicksByCategory = (category: Category) => getPicks({ category, limit: 200 });
export const getLeaderboard = getAIStatistics;
