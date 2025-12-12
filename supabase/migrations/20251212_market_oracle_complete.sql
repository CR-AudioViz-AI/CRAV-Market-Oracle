-- Market Oracle Complete Database Schema
-- Created: December 12, 2025 - CR AudioViz AI
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CHALLENGES TABLE (90-Day Challenge System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  prize_pool INTEGER DEFAULT 10000,
  participant_count INTEGER DEFAULT 0,
  winner_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CHALLENGE ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenge_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  starting_balance DECIMAL(12,2) NOT NULL DEFAULT 10000,
  current_balance DECIMAL(12,2) NOT NULL DEFAULT 10000,
  total_return_percent DECIMAL(8,4) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  current_day INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  milestones_achieved TEXT[] DEFAULT '{}',
  positions JSONB DEFAULT '[]',
  final_rank INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- ============================================================================
-- 3. CHALLENGE TRADES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenge_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  ticker TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  shares DECIMAL(12,4) NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  ai_model_id UUID REFERENCES ai_models(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. BATTLE HISTORY TABLE (Daily AI Battles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS battle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  total_picks INTEGER DEFAULT 0,
  winning_picks INTEGER DEFAULT 0,
  losing_picks INTEGER DEFAULT 0,
  best_performer_id UUID REFERENCES ai_models(id),
  best_performer_return DECIMAL(8,4),
  worst_performer_id UUID REFERENCES ai_models(id),
  worst_performer_return DECIMAL(8,4),
  market_summary JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. AI PERFORMANCE ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  total_picks INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  avg_return_percent DECIMAL(8,4) DEFAULT 0,
  best_pick_ticker TEXT,
  best_pick_return DECIMAL(8,4),
  worst_pick_ticker TEXT,
  worst_pick_return DECIMAL(8,4),
  sharpe_ratio DECIMAL(6,4),
  max_drawdown DECIMAL(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ai_model_id, period_start, period_end, period_type)
);

-- ============================================================================
-- 6. PRICE ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'percent_change', 'target_hit', 'stop_loss')),
  target_value DECIMAL(12,4) NOT NULL,
  current_value DECIMAL(12,4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired', 'cancelled')),
  notification_method TEXT DEFAULT 'in_app' CHECK (notification_method IN ('in_app', 'email', 'both')),
  triggered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. USER PORTFOLIOS TABLE (Paper Trading)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  portfolio_type TEXT NOT NULL DEFAULT 'paper' CHECK (portfolio_type IN ('paper', 'watchlist', 'real')),
  starting_balance DECIMAL(12,2) DEFAULT 10000,
  current_balance DECIMAL(12,2) DEFAULT 10000,
  total_value DECIMAL(12,2) DEFAULT 10000,
  total_return_percent DECIMAL(8,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PORTFOLIO POSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'stock',
  shares DECIMAL(12,4) NOT NULL,
  avg_cost_basis DECIMAL(12,4) NOT NULL,
  current_price DECIMAL(12,4),
  market_value DECIMAL(12,2),
  unrealized_gain DECIMAL(12,2),
  unrealized_gain_percent DECIMAL(8,4),
  ai_recommendation_id UUID REFERENCES stock_picks(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  UNIQUE(portfolio_id, ticker, status)
);

-- ============================================================================
-- 9. MARKET ORACLE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_oracle_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'elite')),
  features JSONB NOT NULL DEFAULT '{}',
  daily_picks_limit INTEGER DEFAULT 3,
  daily_picks_used INTEGER DEFAULT 0,
  ai_models_access TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Stock picks indexes
CREATE INDEX IF NOT EXISTS idx_stock_picks_ai_model ON stock_picks(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_stock_picks_status ON stock_picks(status);
CREATE INDEX IF NOT EXISTS idx_stock_picks_pick_date ON stock_picks(pick_date);
CREATE INDEX IF NOT EXISTS idx_stock_picks_ticker ON stock_picks(ticker);

-- Challenge indexes
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_user ON challenge_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_status ON challenge_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_return ON challenge_enrollments(total_return_percent DESC);

-- Battle history indexes
CREATE INDEX IF NOT EXISTS idx_battle_history_date ON battle_history(battle_date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_ai_performance_model ON ai_performance_analytics(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_period ON ai_performance_analytics(period_type, period_start);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_price_alerts_ticker ON price_alerts(ticker);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio ON portfolio_positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_ticker ON portfolio_positions(ticker);

-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_oracle_subscriptions ENABLE ROW LEVEL SECURITY;

-- Challenges - Public read, admin write
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- Challenge enrollments - User can see own, public leaderboard
CREATE POLICY "Users can view own enrollments" ON challenge_enrollments FOR SELECT 
  USING (auth.uid() = user_id OR status = 'completed');
CREATE POLICY "Users can create own enrollments" ON challenge_enrollments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON challenge_enrollments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Challenge trades - User can see/create own
CREATE POLICY "Users can view own trades" ON challenge_trades FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades" ON challenge_trades FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Battle history - Public read
CREATE POLICY "Battle history is public" ON battle_history FOR SELECT USING (true);

-- AI Performance - Public read
CREATE POLICY "AI performance is public" ON ai_performance_analytics FOR SELECT USING (true);

-- Price alerts - User owns
CREATE POLICY "Users can manage own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- Portfolios - User owns
CREATE POLICY "Users can manage own portfolios" ON user_portfolios FOR ALL USING (auth.uid() = user_id);

-- Portfolio positions - User owns
CREATE POLICY "Users can manage own positions" ON portfolio_positions FOR ALL USING (auth.uid() = user_id);

-- Subscriptions - User owns
CREATE POLICY "Users can view own subscription" ON market_oracle_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 12. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_challenge_enrollments_updated_at ON challenge_enrollments;
CREATE TRIGGER update_challenge_enrollments_updated_at
  BEFORE UPDATE ON challenge_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_portfolios_updated_at ON user_portfolios;
CREATE TRIGGER update_user_portfolios_updated_at
  BEFORE UPDATE ON user_portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON market_oracle_subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON market_oracle_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. INITIAL SEED DATA
-- ============================================================================

-- Create first 90-Day Challenge if not exists
INSERT INTO challenges (name, description, start_date, end_date, status, prize_pool)
SELECT 
  '90-Day Challenge - December 2025',
  'Compete against AI models to build the best portfolio! Track your progress, earn milestones, and win prizes.',
  NOW(),
  NOW() + INTERVAL '90 days',
  'active',
  10000
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE status = 'active');

-- ============================================================================
-- COMPLETE - Database ready for Market Oracle production
-- ============================================================================
