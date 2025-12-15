// lib/learning/outcome-tracker.ts
// Market Oracle Ultimate - Outcome Tracking System
// Created: December 14, 2025
// Purpose: Track pick outcomes for AI learning and calibration

import { createClient } from '@supabase/supabase-js';
import type { AIModelName, PickDirection, PickOutcome } from '../types/learning';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PickRecord {
  id: string;
  ai_model: AIModelName;
  symbol: string;
  direction: PickDirection;
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  factor_assessments: Array<{
    factorId: string;
    factorName: string;
    interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
  }>;
  created_at: string;
  expires_at: string;
  sector: string;
}

interface PriceData {
  symbol: string;
  currentPrice: number;
  highSinceEntry: number;
  lowSinceEntry: number;
}

// Fetch current price from Alpha Vantage
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`
    );
    const data = await res.json();
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) return null;
    return parseFloat(quote['05. price']);
  } catch (err) {
    console.error(`Error fetching price for ${symbol}:`, err);
    return null;
  }
}

// Determine pick outcome based on price movement
function determineOutcome(
  pick: PickRecord,
  currentPrice: number
): { outcome: PickOutcome; hitTarget: boolean; hitStopLoss: boolean; actualReturn: number } {
  const entryPrice = parseFloat(String(pick.entry_price));
  const targetPrice = parseFloat(String(pick.target_price));
  const stopLoss = parseFloat(String(pick.stop_loss));
  
  const actualReturn = ((currentPrice - entryPrice) / entryPrice) * 100;
  
  let outcome: PickOutcome = 'EXPIRED';
  let hitTarget = false;
  let hitStopLoss = false;
  
  if (pick.direction === 'UP') {
    // For UP picks: WIN if price >= target, LOSS if price <= stop
    if (currentPrice >= targetPrice) {
      outcome = 'WIN';
      hitTarget = true;
    } else if (currentPrice <= stopLoss) {
      outcome = 'LOSS';
      hitStopLoss = true;
    } else if (currentPrice > entryPrice) {
      // Price moved up but didn't hit target - partial win
      outcome = actualReturn >= 2 ? 'WIN' : 'EXPIRED';
    } else {
      outcome = 'LOSS';
    }
  } else if (pick.direction === 'DOWN') {
    // For DOWN picks: WIN if price <= target, LOSS if price >= stop
    if (currentPrice <= targetPrice) {
      outcome = 'WIN';
      hitTarget = true;
    } else if (currentPrice >= stopLoss) {
      outcome = 'LOSS';
      hitStopLoss = true;
    } else if (currentPrice < entryPrice) {
      outcome = Math.abs(actualReturn) >= 2 ? 'WIN' : 'EXPIRED';
    } else {
      outcome = 'LOSS';
    }
  } else {
    // HOLD picks - check if staying flat was correct
    const priceChange = Math.abs(actualReturn);
    if (priceChange <= 3) {
      outcome = 'WIN'; // Price stayed relatively flat
    } else {
      outcome = 'LOSS'; // Missed a significant move
    }
  }
  
  return { outcome, hitTarget, hitStopLoss, actualReturn };
}

// Record factor outcomes for learning
async function recordFactorOutcomes(
  pick: PickRecord,
  outcome: PickOutcome
): Promise<void> {
  if (!pick.factor_assessments || pick.factor_assessments.length === 0) return;
  
  const factorRecords = pick.factor_assessments.map(factor => ({
    pick_id: pick.id,
    ai_model: pick.ai_model,
    factor_id: factor.factorId,
    factor_name: factor.factorName,
    factor_interpretation: factor.interpretation,
    factor_confidence: factor.confidence,
    pick_direction: pick.direction,
    pick_outcome: outcome,
    sector: pick.sector,
    symbol: pick.symbol,
    created_at: new Date().toISOString(),
  }));
  
  const { error } = await supabase
    .from('market_oracle_factor_outcomes')
    .insert(factorRecords);
  
  if (error) {
    console.error('Error recording factor outcomes:', error);
  }
}

// Update consensus stats for learning which AI combinations work
async function updateConsensusStats(
  pick: PickRecord,
  outcome: PickOutcome
): Promise<void> {
  // Find consensus records that include this pick
  const { data: consensusRecords } = await supabase
    .from('market_oracle_consensus_picks')
    .select('*')
    .eq('symbol', pick.symbol)
    .eq('status', 'PENDING')
    .gte('created_at', pick.created_at);
  
  if (!consensusRecords || consensusRecords.length === 0) return;
  
  for (const consensus of consensusRecords) {
    const aiCombinationKey = consensus.ai_combination_key;
    
    // Update or create stats for this AI combination
    const { data: existingStats } = await supabase
      .from('market_oracle_consensus_stats')
      .select('*')
      .eq('ai_combination_key', aiCombinationKey)
      .single();
    
    if (existingStats) {
      const newTimesAgreed = existingStats.times_agreed + 1;
      const newTimesCorrect = existingStats.times_correct + (outcome === 'WIN' ? 1 : 0);
      const newAccuracyRate = newTimesCorrect / newTimesAgreed;
      
      await supabase
        .from('market_oracle_consensus_stats')
        .update({
          times_agreed: newTimesAgreed,
          times_correct: newTimesCorrect,
          accuracy_rate: newAccuracyRate,
          last_updated: new Date().toISOString(),
        })
        .eq('ai_combination_key', aiCombinationKey);
    } else {
      await supabase
        .from('market_oracle_consensus_stats')
        .insert({
          ai_combination_key: aiCombinationKey,
          ai_models: consensus.ai_combination,
          times_agreed: 1,
          times_correct: outcome === 'WIN' ? 1 : 0,
          accuracy_rate: outcome === 'WIN' ? 1 : 0,
          avg_confidence_when_correct: outcome === 'WIN' ? consensus.weighted_confidence : 0,
          avg_confidence_when_wrong: outcome !== 'WIN' ? consensus.weighted_confidence : 0,
          last_updated: new Date().toISOString(),
        });
    }
    
    // Update consensus record status
    await supabase
      .from('market_oracle_consensus_picks')
      .update({ status: outcome })
      .eq('id', consensus.id);
  }
}

// Main function to process expired picks
export async function processExpiredPicks(): Promise<{
  processed: number;
  wins: number;
  losses: number;
  expired: number;
  errors: string[];
}> {
  const results = { processed: 0, wins: 0, losses: 0, expired: 0, errors: [] as string[] };
  
  try {
    // Get all pending picks that have expired
    const now = new Date().toISOString();
    const { data: expiredPicks, error: fetchError } = await supabase
      .from('market_oracle_picks')
      .select('*')
      .eq('status', 'PENDING')
      .lt('expires_at', now);
    
    if (fetchError) {
      results.errors.push(`Fetch error: ${fetchError.message}`);
      return results;
    }
    
    if (!expiredPicks || expiredPicks.length === 0) {
      return results;
    }
    
    // Group picks by symbol to minimize API calls
    const symbolGroups = new Map<string, PickRecord[]>();
    for (const pick of expiredPicks) {
      const existing = symbolGroups.get(pick.symbol) || [];
      existing.push(pick as PickRecord);
      symbolGroups.set(pick.symbol, existing);
    }
    
    // Process each symbol
    for (const [symbol, picks] of symbolGroups) {
      const currentPrice = await getCurrentPrice(symbol);
      
      if (!currentPrice) {
        results.errors.push(`Could not fetch price for ${symbol}`);
        continue;
      }
      
      for (const pick of picks) {
        try {
          const { outcome, hitTarget, hitStopLoss, actualReturn } = determineOutcome(pick, currentPrice);
          
          // Update pick record
          const { error: updateError } = await supabase
            .from('market_oracle_picks')
            .update({
              status: outcome,
              closed_at: new Date().toISOString(),
              closed_price: currentPrice,
              actual_return: actualReturn,
              hit_target: hitTarget,
              hit_stop_loss: hitStopLoss,
              days_held: Math.ceil(
                (new Date().getTime() - new Date(pick.created_at).getTime()) / (1000 * 60 * 60 * 24)
              ),
            })
            .eq('id', pick.id);
          
          if (updateError) {
            results.errors.push(`Update error for ${pick.id}: ${updateError.message}`);
            continue;
          }
          
          // Record factor outcomes
          await recordFactorOutcomes(pick, outcome);
          
          // Update consensus stats
          await updateConsensusStats(pick, outcome);
          
          results.processed++;
          if (outcome === 'WIN') results.wins++;
          else if (outcome === 'LOSS') results.losses++;
          else results.expired++;
          
        } catch (err) {
          results.errors.push(`Error processing pick ${pick.id}: ${String(err)}`);
        }
      }
      
      // Rate limit Alpha Vantage API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
    
  } catch (err) {
    results.errors.push(`Fatal error: ${String(err)}`);
    return results;
  }
}

// Get pending picks count and next expiration
export async function getPendingPicksStatus(): Promise<{
  pendingCount: number;
  nextExpiration: string | null;
  symbols: string[];
}> {
  const { data, error } = await supabase
    .from('market_oracle_picks')
    .select('symbol, expires_at')
    .eq('status', 'PENDING')
    .order('expires_at', { ascending: true });
  
  if (error || !data) {
    return { pendingCount: 0, nextExpiration: null, symbols: [] };
  }
  
  const symbols = [...new Set(data.map(p => p.symbol))];
  
  return {
    pendingCount: data.length,
    nextExpiration: data.length > 0 ? data[0].expires_at : null,
    symbols,
  };
}

// Force-resolve a pick for testing (simulates expiration)
export async function forceResolvePick(pickId: string): Promise<{
  success: boolean;
  outcome?: PickOutcome;
  error?: string;
}> {
  try {
    const { data: pick, error: fetchError } = await supabase
      .from('market_oracle_picks')
      .select('*')
      .eq('id', pickId)
      .single();
    
    if (fetchError || !pick) {
      return { success: false, error: 'Pick not found' };
    }
    
    const currentPrice = await getCurrentPrice(pick.symbol);
    if (!currentPrice) {
      return { success: false, error: 'Could not fetch current price' };
    }
    
    const { outcome, hitTarget, hitStopLoss, actualReturn } = determineOutcome(pick as PickRecord, currentPrice);
    
    await supabase
      .from('market_oracle_picks')
      .update({
        status: outcome,
        closed_at: new Date().toISOString(),
        closed_price: currentPrice,
        actual_return: actualReturn,
        hit_target: hitTarget,
        hit_stop_loss: hitStopLoss,
        days_held: Math.ceil(
          (new Date().getTime() - new Date(pick.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })
      .eq('id', pickId);
    
    await recordFactorOutcomes(pick as PickRecord, outcome);
    await updateConsensusStats(pick as PickRecord, outcome);
    
    return { success: true, outcome };
    
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
