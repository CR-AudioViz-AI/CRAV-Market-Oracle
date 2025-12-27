-- ═══════════════════════════════════════════════════════════════════════════
-- MARKET ORACLE - ENHANCED SCHEMA v2.0
-- Portfolio Tracking & Real Market Data
-- CR AudioViz AI - Fortune 50 Quality Standards
-- December 27, 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PORTFOLIOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    initial_value DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own portfolios" ON portfolios;
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- HOLDINGS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    shares DECIMAL(15, 6) NOT NULL,
    average_cost DECIMAL(15, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own holdings" ON holdings;
CREATE POLICY "Users can manage own holdings" ON holdings FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'split')),
    shares DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    fees DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PORTFOLIO SNAPSHOTS (for performance tracking)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    cost_basis DECIMAL(15, 2),
    day_change DECIMAL(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_portfolio ON portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON portfolio_snapshots(date);

-- ═══════════════════════════════════════════════════════════════════════════
-- STOCK QUOTES CACHE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stock_quotes_cache (
    symbol VARCHAR(10) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_updated ON stock_quotes_cache(updated_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- HISTORICAL DATA CACHE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS historical_data_cache (
    cache_key VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- WATCHLISTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    symbols TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watchlists" ON watchlists;
CREATE POLICY "Users can manage own watchlists" ON watchlists FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PRICE ALERTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('above', 'below', 'percent_up', 'percent_down')),
    target_price DECIMAL(15, 4),
    target_percent DECIMAL(5, 2),
    base_price DECIMAL(15, 4),
    triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(triggered) WHERE triggered = false;

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own alerts" ON price_alerts;
CREATE POLICY "Users can manage own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- AI PREDICTIONS ACCURACY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS prediction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    predicted_direction VARCHAR(10) NOT NULL,
    predicted_target DECIMAL(15, 4),
    actual_direction VARCHAR(10),
    actual_price DECIMAL(15, 4),
    prediction_date DATE NOT NULL,
    resolution_date DATE,
    accuracy_score DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_symbol ON prediction_results(symbol);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON prediction_results(prediction_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Create daily portfolio snapshots
CREATE OR REPLACE FUNCTION create_portfolio_snapshot(p_portfolio_id UUID)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_total_value DECIMAL(15, 2) := 0;
    v_total_cost DECIMAL(15, 2) := 0;
    v_yesterday_value DECIMAL(15, 2);
    r RECORD;
BEGIN
    SELECT user_id INTO v_user_id FROM portfolios WHERE id = p_portfolio_id;
    
    FOR r IN SELECT symbol, shares, average_cost FROM holdings WHERE portfolio_id = p_portfolio_id
    LOOP
        -- Get current price from cache
        SELECT (data->>'price')::DECIMAL INTO v_total_value 
        FROM stock_quotes_cache WHERE symbol = r.symbol;
        
        v_total_value := v_total_value + (COALESCE(v_total_value, r.average_cost) * r.shares);
        v_total_cost := v_total_cost + (r.average_cost * r.shares);
    END LOOP;
    
    -- Get yesterday's value
    SELECT value INTO v_yesterday_value 
    FROM portfolio_snapshots 
    WHERE portfolio_id = p_portfolio_id 
    ORDER BY date DESC LIMIT 1;
    
    INSERT INTO portfolio_snapshots (user_id, portfolio_id, date, value, cost_basis, day_change)
    VALUES (
        v_user_id,
        p_portfolio_id,
        CURRENT_DATE,
        v_total_value,
        v_total_cost,
        v_total_value - COALESCE(v_yesterday_value, v_total_value)
    )
    ON CONFLICT (portfolio_id, date) DO UPDATE SET
        value = EXCLUDED.value,
        cost_basis = EXCLUDED.cost_basis,
        day_change = EXCLUDED.day_change;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

SELECT 'Market Oracle Enhanced Schema Complete ✅' as status;
