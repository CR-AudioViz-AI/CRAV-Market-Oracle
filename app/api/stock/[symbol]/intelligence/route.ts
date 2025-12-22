// app/api/stock/[symbol]/intelligence/route.ts
// Market Oracle - Comprehensive Stock Intelligence API
// Created: December 22, 2025
// Complete stock analysis with technical indicators, sentiment, and risk assessment

import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveMarketIntelligence } from '@/lib/connectors/market-intelligence';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// ============================================================================
// FINNHUB API HELPERS
// ============================================================================

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function fetchFinnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set('token', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getQuote(symbol: string) {
  const quote = await fetchFinnhub<{
    c: number; h: number; l: number; o: number; pc: number; d: number; dp: number; t: number;
  }>('/quote', { symbol });
  
  if (!quote || quote.c === 0) return null;
  return {
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
  };
}

async function getCompanyProfile(symbol: string) {
  const profile = await fetchFinnhub<{
    name: string;
    finnhubIndustry: string;
    marketCapitalization: number;
    logo: string;
    weburl: string;
    exchange: string;
    country: string;
    ipo: string;
    shareOutstanding: number;
  }>('/stock/profile2', { symbol });
  
  if (!profile?.name) return null;
  return {
    name: profile.name,
    industry: profile.finnhubIndustry,
    marketCap: profile.marketCapitalization * 1000000,
    logo: profile.logo,
    website: profile.weburl,
    exchange: profile.exchange,
    country: profile.country,
    ipo: profile.ipo,
    sharesOutstanding: profile.shareOutstanding * 1000000,
  };
}

async function getInsiderTransactions(symbol: string) {
  const data = await fetchFinnhub<{ data: Array<{
    name: string; share: number; change: number; transactionDate: string;
    filingDate: string; transactionCode: string; transactionPrice: number;
  }> }>('/stock/insider-transactions', { symbol });

  if (!data?.data) return { transactions: [], summary: { signal: 'NEUTRAL', netBuying: false } };

  const transactions = data.data.slice(0, 10).map(t => ({
    name: t.name,
    shares: Math.abs(t.share),
    type: t.transactionCode === 'P' ? 'BUY' : t.transactionCode === 'S' ? 'SELL' : 'OTHER',
    date: t.transactionDate,
    price: t.transactionPrice,
  }));

  const buys = transactions.filter(t => t.type === 'BUY').length;
  const sells = transactions.filter(t => t.type === 'SELL').length;

  return {
    transactions,
    summary: {
      signal: buys > sells ? 'BULLISH' : sells > buys ? 'BEARISH' : 'NEUTRAL',
      netBuying: buys > sells,
    },
  };
}

async function getSocialSentiment(symbol: string) {
  const data = await fetchFinnhub<{
    reddit: Array<{ mention: number; score: number }>;
    twitter: Array<{ mention: number; score: number }>;
  }>('/stock/social-sentiment', { symbol });

  const redditScore = data?.reddit?.slice(-1)[0]?.score || 0;
  const twitterScore = data?.twitter?.slice(-1)[0]?.score || 0;
  const overallScore = (redditScore + twitterScore) / 2;
  const redditMentions = data?.reddit?.slice(-1)[0]?.mention || 0;
  const twitterMentions = data?.twitter?.slice(-1)[0]?.mention || 0;

  return {
    overallScore,
    overallSentiment: overallScore > 0.2 ? 'BULLISH' : overallScore < -0.2 ? 'BEARISH' : 'NEUTRAL',
    reddit: { score: redditScore, mentions: redditMentions },
    twitter: { score: twitterScore, mentions: twitterMentions },
    trending: (redditMentions + twitterMentions) > 100,
  };
}

async function getAnalystRecommendations(symbol: string) {
  const data = await fetchFinnhub<Array<{
    strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; period: string;
  }>>('/stock/recommendation', { symbol });

  if (!data?.[0]) return null;

  const latest = data[0];
  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  if (total === 0) return null;

  const score = (
    (latest.strongBuy * 5) + (latest.buy * 4) + (latest.hold * 3) +
    (latest.sell * 2) + (latest.strongSell * 1)
  ) / total;

  let consensus: string;
  if (score >= 4.5) consensus = 'STRONG_BUY';
  else if (score >= 3.5) consensus = 'BUY';
  else if (score >= 2.5) consensus = 'HOLD';
  else if (score >= 1.5) consensus = 'SELL';
  else consensus = 'STRONG_SELL';

  return {
    consensus,
    score: Math.round(score * 10) / 10,
    totalAnalysts: total,
    distribution: {
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
    },
  };
}

async function getCompanyNews(symbol: string) {
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = today.toISOString().split('T')[0];

  const data = await fetchFinnhub<Array<{
    headline: string; summary: string; source: string; url: string; datetime: number;
  }>>('/company-news', { symbol, from, to });

  return (data || []).slice(0, 10).map(n => ({
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    datetime: new Date(n.datetime * 1000).toISOString(),
  }));
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    // Fetch from all sources in parallel
    const [marketIntel, quote, profile, insiders, sentiment, analysts, news] = await Promise.all([
      getComprehensiveMarketIntelligence(symbol).catch(() => null),
      getQuote(symbol),
      getCompanyProfile(symbol),
      getInsiderTransactions(symbol),
      getSocialSentiment(symbol),
      getAnalystRecommendations(symbol),
      getCompanyNews(symbol),
    ]);

    if (!marketIntel && !quote) {
      return NextResponse.json(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Build response
    const response = {
      symbol,
      timestamp: new Date().toISOString(),

      profile: profile ? {
        ...profile,
        sector: marketIntel?.sector || null,
      } : null,

      price: marketIntel?.price || (quote ? {
        current: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        previousClose: quote.previousClose,
        volume: 0,
        avgVolume: 0,
      } : null),

      technicals: marketIntel?.technicals ? {
        rsi: marketIntel.technicals.rsi || null,
        rsiSignal: marketIntel.technicals.rsi 
          ? (marketIntel.technicals.rsi < 30 ? 'OVERSOLD' 
             : marketIntel.technicals.rsi > 70 ? 'OVERBOUGHT' 
             : 'NEUTRAL')
          : 'NEUTRAL',
        macd: marketIntel.technicals.macd ? {
          ...marketIntel.technicals.macd,
          trend: marketIntel.technicals.macd.histogram > 0 ? 'BULLISH' 
                 : marketIntel.technicals.macd.histogram < 0 ? 'BEARISH' 
                 : 'NEUTRAL',
        } : null,
        movingAverages: {
          sma50: marketIntel.technicals.sma50 || null,
          sma200: marketIntel.technicals.sma200 || null,
          priceVsSma50: (marketIntel.price?.current || 0) > (marketIntel.technicals.sma50 || 0) ? 'ABOVE' : 'BELOW',
          priceVsSma200: (marketIntel.price?.current || 0) > (marketIntel.technicals.sma200 || 0) ? 'ABOVE' : 'BELOW',
          goldenCross: (marketIntel.technicals.sma50 || 0) > (marketIntel.technicals.sma200 || 0),
          deathCross: (marketIntel.technicals.sma50 || 0) < (marketIntel.technicals.sma200 || 0),
        },
        bollingerBands: marketIntel.technicals.bollingerBands || null,
      } : {
        rsi: null,
        rsiSignal: 'NEUTRAL',
        macd: null,
        movingAverages: {
          sma50: null,
          sma200: null,
          priceVsSma50: 'BELOW',
          priceVsSma200: 'BELOW',
          goldenCross: false,
          deathCross: false,
        },
        bollingerBands: null,
      },

      sentiment: {
        overall: marketIntel?.sentiment?.overall || sentiment?.overallSentiment || 'NEUTRAL',
        score: marketIntel?.sentiment?.score || sentiment?.overallScore || 0,
        news: {
          count: marketIntel?.sentiment?.newsCount || news.length,
          positive: marketIntel?.sentiment?.positiveNews || 0,
          negative: marketIntel?.sentiment?.negativeNews || 0,
        },
        social: {
          reddit: sentiment?.reddit.score || 0,
          twitter: sentiment?.twitter.score || 0,
          trending: sentiment?.trending || false,
        },
        insiders: {
          signal: insiders.summary.signal,
          netBuying: insiders.summary.netBuying,
          recentTransactions: insiders.transactions.length,
        },
        analysts: analysts,
      },

      risk: marketIntel?.risk || {
        score: 50,
        level: 'MODERATE',
        factors: {
          volatility: 50,
          liquidity: 50,
          marketCap: profile ? (profile.marketCap > 10e9 ? 20 : profile.marketCap > 2e9 ? 40 : 70) : 50,
          newsVolatility: 50,
          technicalRisk: 50,
        },
        warnings: [],
      },

      yearRange: marketIntel?.yearRange || {
        high: 0,
        low: 0,
        percentFromHigh: 0,
        percentFromLow: 0,
      },

      news: news.map(n => ({
        ...n,
        sentiment: 'neutral' as const,
      })),

      insiderTransactions: insiders.transactions,

      dataQuality: {
        score: marketIntel ? 85 : 60,
        sources: [
          ...(marketIntel ? ['Alpha Vantage', 'Twelve Data'] : []),
          'Finnhub',
        ],
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Stock intelligence API error for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock intelligence' },
      { status: 500 }
    );
  }
}
