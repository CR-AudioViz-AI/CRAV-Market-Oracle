/**
 * Data Aggregator for Market Oracle
 * 
 * Combines data from multiple sources into a unified knowledge base:
 * - Alpha Vantage: Stock prices, technical indicators, company fundamentals
 * - CoinGecko: Cryptocurrency prices, market data, trends
 * - NewsAPI: Market news, sentiment, trending topics
 * 
 * Features:
 * - Unified data model across all sources
 * - Intelligent caching to respect API rate limits
 * - Real-time data freshness tracking
 * - Automatic data enrichment and cross-referencing
 * - Knowledge base updates for Javari AI learning
 * 
 * Usage:
 * ```typescript
 * const aggregator = getDataAggregator();
 * const stockData = await aggregator.getStockIntelligence('AAPL');
 * const cryptoData = await aggregator.getCryptoIntelligence('bitcoin');
 * const marketSummary = await aggregator.getMarketSummary();
 * ```
 */

import { getAlphaVantageConnector } from './connectors/alpha-vantage';
import { getCoinGeckoConnector } from './connectors/coingecko';
import { getNewsAPIConnector } from './connectors/newsapi';

interface StockIntelligence {
  symbol: string;
  name: string;
  price: {
    current: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
  };
  technicals: {
    rsi?: number;
    macd?: any;
    sma?: number;
    ema?: number;
  };
  fundamentals?: {
    marketCap?: string;
    peRatio?: string;
    eps?: string;
    dividendYield?: string;
    beta?: string;
  };
  news: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
    sentiment: string;
    sentimentScore: number;
  }>;
  lastUpdated: string;
  dataQuality: number; // 0-100 score
}

interface CryptoIntelligence {
  id: string;
  symbol: string;
  name: string;
  price: {
    current: number;
    change24h: number;
    changePercent24h: number;
    high24h: number;
    low24h: number;
    marketCap: number;
    volume: number;
    marketCapRank: number;
  };
  technicals: {
    ath: number;
    athDate: string;
    atl: number;
    atlDate: string;
  };
  market: {
    totalSupply?: number;
    circulatingSupply: number;
    maxSupply?: number;
  };
  news: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
    sentiment?: string;
  }>;
  trending: boolean;
  trendingScore?: number;
  lastUpdated: string;
  dataQuality: number;
}

interface MarketSummary {
  stocks: {
    topGainers: Array<{ symbol: string; change: number }>;
    topLosers: Array<{ symbol: string; change: number }>;
    mostActive: Array<{ symbol: string; volume: number }>;
  };
  crypto: {
    topGainers: Array<{ symbol: string; change: number }>;
    topLosers: Array<{ symbol: string; change: number }>;
    trending: Array<{ symbol: string; score: number }>;
  };
  news: {
    topStories: Array<{ title: string; url: string; sentiment: string }>;
    trendingTopics: Array<{ topic: string; count: number }>;
  };
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  lastUpdated: string;
}

interface KnowledgeUpdate {
  timestamp: string;
  source: 'stocks' | 'crypto' | 'news';
  type: 'price' | 'technical' | 'fundamental' | 'news' | 'sentiment';
  data: any;
  metadata: {
    symbol?: string;
    confidence: number;
    freshness: number; // 0-100, how recent is the data
  };
}

export class DataAggregator {
  private alphaVantage = getAlphaVantageConnector();
  private coinGecko = getCoinGeckoConnector();
  private newsAPI = getNewsAPIConnector();
  
  // In-memory cache with timestamps
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Cache TTLs (in milliseconds)
  private readonly CACHE_TTL = {
    QUOTE: 60 * 1000, // 1 minute for real-time quotes
    TECHNICAL: 5 * 60 * 1000, // 5 minutes for technical indicators
    FUNDAMENTAL: 24 * 60 * 60 * 1000, // 24 hours for fundamentals
    NEWS: 15 * 60 * 1000, // 15 minutes for news
    CRYPTO: 60 * 1000, // 1 minute for crypto prices
    MARKET_SUMMARY: 5 * 60 * 1000 // 5 minutes for market summary
  };

  /**
   * Get comprehensive stock intelligence
   */
  async getStockIntelligence(symbol: string): Promise<StockIntelligence | null> {
    const cacheKey = `stock:${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`[DataAggregator] Building intelligence for ${symbol}...`);
      
      // Fetch data from all sources in parallel
      const [quote, rsi, overview, news] = await Promise.allSettled([
        this.alphaVantage.getQuote(symbol),
        this.alphaVantage.getTechnicalIndicator(symbol, 'RSI', 'daily', 14),
        this.alphaVantage.getCompanyOverview(symbol),
        this.newsAPI.getStockNews(symbol, { pageSize: 10, days: 7 })
      ]);

      // Extract data from promises
      const quoteData = quote.status === 'fulfilled' ? quote.value : null;
      const rsiData = rsi.status === 'fulfilled' ? rsi.value : [];
      const overviewData = overview.status === 'fulfilled' ? overview.value : null;
      const newsData = news.status === 'fulfilled' ? news.value : [];

      if (!quoteData) {
        console.warn(`[DataAggregator] No quote data for ${symbol}`);
        return null;
      }

      // Build intelligence object
      const intelligence: StockIntelligence = {
        symbol: symbol,
        name: overviewData?.Name || symbol,
        price: {
          current: quoteData.price,
          change: quoteData.change,
          changePercent: quoteData.changePercent,
          open: quoteData.open,
          high: quoteData.high,
          low: quoteData.low,
          volume: quoteData.volume,
          previousClose: quoteData.previousClose
        },
        technicals: {
          rsi: rsiData[0]?.value
        },
        fundamentals: overviewData ? {
          marketCap: overviewData.MarketCapitalization,
          peRatio: overviewData.PERatio,
          eps: overviewData.EPS,
          dividendYield: overviewData.DividendYield,
          beta: overviewData.Beta
        } : undefined,
        news: newsData.map(article => ({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
          sentiment: article.sentiment || 'neutral',
          sentimentScore: article.sentimentScore || 0
        })),
        lastUpdated: new Date().toISOString(),
        dataQuality: this.calculateDataQuality({
          hasQuote: !!quoteData,
          hasTechnicals: rsiData.length > 0,
          hasFundamentals: !!overviewData,
          hasNews: newsData.length > 0
        })
      };

      // Cache the result
      this.setCache(cacheKey, intelligence, this.CACHE_TTL.QUOTE);
      
      console.log(`[DataAggregator] Intelligence built for ${symbol} (quality: ${intelligence.dataQuality}%)`);
      
      return intelligence;
    } catch (error) {
      console.error(`[DataAggregator] Error building intelligence for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive cryptocurrency intelligence
   */
  async getCryptoIntelligence(coinId: string): Promise<CryptoIntelligence | null> {
    const cacheKey = `crypto:${coinId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`[DataAggregator] Building crypto intelligence for ${coinId}...`);
      
      // Fetch data from all sources in parallel
      const [marketData, coinData, trending, news] = await Promise.allSettled([
        this.coinGecko.getMarketData('usd', [coinId]),
        this.coinGecko.getCoinData(coinId, false, false, true, false, false, false),
        this.coinGecko.getTrendingCoins(),
        this.newsAPI.getCryptoNews({ coins: [coinId], pageSize: 10 })
      ]);

      // Extract data from promises
      const market = marketData.status === 'fulfilled' ? marketData.value[0] : null;
      const details = coinData.status === 'fulfilled' ? coinData.value : null;
      const trendingList = trending.status === 'fulfilled' ? trending.value : [];
      const newsArticles = news.status === 'fulfilled' ? news.value : [];

      if (!market) {
        console.warn(`[DataAggregator] No market data for ${coinId}`);
        return null;
      }

      // Check if coin is trending
      const trendingCoin = trendingList.find(t => t.id === coinId);
      
      // Build intelligence object
      const intelligence: CryptoIntelligence = {
        id: coinId,
        symbol: market.symbol.toUpperCase(),
        name: market.name,
        price: {
          current: market.currentPrice,
          change24h: market.priceChange24h,
          changePercent24h: market.priceChangePercentage24h,
          high24h: market.high24h,
          low24h: market.low24h,
          marketCap: market.marketCap,
          volume: market.totalVolume,
          marketCapRank: market.marketCapRank
        },
        technicals: {
          ath: market.ath,
          athDate: market.athDate,
          atl: market.atl,
          atlDate: market.atlDate
        },
        market: {
          totalSupply: market.totalSupply || undefined,
          circulatingSupply: market.circulatingSupply,
          maxSupply: market.maxSupply || undefined
        },
        news: newsArticles.map(article => ({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
          sentiment: article.sentiment
        })),
        trending: !!trendingCoin,
        trendingScore: trendingCoin?.score,
        lastUpdated: new Date().toISOString(),
        dataQuality: this.calculateDataQuality({
          hasQuote: !!market,
          hasTechnicals: true,
          hasFundamentals: !!details,
          hasNews: newsArticles.length > 0
        })
      };

      // Cache the result
      this.setCache(cacheKey, intelligence, this.CACHE_TTL.CRYPTO);
      
      console.log(`[DataAggregator] Crypto intelligence built for ${coinId} (quality: ${intelligence.dataQuality}%)`);
      
      return intelligence;
    } catch (error) {
      console.error(`[DataAggregator] Error building crypto intelligence for ${coinId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive market summary
   */
  async getMarketSummary(): Promise<MarketSummary> {
    const cacheKey = 'market:summary';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('[DataAggregator] Building market summary...');
      
      // Fetch data from all sources in parallel
      const [cryptoGainers, cryptoLosers, trendingCrypto, businessNews, trendingTopics] = await Promise.allSettled([
        this.coinGecko.getTopGainers('usd', 10),
        this.coinGecko.getTopLosers('usd', 10),
        this.coinGecko.getTrendingCoins(),
        this.newsAPI.getFinancialNews('business', { pageSize: 10 }),
        this.newsAPI.getTrendingTopics(1, 3)
      ]);

      // Calculate overall market sentiment from news
      const newsArticles = businessNews.status === 'fulfilled' ? businessNews.value : [];
      const analyzedNews = this.newsAPI.analyzeSentiment(newsArticles);
      const sentiment = this.calculateMarketSentiment(analyzedNews);

      const summary: MarketSummary = {
        stocks: {
          topGainers: [],
          topLosers: [],
          mostActive: []
        },
        crypto: {
          topGainers: cryptoGainers.status === 'fulfilled' 
            ? cryptoGainers.value.slice(0, 10).map(c => ({ 
                symbol: c.symbol.toUpperCase(), 
                change: c.priceChangePercentage24h 
              }))
            : [],
          topLosers: cryptoLosers.status === 'fulfilled'
            ? cryptoLosers.value.slice(0, 10).map(c => ({ 
                symbol: c.symbol.toUpperCase(), 
                change: c.priceChangePercentage24h 
              }))
            : [],
          trending: trendingCrypto.status === 'fulfilled'
            ? trendingCrypto.value.slice(0, 10).map(c => ({ 
                symbol: c.symbol.toUpperCase(), 
                score: c.score 
              }))
            : []
        },
        news: {
          topStories: analyzedNews.slice(0, 10).map(article => ({
            title: article.title,
            url: article.url,
            sentiment: article.sentiment || 'neutral'
          })),
          trendingTopics: trendingTopics.status === 'fulfilled'
            ? trendingTopics.value.slice(0, 10)
            : []
        },
        sentiment: sentiment,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.setCache(cacheKey, summary, this.CACHE_TTL.MARKET_SUMMARY);
      
      console.log(`[DataAggregator] Market summary built (sentiment: ${sentiment.overall})`);
      
      return summary;
    } catch (error) {
      console.error('[DataAggregator] Error building market summary:', error);
      throw error;
    }
  }

  /**
   * Generate knowledge updates for Javari AI
   */
  async generateKnowledgeUpdates(
    symbols: string[],
    cryptos: string[]
  ): Promise<KnowledgeUpdate[]> {
    const updates: KnowledgeUpdate[] = [];

    try {
      console.log(`[DataAggregator] Generating knowledge updates for ${symbols.length} stocks and ${cryptos.length} cryptos...`);
      
      // Process stocks
      for (const symbol of symbols) {
        const intelligence = await this.getStockIntelligence(symbol);
        
        if (intelligence) {
          updates.push({
            timestamp: new Date().toISOString(),
            source: 'stocks',
            type: 'price',
            data: intelligence.price,
            metadata: {
              symbol: symbol,
              confidence: intelligence.dataQuality,
              freshness: 100 // Real-time data
            }
          });

          if (intelligence.news.length > 0) {
            updates.push({
              timestamp: new Date().toISOString(),
              source: 'stocks',
              type: 'sentiment',
              data: intelligence.news,
              metadata: {
                symbol: symbol,
                confidence: 75,
                freshness: 90
              }
            });
          }
        }
      }

      // Process cryptos
      for (const coinId of cryptos) {
        const intelligence = await this.getCryptoIntelligence(coinId);
        
        if (intelligence) {
          updates.push({
            timestamp: new Date().toISOString(),
            source: 'crypto',
            type: 'price',
            data: intelligence.price,
            metadata: {
              symbol: intelligence.symbol,
              confidence: intelligence.dataQuality,
              freshness: 100
            }
          });
        }
      }

      console.log(`[DataAggregator] Generated ${updates.length} knowledge updates`);
      
      return updates;
    } catch (error) {
      console.error('[DataAggregator] Error generating knowledge updates:', error);
      return updates;
    }
  }

  /**
   * Get usage statistics across all APIs
   */
  getUsageStats() {
    return {
      alphaVantage: this.alphaVantage.getUsageStats(),
      coinGecko: this.coinGecko.getUsageStats(),
      newsAPI: this.newsAPI.getUsageStats()
    };
  }

  /**
   * Calculate data quality score (0-100)
   */
  private calculateDataQuality(checks: Record<string, boolean>): number {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(v => v).length;
    return Math.round((passed / total) * 100);
  }

  /**
   * Calculate market sentiment from news
   */
  private calculateMarketSentiment(
    articles: Array<{ sentiment?: string; sentimentScore?: number }>
  ): { overall: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
    if (articles.length === 0) {
      return { overall: 'neutral', confidence: 0 };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    articles.forEach(article => {
      if (article.sentiment === 'positive') positiveCount++;
      else if (article.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    });

    const total = articles.length;
    const positiveRatio = positiveCount / total;
    const negativeRatio = negativeCount / total;

    let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0;

    if (positiveRatio > 0.6) {
      overall = 'bullish';
      confidence = Math.round(positiveRatio * 100);
    } else if (negativeRatio > 0.6) {
      overall = 'bearish';
      confidence = Math.round(negativeRatio * 100);
    } else {
      overall = 'neutral';
      confidence = 50;
    }

    return { overall, confidence };
  }

  /**
   * Get data from cache if fresh
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    const freshness = 100 - ((age / cached.ttl) * 100);
    console.log(`[DataAggregator] Cache HIT: ${key} (${Math.round(freshness)}% fresh)`);
    
    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[DataAggregator] Cache cleared');
  }
}

// Export singleton instance
let instance: DataAggregator | null = null;

export function getDataAggregator(): DataAggregator {
  if (!instance) {
    instance = new DataAggregator();
  }
  return instance;
}
