/**
 * MARKET ORACLE - REAL MARKET DATA API
 * Aggregates data from multiple free/premium sources
 * 
 * CR AudioViz AI - Fortune 50 Quality Standards
 * @version 2.0.0
 * @date December 27, 2025
 * 
 * Data Sources:
 * - Alpha Vantage (free tier: 5 calls/min, 500/day)
 * - Finnhub (free tier: 60 calls/min)
 * - Polygon.io (free tier: 5 calls/min)
 * - Yahoo Finance (unofficial)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// API KEYS
// ============================================================================

const API_KEYS = {
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY,
  FINNHUB: process.env.FINNHUB_API_KEY,
  POLYGON: process.env.POLYGON_API_KEY,
};

// ============================================================================
// TYPES
// ============================================================================

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  source: string;
}

interface HistoricalData {
  symbol: string;
  interval: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

// ============================================================================
// GET - Fetch market data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'quote';
    const symbol = searchParams.get('symbol');
    const symbols = searchParams.get('symbols'); // comma-separated
    const interval = searchParams.get('interval') || 'daily';

    switch (action) {
      case 'quote':
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }
        return await getQuote(symbol);

      case 'quotes':
        if (!symbols) {
          return NextResponse.json({ error: 'Symbols required' }, { status: 400 });
        }
        return await getMultipleQuotes(symbols.split(','));

      case 'history':
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }
        return await getHistoricalData(symbol, interval);

      case 'market-movers':
        return await getMarketMovers();

      case 'sectors':
        return await getSectorPerformance();

      case 'indices':
        return await getMarketIndices();

      case 'news':
        return await getMarketNews(symbol);

      case 'ai-stocks':
        return await getAIStocks();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Market data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GET SINGLE QUOTE
// ============================================================================

async function getQuote(symbol: string): Promise<NextResponse> {
  // Check cache first (1 minute cache)
  const { data: cached } = await supabase
    .from('stock_quotes_cache')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (cached && new Date(cached.updated_at).getTime() > Date.now() - 60000) {
    return NextResponse.json({ quote: cached.data, cached: true });
  }

  // Try multiple sources in order of preference
  let quote: StockQuote | null = null;

  // Try Finnhub first (highest rate limit)
  if (API_KEYS.FINNHUB) {
    try {
      quote = await fetchFinnhubQuote(symbol);
    } catch (e) {
      console.error('Finnhub error:', e);
    }
  }

  // Fallback to Alpha Vantage
  if (!quote && API_KEYS.ALPHA_VANTAGE) {
    try {
      quote = await fetchAlphaVantageQuote(symbol);
    } catch (e) {
      console.error('Alpha Vantage error:', e);
    }
  }

  // Fallback to Yahoo Finance (unofficial)
  if (!quote) {
    try {
      quote = await fetchYahooQuote(symbol);
    } catch (e) {
      console.error('Yahoo error:', e);
    }
  }

  if (!quote) {
    return NextResponse.json({ error: 'Unable to fetch quote' }, { status: 503 });
  }

  // Cache the result
  await supabase
    .from('stock_quotes_cache')
    .upsert({
      symbol: symbol.toUpperCase(),
      data: quote,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'symbol' });

  return NextResponse.json({ quote, cached: false });
}

// ============================================================================
// FINNHUB INTEGRATION
// ============================================================================

async function fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.FINNHUB}`
  );
  
  if (!response.ok) throw new Error('Finnhub API error');
  
  const data = await response.json();
  
  // Get company profile for name
  const profileRes = await fetch(
    `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEYS.FINNHUB}`
  );
  const profile = profileRes.ok ? await profileRes.json() : {};

  return {
    symbol: symbol.toUpperCase(),
    name: profile.name || symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    volume: 0, // Not in basic quote
    marketCap: profile.marketCapitalization,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: new Date(data.t * 1000).toISOString(),
    source: 'finnhub',
  };
}

// ============================================================================
// ALPHA VANTAGE INTEGRATION
// ============================================================================

async function fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`
  );
  
  if (!response.ok) throw new Error('Alpha Vantage API error');
  
  const data = await response.json();
  const quote = data['Global Quote'];
  
  if (!quote || Object.keys(quote).length === 0) {
    throw new Error('No data returned');
  }

  const price = parseFloat(quote['05. price']);
  const previousClose = parseFloat(quote['08. previous close']);
  const change = price - previousClose;

  return {
    symbol: quote['01. symbol'],
    name: symbol,
    price,
    change,
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    open: parseFloat(quote['02. open']),
    previousClose,
    timestamp: quote['07. latest trading day'],
    source: 'alphavantage',
  };
}

// ============================================================================
// YAHOO FINANCE INTEGRATION (Unofficial)
// ============================================================================

async function fetchYahooQuote(symbol: string): Promise<StockQuote> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }
  );
  
  if (!response.ok) throw new Error('Yahoo Finance API error');
  
  const data = await response.json();
  const result = data.chart.result[0];
  const meta = result.meta;
  const quote = result.indicators.quote[0];

  return {
    symbol: meta.symbol,
    name: meta.shortName || meta.symbol,
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    volume: meta.regularMarketVolume,
    marketCap: meta.marketCap,
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    open: meta.regularMarketOpen,
    previousClose: meta.previousClose,
    timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
    source: 'yahoo',
  };
}

// ============================================================================
// GET MULTIPLE QUOTES
// ============================================================================

async function getMultipleQuotes(symbols: string[]): Promise<NextResponse> {
  const quotes: StockQuote[] = [];
  const errors: string[] = [];

  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        const response = await getQuote(symbol);
        const data = await response.json();
        return data.quote;
      })
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === 'fulfilled' && result.value) {
        quotes.push(result.value);
      } else {
        errors.push(batch[j]);
      }
    }

    // Rate limit between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({
    quotes,
    errors: errors.length > 0 ? errors : undefined,
    total: quotes.length,
  });
}

// ============================================================================
// GET HISTORICAL DATA
// ============================================================================

async function getHistoricalData(symbol: string, interval: string): Promise<NextResponse> {
  // Check cache (1 hour for daily, 5 min for intraday)
  const cacheKey = `${symbol}_${interval}`;
  const cacheTime = interval === 'daily' ? 3600000 : 300000;

  const { data: cached } = await supabase
    .from('historical_data_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .single();

  if (cached && new Date(cached.updated_at).getTime() > Date.now() - cacheTime) {
    return NextResponse.json({ data: cached.data, cached: true });
  }

  // Fetch from Yahoo Finance
  const range = interval === 'daily' ? '1y' : interval === 'weekly' ? '5y' : '1mo';
  
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 503 });
  }

  const json = await response.json();
  const result = json.chart.result[0];
  const timestamps = result.timestamp;
  const quotes = result.indicators.quote[0];

  const data: HistoricalData = {
    symbol: symbol.toUpperCase(),
    interval,
    data: timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume[i],
    })).filter((d: any) => d.close !== null),
  };

  // Cache
  await supabase
    .from('historical_data_cache')
    .upsert({
      cache_key: cacheKey,
      data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cache_key' });

  return NextResponse.json({ data, cached: false });
}

// ============================================================================
// GET MARKET MOVERS
// ============================================================================

async function getMarketMovers(): Promise<NextResponse> {
  // Top gainers/losers from major indices
  const movers = {
    gainers: [] as StockQuote[],
    losers: [] as StockQuote[],
    mostActive: [] as StockQuote[],
  };

  if (API_KEYS.FINNHUB) {
    try {
      // Finnhub doesn't have direct movers endpoint, use screener alternative
      // In production, you'd use a proper screener or websocket for real-time
    } catch (e) {
      console.error('Market movers error:', e);
    }
  }

  return NextResponse.json({ movers });
}

// ============================================================================
// GET SECTOR PERFORMANCE
// ============================================================================

async function getSectorPerformance(): Promise<NextResponse> {
  // Sector ETFs for performance tracking
  const sectorETFs = {
    'Technology': 'XLK',
    'Healthcare': 'XLV',
    'Financials': 'XLF',
    'Consumer Discretionary': 'XLY',
    'Communication Services': 'XLC',
    'Industrials': 'XLI',
    'Consumer Staples': 'XLP',
    'Energy': 'XLE',
    'Utilities': 'XLU',
    'Real Estate': 'XLRE',
    'Materials': 'XLB',
  };

  const sectors: Record<string, any> = {};

  for (const [sector, etf] of Object.entries(sectorETFs)) {
    try {
      const response = await getQuote(etf);
      const data = await response.json();
      if (data.quote) {
        sectors[sector] = {
          etf,
          price: data.quote.price,
          change: data.quote.change,
          changePercent: data.quote.changePercent,
        };
      }
    } catch (e) {
      console.error(`Error fetching ${sector}:`, e);
    }
  }

  return NextResponse.json({ sectors });
}

// ============================================================================
// GET MARKET INDICES
// ============================================================================

async function getMarketIndices(): Promise<NextResponse> {
  const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
  const results: Record<string, any> = {};

  for (const symbol of indices) {
    try {
      const response = await fetchYahooQuote(symbol);
      results[symbol] = response;
    } catch (e) {
      console.error(`Error fetching ${symbol}:`, e);
    }
  }

  return NextResponse.json({
    indices: {
      'S&P 500': results['^GSPC'],
      'Dow Jones': results['^DJI'],
      'NASDAQ': results['^IXIC'],
      'Russell 2000': results['^RUT'],
      'VIX': results['^VIX'],
    },
  });
}

// ============================================================================
// GET MARKET NEWS
// ============================================================================

async function getMarketNews(symbol?: string | null): Promise<NextResponse> {
  if (!API_KEYS.FINNHUB) {
    return NextResponse.json({ news: [], error: 'News API not configured' });
  }

  let url = `https://finnhub.io/api/v1/news?category=general&token=${API_KEYS.FINNHUB}`;
  
  if (symbol) {
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${API_KEYS.FINNHUB}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ news: [], error: 'Failed to fetch news' });
  }

  const news = await response.json();

  return NextResponse.json({
    news: news.slice(0, 20).map((item: any) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image,
      datetime: new Date(item.datetime * 1000).toISOString(),
      related: item.related,
    })),
  });
}

// ============================================================================
// GET AI STOCKS
// ============================================================================

async function getAIStocks(): Promise<NextResponse> {
  // Curated list of AI-related stocks
  const aiSymbols = [
    'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD', 'INTC', 'IBM',
    'CRM', 'PLTR', 'AI', 'PATH', 'SNOW', 'NET', 'DDOG', 'MDB',
    'PANW', 'CRWD', 'ZS', 'OKTA', 'TEAM', 'DOCU', 'TWLO', 'SHOP'
  ];

  const response = await getMultipleQuotes(aiSymbols);
  const data = await response.json();

  // Sort by performance
  const sorted = (data.quotes || []).sort(
    (a: StockQuote, b: StockQuote) => b.changePercent - a.changePercent
  );

  return NextResponse.json({
    ai_stocks: sorted,
    total: sorted.length,
    top_performers: sorted.slice(0, 5),
    worst_performers: sorted.slice(-5).reverse(),
  });
}
