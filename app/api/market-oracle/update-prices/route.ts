// app/api/market-oracle/update-prices/route.ts - LIVE PRICE UPDATES
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Crypto symbol mapping for CoinGecko
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'SHIB': 'shiba-inu',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
};

// Fetch stock prices from Yahoo Finance
async function getStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  if (tickers.length === 0) return prices;
  
  try {
    // Yahoo Finance API (free, no key needed)
    const symbols = tickers.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('Yahoo Finance error:', response.status);
      return prices;
    }
    
    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];
    
    for (const quote of quotes) {
      if (quote.symbol && quote.regularMarketPrice) {
        prices.set(quote.symbol.toUpperCase(), quote.regularMarketPrice);
      }
    }
  } catch (error) {
    console.error('Stock price fetch error:', error);
  }
  
  return prices;
}

// Fetch crypto prices from CoinGecko
async function getCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  if (tickers.length === 0) return prices;
  
  try {
    // Map tickers to CoinGecko IDs
    const coinIds = tickers
      .map(t => CRYPTO_MAP[t.toUpperCase()])
      .filter(Boolean)
      .join(',');
    
    if (!coinIds) return prices;
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('CoinGecko error:', response.status);
      return prices;
    }
    
    const data = await response.json();
    
    // Map back to ticker symbols
    for (const ticker of tickers) {
      const coinId = CRYPTO_MAP[ticker.toUpperCase()];
      if (coinId && data[coinId]?.usd) {
        prices.set(ticker.toUpperCase(), data[coinId].usd);
      }
    }
  } catch (error) {
    console.error('Crypto price fetch error:', error);
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
  // For Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return updatePrices();
}

async function updatePrices() {
  const startTime = Date.now();
  
  // Get all active picks
  const { data: picks, error: fetchError } = await supabase
    .from('stock_picks')
    .select('id, ticker, category, entry_price')
    .eq('status', 'active');
  
  if (fetchError || !picks) {
    return NextResponse.json({ error: 'Failed to fetch picks', details: fetchError?.message }, { status: 500 });
  }
  
  if (picks.length === 0) {
    return NextResponse.json({ message: 'No active picks to update', updated: 0 });
  }
  
  // Separate stocks and crypto
  const stockTickers = picks.filter(p => p.category !== 'crypto').map(p => p.ticker);
  const cryptoTickers = picks.filter(p => p.category === 'crypto').map(p => p.ticker);
  
  // Remove duplicates
  const uniqueStocks = [...new Set(stockTickers)];
  const uniqueCrypto = [...new Set(cryptoTickers)];
  
  console.log(`Fetching prices for ${uniqueStocks.length} stocks and ${uniqueCrypto.length} crypto`);
  
  // Fetch prices in parallel
  const [stockPrices, cryptoPrices] = await Promise.all([
    getStockPrices(uniqueStocks),
    getCryptoPrices(uniqueCrypto),
  ]);
  
  // Merge all prices
  const allPrices = new Map([...stockPrices, ...cryptoPrices]);
  
  console.log(`Got ${allPrices.size} prices`);
  
  // Update each pick
  let updated = 0;
  let failed = 0;
  const now = new Date().toISOString();
  
  for (const pick of picks) {
    const currentPrice = allPrices.get(pick.ticker.toUpperCase());
    
    if (currentPrice !== undefined && currentPrice > 0) {
      const priceChange = currentPrice - pick.entry_price;
      const priceChangePct = ((currentPrice - pick.entry_price) / pick.entry_price) * 100;
      
      const { error: updateError } = await supabase
        .from('stock_picks')
        .update({
          current_price: currentPrice,
          price_change: priceChange,
          price_change_pct: priceChangePct,
          last_price_update: now,
        })
        .eq('id', pick.id);
      
      if (!updateError) {
        updated++;
      } else {
        failed++;
        console.error(`Failed to update ${pick.ticker}:`, updateError.message);
      }
    } else {
      console.log(`No price found for ${pick.ticker}`);
      failed++;
    }
  }
  
  const elapsed = Date.now() - startTime;
  
  return NextResponse.json({
    success: updated > 0,
    summary: {
      totalPicks: picks.length,
      pricesFound: allPrices.size,
      updated,
      failed,
    },
    prices: {
      stocks: uniqueStocks.length,
      crypto: uniqueCrypto.length,
    },
    elapsedMs: elapsed,
    timestamp: now,
  });
}
