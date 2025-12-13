-- Market Oracle Ultimate - Learning System Database Schema
-- Created: December 13, 2025
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PICKS TABLE (Enhanced with full reasoning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model TEXT NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  
  -- The pick
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timeframe TEXT DEFAULT '1W',
  
  -- Prices
  entry_price DECIMAL(12,4) NOT NULL,
  target_price DECIMAL(12,4) NOT NULL,
  stop_loss DECIMAL(12,4) NOT NULL,
  
  -- Reasoning (THIS IS KEY FOR LEARNING)
  thesis TEXT,
  full_reasoning TEXT,
  factor_assessments JSONB DEFAULT '[]'::jsonb,
  key_bullish_factors TEXT[] DEFAULT '{}',
  key_bearish_factors TEXT[] DEFAULT '{}',
  risks TEXT[] DEFAULT '{}',
  catalysts TEXT[] DEFAULT '{}',
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Outcome tracking
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS', 'EXPIRED')),
  closed_at TIMESTAMPTZ,
  closed_price DECIMAL(12,4),
  actual_return DECIMAL(8,4),
  hit_target BOOLEAN,
  hit_stop_loss BOOLEAN,
  days_held INTEGER
);

-- Indexes for picks
CREATE INDEX IF NOT EXISTS idx_picks_ai_model ON market_oracle_picks(ai_model);
CREATE INDEX IF NOT EXISTS idx_picks_symbol ON market_oracle_picks(symbol);
CREATE INDEX IF NOT EXISTS idx_picks_status ON market_oracle_picks(status);
CREATE INDEX IF NOT EXISTS idx_picks_created_at ON market_oracle_picks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_picks_sector ON market_oracle_picks(sector);

-- ============================================================================
-- FACTOR OUTCOMES TABLE (Tracks how each factor performs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_factor_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id UUID REFERENCES market_oracle_picks(id),
  factor_id TEXT NOT NULL,
  factor_name TEXT NOT NULL,
  interpretation TEXT CHECK (interpretation IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  confidence INTEGER,
  outcome TEXT CHECK (outcome IN ('WIN', 'LOSS', 'EXPIRED')),
  actual_return DECIMAL(8,4),
  ai_model TEXT NOT NULL,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for factor outcomes
CREATE INDEX IF NOT EXISTS idx_factor_outcomes_factor_id ON market_oracle_factor_outcomes(factor_id);
CREATE INDEX IF NOT EXISTS idx_factor_outcomes_ai_model ON market_oracle_factor_outcomes(ai_model);
CREATE INDEX IF NOT EXISTS idx_factor_outcomes_outcome ON market_oracle_factor_outcomes(outcome);

-- ============================================================================
-- CALIBRATIONS TABLE (Weekly AI calibration results)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_calibrations (
  id TEXT PRIMARY KEY,
  ai_model TEXT NOT NULL,
  calibration_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance metrics
  total_picks INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,4),
  avg_return DECIMAL(8,4),
  avg_confidence DECIMAL(5,2),
  
  -- Calibration metrics
  confidence_accuracy_correlation DECIMAL(5,4),
  overconfidence_score DECIMAL(6,2),
  
  -- Factor performance
  factor_performance JSONB DEFAULT '{}'::jsonb,
  
  -- Sector analysis
  best_sectors TEXT[] DEFAULT '{}',
  worst_sectors TEXT[] DEFAULT '{}',
  best_market_conditions TEXT[] DEFAULT '{}',
  worst_market_conditions TEXT[] DEFAULT '{}',
  
  -- Learnings
  key_learnings TEXT[] DEFAULT '{}',
  adjustments TEXT[] DEFAULT '{}'
);

-- Index for calibrations
CREATE INDEX IF NOT EXISTS idx_calibrations_ai_model ON market_oracle_calibrations(ai_model);
CREATE INDEX IF NOT EXISTS idx_calibrations_date ON market_oracle_calibrations(calibration_date DESC);

-- ============================================================================
-- CONSENSUS PICKS TABLE (Javari's consensus decisions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_consensus_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
  ai_combination TEXT[] NOT NULL,
  ai_combination_key TEXT NOT NULL,
  consensus_strength DECIMAL(5,4),
  weighted_confidence DECIMAL(5,2),
  javari_confidence DECIMAL(5,2),
  javari_reasoning TEXT,
  
  -- Outcome
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS', 'EXPIRED')),
  actual_return DECIMAL(8,4),
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consensus picks
CREATE INDEX IF NOT EXISTS idx_consensus_picks_symbol ON market_oracle_consensus_picks(symbol);
CREATE INDEX IF NOT EXISTS idx_consensus_picks_key ON market_oracle_consensus_picks(ai_combination_key);
CREATE INDEX IF NOT EXISTS idx_consensus_picks_status ON market_oracle_consensus_picks(status);

-- ============================================================================
-- CONSENSUS STATS TABLE (Historical performance of AI combinations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_consensus_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_combination TEXT[] NOT NULL,
  ai_combination_key TEXT UNIQUE NOT NULL,
  
  -- Performance
  times_agreed INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,4) DEFAULT 0.5,
  avg_return DECIMAL(8,4) DEFAULT 0,
  total_return DECIMAL(10,4) DEFAULT 0,
  
  -- By context
  accuracy_by_sector JSONB DEFAULT '{}'::jsonb,
  best_sector TEXT,
  worst_sector TEXT,
  
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index for consensus stats
CREATE INDEX IF NOT EXISTS idx_consensus_stats_key ON market_oracle_consensus_stats(ai_combination_key);
CREATE INDEX IF NOT EXISTS idx_consensus_stats_accuracy ON market_oracle_consensus_stats(accuracy_rate DESC);

-- ============================================================================
-- LEARNING QUEUE TABLE (Background learning tasks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_learning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  target_ai TEXT,
  target_pick UUID,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Unique constraint for deduplication
  UNIQUE(task_type, target_ai)
);

-- Index for learning queue
CREATE INDEX IF NOT EXISTS idx_learning_queue_status ON market_oracle_learning_queue(status);
CREATE INDEX IF NOT EXISTS idx_learning_queue_priority ON market_oracle_learning_queue(priority DESC);

-- ============================================================================
-- AI MODELS TABLE (Track AI model configurations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_ai_models (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  strengths TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  
  -- Current stats (updated regularly)
  current_win_rate DECIMAL(5,4),
  total_picks INTEGER DEFAULT 0,
  last_pick_at TIMESTAMPTZ,
  last_calibration_at TIMESTAMPTZ,
  
  -- Configuration
  confidence_adjustment DECIMAL(5,2) DEFAULT 0,
  priority_sectors TEXT[] DEFAULT '{}',
  avoid_sectors TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI models
INSERT INTO market_oracle_ai_models (id, display_name, description, strengths) VALUES
  ('gpt4', 'GPT-4 Turbo', 'OpenAI flagship model - strong reasoning and analysis', ARRAY['Technical analysis', 'Pattern recognition', 'Risk assessment']),
  ('claude', 'Claude Sonnet', 'Anthropic model - nuanced analysis and safety focus', ARRAY['Fundamental analysis', 'Risk warnings', 'Long-term outlook']),
  ('gemini', 'Gemini Pro', 'Google model - broad knowledge and multimodal', ARRAY['News synthesis', 'Sector analysis', 'Market trends']),
  ('perplexity', 'Perplexity Sonar', 'Real-time search integrated - current events focus', ARRAY['Breaking news', 'Real-time data', 'Event-driven picks']),
  ('javari', 'Javari AI', 'Meta-learner - synthesizes all AI picks and learns which to trust', ARRAY['Consensus building', 'AI arbitration', 'Adaptive weighting'])
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  strengths = EXCLUDED.strengths;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE market_oracle_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_factor_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_consensus_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_consensus_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_learning_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_ai_models ENABLE ROW LEVEL SECURITY;

-- Public read access for picks and stats
CREATE POLICY "Public read picks" ON market_oracle_picks FOR SELECT USING (true);
CREATE POLICY "Public read factor_outcomes" ON market_oracle_factor_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read calibrations" ON market_oracle_calibrations FOR SELECT USING (true);
CREATE POLICY "Public read consensus_picks" ON market_oracle_consensus_picks FOR SELECT USING (true);
CREATE POLICY "Public read consensus_stats" ON market_oracle_consensus_stats FOR SELECT USING (true);
CREATE POLICY "Public read ai_models" ON market_oracle_ai_models FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access picks" ON market_oracle_picks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access factor_outcomes" ON market_oracle_factor_outcomes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access calibrations" ON market_oracle_calibrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access consensus_picks" ON market_oracle_consensus_picks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access consensus_stats" ON market_oracle_consensus_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access learning_queue" ON market_oracle_learning_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ai_models" ON market_oracle_ai_models FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate win rate
CREATE OR REPLACE FUNCTION calculate_ai_win_rate(p_ai_model TEXT)
RETURNS DECIMAL AS $$
DECLARE
  v_wins INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'WIN'),
    COUNT(*) FILTER (WHERE status IN ('WIN', 'LOSS'))
  INTO v_wins, v_total
  FROM market_oracle_picks
  WHERE ai_model = p_ai_model
  AND created_at > NOW() - INTERVAL '30 days';
  
  IF v_total = 0 THEN
    RETURN 0.5;
  END IF;
  
  RETURN v_wins::DECIMAL / v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get AI leaderboard
CREATE OR REPLACE FUNCTION get_ai_leaderboard()
RETURNS TABLE (
  ai_model TEXT,
  display_name TEXT,
  total_picks BIGINT,
  wins BIGINT,
  losses BIGINT,
  win_rate DECIMAL,
  avg_return DECIMAL,
  avg_confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.ai_model,
    COALESCE(m.display_name, p.ai_model) as display_name,
    COUNT(*) as total_picks,
    COUNT(*) FILTER (WHERE p.status = 'WIN') as wins,
    COUNT(*) FILTER (WHERE p.status = 'LOSS') as losses,
    CASE 
      WHEN COUNT(*) FILTER (WHERE p.status IN ('WIN', 'LOSS')) > 0 
      THEN COUNT(*) FILTER (WHERE p.status = 'WIN')::DECIMAL / COUNT(*) FILTER (WHERE p.status IN ('WIN', 'LOSS'))
      ELSE 0.5
    END as win_rate,
    AVG(p.actual_return) FILTER (WHERE p.actual_return IS NOT NULL) as avg_return,
    AVG(p.confidence) as avg_confidence
  FROM market_oracle_picks p
  LEFT JOIN market_oracle_ai_models m ON p.ai_model = m.id
  WHERE p.created_at > NOW() - INTERVAL '30 days'
  GROUP BY p.ai_model, m.display_name
  ORDER BY win_rate DESC, total_picks DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update AI model stats on pick insert
CREATE OR REPLACE FUNCTION update_ai_model_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE market_oracle_ai_models
  SET 
    total_picks = (SELECT COUNT(*) FROM market_oracle_picks WHERE ai_model = NEW.ai_model),
    last_pick_at = NEW.created_at,
    current_win_rate = calculate_ai_win_rate(NEW.ai_model),
    updated_at = NOW()
  WHERE id = NEW.ai_model;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_stats
AFTER INSERT OR UPDATE ON market_oracle_picks
FOR EACH ROW
EXECUTE FUNCTION update_ai_model_stats();

-- ============================================================================
-- DONE!
-- ============================================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name LIKE 'market_oracle_%'
ORDER BY table_name;
