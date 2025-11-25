// app/api/market-oracle/update-prices/route.ts - LIVE PRICE UPDATES V2
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// Crypto symbol mapping for CoinGecko
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'AVAX': 'avalanche-2',
  'MATIC': 'matic-network', 'LINK': 'chainlink', 'XRP': 'ripple', 'DOGE': 'dogecoin',
  'ADA': 'cardano', 'DOT': 'polkadot', 'SHIB': 'shiba-inu', 'LTC': 'litecoin',
  'UNI': 'uniswap', 'ATOM': 'cosmos', 'XLM': 'stellar', 'PEPE': 'pepe',
};

// Fetch stock price from Finnhub (free API)
async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || 'ct3s5i1r01qhb4g5c7ngct3s5i1r01qhb4g5c7o0'; // Free demo key
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    // c = current price, pc = previous close
    return data.c > 0 ? data.c : (data.pc > 0 ? data.pc : null);
  } catch (error) {
    console.error(`Finnhub error for ${ticker}:`, error);
    return null;
  }
}

// Fetch crypto prices from CoinGecko (batch)
async function getCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (tickers.length === 0) return prices;
  
  try {
    const coinIds = tickers.map(t => CRYPTO_MAP[t.toUpperCase()]).filter(Boolean).join(',');
    if (!coinIds) return prices;
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`;
    const response = await fetch(url);
    if (!response.ok) return prices;
    
    const data = await response.json();
    for (const ticker of tickers) {
      const coinId = CRYPTO_MAP[ticker.toUpperCase()];
      if (coinId && data[coinId]?.usd) {
        prices.set(ticker.toUpperCase(), data[coinId].usd);
      }
    }
  } catch (error) {
    console.error('CoinGecko error:', error);
  }
  return prices;
}

// Rate-limited stock price fetcher (Finnhub: 60/min free tier)
async function getStockPricesWithRateLimit(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const uniqueTickers = [...new Set(tickers)];
  
  // Process in batches with delay to respect rate limits
  for (let i = 0; i < uniqueTickers.length; i++) {
    const ticker = uniqueTickers[i];
    const price = await getStockPrice(ticker);
    if (price !== null) {
      prices.set(ticker, price);
    }
    // Small delay between requests (60 calls/min = 1 per second)
    if (i < uniqueTickers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return prices;
}

export async function GET(req: NextRequest) {
  const trigger = new URL(req.url).searchParams.get('trigger');
  if (trigger !== 'manual' && trigger !== 'cron') {
    return NextResponse.json({
      message: 'Market Oracle Price Update API',
      usage: 'Add ?trigger=manual to update prices',
      schedule: 'Auto-runs every 15 minutes during market hours',
    });
  }
  return updatePrices();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return updatePrices();
}

async function updatePrices() {
  const startTime = Date.now();
  
  const { data: picks, error: fetchError } = await supabase
    .from('stock_picks')
    .select('id, ticker, category, entry_price')
    .eq('status', 'active');
  
  if (fetchError || !picks) {
    return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
  }
  
  if (picks.length === 0) {
    return NextResponse.json({ message: 'No active picks', updated: 0 });
  }
  
  // Separate stocks and crypto
  const stockTickers = picks.filter(p => p.category !== 'crypto').map(p => p.ticker);
  const cryptoTickers = picks.filter(p => p.category === 'crypto').map(p => p.ticker);
  
  console.log(`Fetching: ${[...new Set(stockTickers)].length} stocks, ${[...new Set(cryptoTickers)].length} crypto`);
  
  // Fetch prices
  const [stockPrices, cryptoPrices] = await Promise.all([
    getStockPricesWithRateLimit(stockTickers),
    getCryptoPrices([...new Set(cryptoTickers)]),
  ]);
  
  const allPrices = new Map([...stockPrices, ...cryptoPrices]);
  console.log(`Got ${allPrices.size} prices total`);
  
  // Update database
  let updated = 0, failed = 0;
  const now = new Date().toISOString();
  
  for (const pick of picks) {
    const currentPrice = allPrices.get(pick.ticker.toUpperCase());
    
    if (currentPrice !== undefined && currentPrice > 0) {
      const priceChange = currentPrice - pick.entry_price;
      const priceChangePct = ((currentPrice - pick.entry_price) / pick.entry_price) * 100;
      
      const { error } = await supabase
        .from('stock_picks')
        .update({
          current_price: currentPrice,
          price_change: priceChange,
          price_change_pct: priceChangePct,
          last_price_update: now,
        })
        .eq('id', pick.id);
      
      if (!error) updated++;
      else failed++;
    } else {
      failed++;
    }
  }
  
  return NextResponse.json({
    success: updated > 0,
    summary: { totalPicks: picks.length, pricesFound: allPrices.size, updated, failed },
    prices: { stocks: stockPrices.size, crypto: cryptoPrices.size },
    elapsedMs: Date.now() - startTime,
    timestamp: now,
  });
}
