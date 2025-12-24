// Market Oracle - Stock Correlations API
// Finds stocks that move together or inversely
// Useful for pairs trading and diversification

import { NextResponse } from 'next/server';

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || '820e92da2fe34f3b8347b3faea0dade8';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd50o3i9r01qm94qn6ag0d50o3i9r01qm94qn6agg';

interface CorrelationResult {
  symbol: string;
  name?: string;
  correlation: number;
  relationship: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
  tradingImplication: string;
  sector?: string;
}

// Major stocks for correlation analysis
const MAJOR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'META', name: 'Meta', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Auto' },
  { symbol: 'AMD', name: 'AMD', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Financials' },
  { symbol: 'V', name: 'Visa', sector: 'Financials' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
  { symbol: 'XOM', name: 'Exxon', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy' },
  { symbol: 'WMT', name: 'Walmart', sector: 'Retail' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Retail' },
  { symbol: 'DIS', name: 'Disney', sector: 'Media' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Media' },
  { symbol: 'BA', name: 'Boeing', sector: 'Industrial' },
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrial' },
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Index' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', sector: 'Index' },
  { symbol: 'GLD', name: 'Gold ETF', sector: 'Commodity' },
  { symbol: 'TLT', name: 'Treasury Bond ETF', sector: 'Bonds' },
];

async function fetchReturns(symbol: string, days: number = 60): Promise<number[]> {
  try {
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${days + 1}&apikey=${TWELVE_DATA_KEY}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const values = data.values || [];
    
    if (values.length < 2) return [];
    
    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 0; i < values.length - 1; i++) {
      const today = parseFloat(values[i].close);
      const yesterday = parseFloat(values[i + 1].close);
      returns.push((today - yesterday) / yesterday);
    }
    
    return returns;
  } catch (error) {
    console.error(`Error fetching returns for ${symbol}:`, error);
    return [];
  }
}

function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  if (n < 10) return 0;
  
  const r1 = returns1.slice(0, n);
  const r2 = returns2.slice(0, n);
  
  const mean1 = r1.reduce((a, b) => a + b, 0) / n;
  const mean2 = r2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const d1 = r1[i] - mean1;
    const d2 = r2[i] - mean2;
    numerator += d1 * d2;
    denom1 += d1 * d1;
    denom2 += d2 * d2;
  }
  
  if (denom1 === 0 || denom2 === 0) return 0;
  
  return numerator / Math.sqrt(denom1 * denom2);
}

function getRelationship(correlation: number): CorrelationResult['relationship'] {
  if (correlation >= 0.7) return 'strong_positive';
  if (correlation >= 0.3) return 'positive';
  if (correlation >= -0.3) return 'neutral';
  if (correlation >= -0.7) return 'negative';
  return 'strong_negative';
}

function getTradingImplication(correlation: number, symbol1: string, symbol2: string): string {
  if (correlation >= 0.7) {
    return `${symbol1} and ${symbol2} move together. Avoid holding both for diversification. Consider for pairs trading when spread diverges.`;
  }
  if (correlation >= 0.3) {
    return `Moderate positive correlation. Some diversification benefit, but watch for sector-wide moves.`;
  }
  if (correlation >= -0.3) {
    return `Low correlation. Good for portfolio diversification. Price movements are largely independent.`;
  }
  if (correlation >= -0.7) {
    return `Negative correlation. One tends to rise when the other falls. Good hedge opportunity.`;
  }
  return `Strong inverse relationship. Excellent for hedging. Consider pairs trade when correlation breaks.`;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const days = parseInt(searchParams.get('days') || '60');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol required. Usage: /api/correlations?symbol=AAPL'
      }, { status: 400 });
    }
    
    const targetSymbol = symbol.toUpperCase();
    
    // Fetch returns for target symbol
    const targetReturns = await fetchReturns(targetSymbol, days);
    
    if (targetReturns.length < 10) {
      return NextResponse.json({
        success: false,
        error: `Insufficient data for ${targetSymbol}`
      }, { status: 400 });
    }
    
    // Filter out the target symbol from comparison list
    const compareStocks = MAJOR_STOCKS.filter(s => s.symbol !== targetSymbol);
    
    // Fetch returns and calculate correlations (limit parallel requests)
    const batchSize = 5;
    const correlations: CorrelationResult[] = [];
    
    for (let i = 0; i < compareStocks.length; i += batchSize) {
      const batch = compareStocks.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (stock) => {
          const returns = await fetchReturns(stock.symbol, days);
          if (returns.length < 10) return null;
          
          const corr = calculateCorrelation(targetReturns, returns);
          
          return {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            correlation: Math.round(corr * 1000) / 1000,
            relationship: getRelationship(corr),
            tradingImplication: getTradingImplication(corr, targetSymbol, stock.symbol)
          };
        })
      );
      
      correlations.push(...results.filter((r): r is CorrelationResult => r !== null));
    }
    
    // Sort by absolute correlation (most correlated first)
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    
    // Separate into categories
    const highlyCorrelated = correlations.filter(c => c.correlation >= 0.7);
    const inverselyCorrelated = correlations.filter(c => c.correlation <= -0.3);
    const uncorrelated = correlations.filter(c => Math.abs(c.correlation) < 0.3);
    
    // Sector analysis
    const bySector: Record<string, { avg: number; count: number; stocks: string[] }> = {};
    for (const c of correlations) {
      if (!c.sector) continue;
      if (!bySector[c.sector]) {
        bySector[c.sector] = { avg: 0, count: 0, stocks: [] };
      }
      bySector[c.sector].avg += c.correlation;
      bySector[c.sector].count++;
      bySector[c.sector].stocks.push(c.symbol);
    }
    
    const sectorCorrelations = Object.entries(bySector).map(([sector, data]) => ({
      sector,
      avgCorrelation: Math.round((data.avg / data.count) * 1000) / 1000,
      stockCount: data.count,
      stocks: data.stocks
    })).sort((a, b) => b.avgCorrelation - a.avgCorrelation);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      symbol: targetSymbol,
      analysisWindow: `${days} days`,
      summary: {
        totalCompared: correlations.length,
        highlyCorrelated: highlyCorrelated.length,
        inverselyCorrelated: inverselyCorrelated.length,
        uncorrelated: uncorrelated.length,
        bestHedge: inverselyCorrelated[0]?.symbol || null,
        mostSimilar: highlyCorrelated[0]?.symbol || null
      },
      insights: [
        highlyCorrelated.length > 0 
          ? `${targetSymbol} moves closely with ${highlyCorrelated.map(c => c.symbol).slice(0, 3).join(', ')}`
          : `${targetSymbol} has no highly correlated peers in this set`,
        inverselyCorrelated.length > 0
          ? `Consider ${inverselyCorrelated[0].symbol} as a hedge (${inverselyCorrelated[0].correlation.toFixed(2)} correlation)`
          : `No strong inverse correlations found for hedging`,
        uncorrelated.length > 0
          ? `${uncorrelated.slice(0, 3).map(c => c.symbol).join(', ')} offer diversification benefits`
          : `Most stocks show some correlation with ${targetSymbol}`
      ],
      categories: {
        highlyCorrelated: highlyCorrelated.slice(0, 5),
        inverselyCorrelated: inverselyCorrelated.slice(0, 5),
        uncorrelated: uncorrelated.slice(0, 5)
      },
      sectorAnalysis: sectorCorrelations,
      allCorrelations: correlations.slice(0, limit),
      tradingIdeas: [
        highlyCorrelated.length >= 2 ? {
          type: 'Pairs Trade',
          description: `${targetSymbol} and ${highlyCorrelated[0]?.symbol} are highly correlated. Trade the spread when it diverges.`,
          stocks: [targetSymbol, highlyCorrelated[0]?.symbol]
        } : null,
        inverselyCorrelated.length > 0 ? {
          type: 'Portfolio Hedge',
          description: `Add ${inverselyCorrelated[0]?.symbol} to hedge ${targetSymbol} exposure.`,
          stocks: [targetSymbol, inverselyCorrelated[0]?.symbol]
        } : null
      ].filter(Boolean)
    });
    
  } catch (error) {
    console.error('Correlations API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate correlations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
