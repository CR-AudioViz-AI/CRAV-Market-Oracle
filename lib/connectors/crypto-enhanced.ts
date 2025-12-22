// lib/connectors/crypto-enhanced.ts
// Market Oracle - Enhanced Cryptocurrency Data Connector
// Created: December 22, 2025
// Combines CoinGecko, Binance, and CoinCap for comprehensive crypto intelligence

/**
 * Enhanced Crypto Connector
 * 
 * Data Sources:
 * - CoinGecko: Market data, trending, global stats
 * - Binance: Real-time prices, order books
 * - CoinCap: WebSocket support, exchange data
 */

// API endpoints
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BINANCE_BASE = 'https://api.binance.com/api/v3';
const COINCAP_BASE = 'https://api.coincap.io/v2';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  athChangePercent: number;
  atl: number;
  atlDate: string;
  atlChangePercent: number;
  lastUpdated: string;
}

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number;
  thumb: string;
  score: number;
  priceChange24h?: number;
}

interface GlobalCryptoStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChange24h: number;
}

interface CryptoFearGreed {
  value: number;
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
}

interface ExchangeInfo {
  id: string;
  name: string;
  yearEstablished: number | null;
  country: string | null;
  trustScore: number;
  trustScoreRank: number;
  tradeVolume24hBtc: number;
  url: string;
}

// CoinGecko helper
async function fetchCoinGecko<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

  try {
    const response = await fetch(`${COINGECKO_BASE}${endpoint}`, {
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`CoinGecko error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

// Binance helper
async function fetchBinance<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${BINANCE_BASE}${endpoint}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Binance fetch error:', error);
    return null;
  }
}

// CoinCap helper
async function fetchCoinCap<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${COINCAP_BASE}${endpoint}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('CoinCap fetch error:', error);
    return null;
  }
}

/**
 * Get price for a specific coin
 */
export async function getCryptoPrice(coinId: string): Promise<CryptoPrice | null> {
  const data = await fetchCoinGecko<any>(
    `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
  );

  if (!data) return null;

  const market = data.market_data;
  return {
    id: data.id,
    symbol: data.symbol?.toUpperCase() || '',
    name: data.name,
    price: market?.current_price?.usd || 0,
    priceChange24h: market?.price_change_24h || 0,
    priceChangePercent24h: market?.price_change_percentage_24h || 0,
    marketCap: market?.market_cap?.usd || 0,
    marketCapRank: data.market_cap_rank || 0,
    volume24h: market?.total_volume?.usd || 0,
    high24h: market?.high_24h?.usd || 0,
    low24h: market?.low_24h?.usd || 0,
    circulatingSupply: market?.circulating_supply || 0,
    totalSupply: market?.total_supply,
    maxSupply: market?.max_supply,
    ath: market?.ath?.usd || 0,
    athDate: market?.ath_date?.usd || '',
    athChangePercent: market?.ath_change_percentage?.usd || 0,
    atl: market?.atl?.usd || 0,
    atlDate: market?.atl_date?.usd || '',
    atlChangePercent: market?.atl_change_percentage?.usd || 0,
    lastUpdated: data.last_updated,
  };
}

/**
 * Get top cryptocurrencies by market cap
 */
export async function getTopCryptos(limit: number = 50): Promise<CryptoPrice[]> {
  const data = await fetchCoinGecko<any[]>(
    `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
  );

  if (!data) return [];

  return data.map(coin => ({
    id: coin.id,
    symbol: coin.symbol?.toUpperCase() || '',
    name: coin.name,
    price: coin.current_price || 0,
    priceChange24h: coin.price_change_24h || 0,
    priceChangePercent24h: coin.price_change_percentage_24h || 0,
    marketCap: coin.market_cap || 0,
    marketCapRank: coin.market_cap_rank || 0,
    volume24h: coin.total_volume || 0,
    high24h: coin.high_24h || 0,
    low24h: coin.low_24h || 0,
    circulatingSupply: coin.circulating_supply || 0,
    totalSupply: coin.total_supply,
    maxSupply: coin.max_supply,
    ath: coin.ath || 0,
    athDate: coin.ath_date || '',
    athChangePercent: coin.ath_change_percentage || 0,
    atl: coin.atl || 0,
    atlDate: coin.atl_date || '',
    atlChangePercent: coin.atl_change_percentage || 0,
    lastUpdated: coin.last_updated,
  }));
}

/**
 * Get trending coins
 */
export async function getTrendingCryptos(): Promise<TrendingCoin[]> {
  const data = await fetchCoinGecko<{ coins: Array<{ item: any }> }>('/search/trending');
  
  if (!data?.coins) return [];

  return data.coins.map(({ item }) => ({
    id: item.id,
    symbol: item.symbol?.toUpperCase() || '',
    name: item.name,
    marketCapRank: item.market_cap_rank || 0,
    thumb: item.thumb,
    score: item.score || 0,
    priceChange24h: item.data?.price_change_percentage_24h?.usd,
  }));
}

/**
 * Get global crypto market stats
 */
export async function getGlobalStats(): Promise<GlobalCryptoStats | null> {
  const data = await fetchCoinGecko<{ data: any }>('/global');
  
  if (!data?.data) return null;

  const global = data.data;
  return {
    totalMarketCap: global.total_market_cap?.usd || 0,
    totalVolume24h: global.total_volume?.usd || 0,
    btcDominance: global.market_cap_percentage?.btc || 0,
    ethDominance: global.market_cap_percentage?.eth || 0,
    activeCryptocurrencies: global.active_cryptocurrencies || 0,
    markets: global.markets || 0,
    marketCapChange24h: global.market_cap_change_percentage_24h_usd || 0,
  };
}

/**
 * Get Fear & Greed Index (simulated from market data)
 */
export async function getFearGreedIndex(): Promise<CryptoFearGreed> {
  // Calculate from market conditions
  const globalStats = await getGlobalStats();
  const btcData = await getCryptoPrice('bitcoin');

  let value = 50; // Default neutral

  if (globalStats && btcData) {
    // Factors:
    // 1. Market cap change (positive = greed, negative = fear)
    const marketCapFactor = Math.min(Math.max(globalStats.marketCapChange24h * 2, -25), 25);
    
    // 2. BTC price change
    const btcFactor = Math.min(Math.max(btcData.priceChangePercent24h * 3, -25), 25);
    
    // 3. ATH distance (closer to ATH = more greed)
    const athFactor = btcData.athChangePercent > -20 ? 15 : btcData.athChangePercent > -50 ? 0 : -15;
    
    value = Math.round(50 + marketCapFactor + btcFactor + athFactor);
    value = Math.max(0, Math.min(100, value));
  }

  let classification: CryptoFearGreed['classification'];
  if (value <= 20) classification = 'Extreme Fear';
  else if (value <= 40) classification = 'Fear';
  else if (value <= 60) classification = 'Neutral';
  else if (value <= 80) classification = 'Greed';
  else classification = 'Extreme Greed';

  return {
    value,
    classification,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get top exchanges
 */
export async function getTopExchanges(limit: number = 10): Promise<ExchangeInfo[]> {
  const data = await fetchCoinGecko<any[]>(`/exchanges?per_page=${limit}`);
  
  if (!data) return [];

  return data.map(ex => ({
    id: ex.id,
    name: ex.name,
    yearEstablished: ex.year_established,
    country: ex.country,
    trustScore: ex.trust_score || 0,
    trustScoreRank: ex.trust_score_rank || 0,
    tradeVolume24hBtc: ex.trade_volume_24h_btc || 0,
    url: ex.url,
  }));
}

/**
 * Get Binance real-time price (faster than CoinGecko)
 */
export async function getBinancePrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
} | null> {
  // Convert to Binance format (e.g., BTC -> BTCUSDT)
  const binanceSymbol = `${symbol.toUpperCase()}USDT`;
  
  const data = await fetchBinance<{
    symbol: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    volume: string;
    highPrice: string;
    lowPrice: string;
  }>(`/ticker/24hr?symbol=${binanceSymbol}`);

  if (!data) return null;

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(data.lastPrice),
    priceChange: parseFloat(data.priceChange),
    priceChangePercent: parseFloat(data.priceChangePercent),
    volume: parseFloat(data.volume),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
  };
}

/**
 * Get price history for a coin
 */
export async function getPriceHistory(
  coinId: string,
  days: number = 30
): Promise<Array<{ timestamp: number; price: number }>> {
  const data = await fetchCoinGecko<{ prices: Array<[number, number]> }>(
    `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );

  if (!data?.prices) return [];

  return data.prices.map(([timestamp, price]) => ({
    timestamp,
    price,
  }));
}

/**
 * Search for cryptocurrencies
 */
export async function searchCryptos(query: string): Promise<Array<{
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
  thumb: string;
}>> {
  const data = await fetchCoinGecko<{ coins: any[] }>(`/search?query=${encodeURIComponent(query)}`);
  
  if (!data?.coins) return [];

  return data.coins.slice(0, 20).map(coin => ({
    id: coin.id,
    symbol: coin.symbol?.toUpperCase() || '',
    name: coin.name,
    marketCapRank: coin.market_cap_rank,
    thumb: coin.thumb,
  }));
}

/**
 * Get comprehensive crypto dashboard data
 */
export async function getCryptoDashboard(): Promise<{
  global: GlobalCryptoStats | null;
  fearGreed: CryptoFearGreed;
  trending: TrendingCoin[];
  top10: CryptoPrice[];
  btc: CryptoPrice | null;
  eth: CryptoPrice | null;
}> {
  const [global, fearGreed, trending, top10, btc, eth] = await Promise.all([
    getGlobalStats(),
    getFearGreedIndex(),
    getTrendingCryptos(),
    getTopCryptos(10),
    getCryptoPrice('bitcoin'),
    getCryptoPrice('ethereum'),
  ]);

  return { global, fearGreed, trending, top10, btc, eth };
}

export default {
  getCryptoPrice,
  getTopCryptos,
  getTrendingCryptos,
  getGlobalStats,
  getFearGreedIndex,
  getTopExchanges,
  getBinancePrice,
  getPriceHistory,
  searchCryptos,
  getCryptoDashboard,
};
