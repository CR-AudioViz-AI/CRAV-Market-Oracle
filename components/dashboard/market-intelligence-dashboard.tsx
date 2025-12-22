// components/dashboard/market-intelligence-dashboard.tsx
// Market Oracle - Comprehensive Market Intelligence Dashboard
// Created: December 22, 2025

'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Percent,
  BarChart3,
  Globe,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Newspaper,
  Calendar,
  Bitcoin,
  Building2,
  RefreshCw
} from 'lucide-react';

interface MarketIntelligenceData {
  timestamp: string;
  markets: {
    stocks: {
      status: 'open' | 'closed' | 'pre-market' | 'after-hours';
      majorIndexes: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
      }>;
    };
    crypto: {
      globalStats: {
        totalMarketCap: number;
        totalVolume24h: number;
        btcDominance: number;
        marketCapChange24h: number;
      } | null;
      fearGreed: {
        value: number;
        classification: string;
      };
      btcPrice: number | null;
      ethPrice: number | null;
      trending: Array<{ id: string; symbol: string; name: string }>;
    };
  };
  economy: {
    mortgageRates: {
      thirtyYear: number | null;
      fifteenYear: number | null;
    };
    fedFundsRate: number | null;
    unemployment: number | null;
    yieldCurve: {
      spread: number | null;
      signal: 'NORMAL' | 'FLAT' | 'INVERTED';
    };
    vix: {
      value: number | null;
      level: string;
    };
  };
  news: Array<{
    headline: string;
    source: string;
    datetime: string;
    url: string;
  }>;
  earnings: Array<{
    symbol: string;
    date: string;
    hour: string;
  }>;
}

function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'text-green-500';
    case 'pre-market': return 'text-yellow-500';
    case 'after-hours': return 'text-blue-500';
    default: return 'text-gray-500';
  }
}

function getVixColor(level: string): string {
  switch (level) {
    case 'LOW': return 'text-green-500 bg-green-500/10';
    case 'MODERATE': return 'text-blue-500 bg-blue-500/10';
    case 'ELEVATED': return 'text-yellow-500 bg-yellow-500/10';
    case 'HIGH': return 'text-orange-500 bg-orange-500/10';
    case 'EXTREME': return 'text-red-500 bg-red-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
}

function getFearGreedColor(value: number): string {
  if (value <= 25) return 'bg-red-500';
  if (value <= 45) return 'bg-orange-500';
  if (value <= 55) return 'bg-yellow-500';
  if (value <= 75) return 'bg-green-400';
  return 'bg-green-500';
}

export default function MarketIntelligenceDashboard() {
  const [data, setData] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/market-intelligence');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load market intelligence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <AlertTriangle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
          <p className="text-gray-400 text-sm">
            Real-time market data powered by 22 AI models
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${getStatusColor(data.markets.stocks.status)}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-sm font-medium capitalize">
              {data.markets.stocks.status.replace('-', ' ')}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Indexes */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Major Indexes</h2>
          </div>
          <div className="space-y-4">
            {data.markets.stocks.majorIndexes.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{index.symbol}</p>
                  <p className="text-xs text-gray-500">{index.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono">${index.price.toFixed(2)}</p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${
                    index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {index.changePercent >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatPercent(index.changePercent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crypto Overview */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Bitcoin className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Crypto Market</h2>
          </div>
          <div className="space-y-4">
            {/* BTC & ETH */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Bitcoin</p>
                <p className="text-lg font-mono text-white">
                  ${data.markets.crypto.btcPrice?.toLocaleString() || '--'}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Ethereum</p>
                <p className="text-lg font-mono text-white">
                  ${data.markets.crypto.ethPrice?.toLocaleString() || '--'}
                </p>
              </div>
            </div>

            {/* Global Stats */}
            {data.markets.crypto.globalStats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white">
                    {formatNumber(data.markets.crypto.globalStats.totalMarketCap)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="text-white">
                    {formatNumber(data.markets.crypto.globalStats.totalVolume24h)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">BTC Dominance</span>
                  <span className="text-white">
                    {data.markets.crypto.globalStats.btcDominance.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Fear & Greed */}
            <div className="pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Fear & Greed Index</span>
                <span className="text-sm font-medium text-white">
                  {data.markets.crypto.fearGreed.value}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getFearGreedColor(data.markets.crypto.fearGreed.value)} transition-all`}
                  style={{ width: `${data.markets.crypto.fearGreed.value}%` }}
                />
              </div>
              <p className="text-xs text-center mt-1 text-gray-400">
                {data.markets.crypto.fearGreed.classification}
              </p>
            </div>
          </div>
        </div>

        {/* Economic Indicators */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-white">Economic Indicators</h2>
          </div>
          <div className="space-y-4">
            {/* Mortgage Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">30-Yr Mortgage</p>
                <p className="text-lg font-mono text-white">
                  {data.economy.mortgageRates.thirtyYear?.toFixed(2) || '--'}%
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">15-Yr Mortgage</p>
                <p className="text-lg font-mono text-white">
                  {data.economy.mortgageRates.fifteenYear?.toFixed(2) || '--'}%
                </p>
              </div>
            </div>

            {/* Other Indicators */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fed Funds Rate</span>
                <span className="text-white">
                  {data.economy.fedFundsRate?.toFixed(2) || '--'}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Unemployment</span>
                <span className="text-white">
                  {data.economy.unemployment?.toFixed(1) || '--'}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Yield Curve (10Y-2Y)</span>
                <span className={`font-medium ${
                  data.economy.yieldCurve.signal === 'INVERTED' ? 'text-red-500' :
                  data.economy.yieldCurve.signal === 'FLAT' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {data.economy.yieldCurve.spread?.toFixed(2) || '--'}% ({data.economy.yieldCurve.signal})
                </span>
              </div>
            </div>

            {/* VIX */}
            <div className="pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">VIX (Fear Index)</span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getVixColor(data.economy.vix.level)}`}>
                  {data.economy.vix.value?.toFixed(2) || '--'} - {data.economy.vix.level}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-white">Latest News</h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.news.map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <p className="text-sm text-white line-clamp-2">{article.headline}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{new Date(article.datetime).toLocaleTimeString()}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Upcoming Earnings */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-semibold text-white">Upcoming Earnings</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.earnings.map((earning, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">{earning.symbol}</span>
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                    {earning.hour === 'BMO' ? 'Before Open' : 
                     earning.hour === 'AMC' ? 'After Close' : 
                     'During Hours'}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{earning.date}</span>
              </div>
            ))}
            {data.earnings.length === 0 && (
              <p className="text-gray-500 text-center py-4">No upcoming earnings this week</p>
            )}
          </div>
        </div>
      </div>

      {/* Trending Crypto */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-white">Trending Cryptocurrencies</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.markets.crypto.trending.map((coin) => (
            <div
              key={coin.id}
              className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer"
            >
              <span className="text-white font-medium">{coin.symbol}</span>
              <span className="text-gray-500 ml-2 text-sm">{coin.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
