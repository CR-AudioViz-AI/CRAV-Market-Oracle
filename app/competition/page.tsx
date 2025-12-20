'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy, TrendingUp, TrendingDown, Medal, Crown,
  Zap, Bitcoin, BarChart3, Target, Flame, Star,
  ArrowUpRight, ArrowDownRight, RefreshCw, Award
} from 'lucide-react';
import { 
  getCompetitionLeaderboard, getAIStatistics, getOverallStats,
  type CompetitionLeaderboard, type AIStatistics, type OverallStats, AI_MODELS 
} from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

export default function CompetitionPage() {
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboard[]>([]);
  const [stockStats, setStockStats] = useState<AIStatistics[]>([]);
  const [pennyStats, setPennyStats] = useState<AIStatistics[]>([]);
  const [cryptoStats, setCryptoStats] = useState<AIStatistics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'stocks' | 'penny' | 'crypto'>('overall');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [lb, stocks, penny, crypto, overall] = await Promise.all([
        getCompetitionLeaderboard(),
        getAIStatistics('stock'),
        getAIStatistics('penny_stock'),
        getAIStatistics('crypto'),
        getOverallStats()
      ]);
      setLeaderboard(lb);
      setStockStats(stocks);
      setPennyStats(penny);
      setCryptoStats(crypto);
      setOverallStats(overall);
    } catch (error) {
      console.error('Error loading competition data:', error);
    }
    setLoading(false);
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankBorder = (rank: number) => {
    switch (rank) {
      case 1: return 'border-yellow-500/50 ring-2 ring-yellow-500/20 bg-yellow-500/5';
      case 2: return 'border-gray-400/50 ring-1 ring-gray-400/20 bg-gray-400/5';
      case 3: return 'border-amber-600/50 ring-1 ring-amber-600/20 bg-amber-600/5';
      default: return 'border-gray-700/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading competition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-gray-950" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
              AI Competition
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Watch AI models battle across Stocks, Penny Stocks, and Crypto
            </p>
            <JavariHelpButton topic="AI Competition" className="mt-4" />
          </div>
          
          {/* Overall Stats Banner */}
          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-gray-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">{overallStats.totalPicks}</div>
                <div className="text-sm text-gray-400">Total Picks</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur border border-green-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{overallStats.winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Overall Win Rate</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur border border-yellow-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{overallStats.topAI}</div>
                <div className="text-sm text-gray-400">Top Performer</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur border border-purple-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{overallStats.activePicks}</div>
                <div className="text-sm text-gray-400">Active Picks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'overall', label: 'Overall', icon: Trophy, color: 'cyan' },
            { id: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'green' },
            { id: 'penny', label: 'Penny Stocks', icon: Zap, color: 'yellow' },
            { id: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'purple' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                selectedCategory === cat.id
                  ? `bg-${cat.color}-500 text-white shadow-lg shadow-${cat.color}-500/25`
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              style={selectedCategory === cat.id ? {
                backgroundColor: cat.color === 'cyan' ? '#06b6d4' : 
                                 cat.color === 'green' ? '#10b981' :
                                 cat.color === 'yellow' ? '#f59e0b' : '#8b5cf6'
              } : {}}
            >
              <cat.icon className="w-5 h-5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory === 'overall' ? 'Overall Leaderboard' :
             selectedCategory === 'stocks' ? 'Stock Picks Leaderboard' :
             selectedCategory === 'penny' ? 'Penny Stock Leaderboard' :
             'Crypto Leaderboard'}
          </h2>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Podium for Top 3 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-8">
            {leaderboard[1] && (
              <LeaderboardCard 
                entry={leaderboard[1]} 
                rank={2} 
                category={selectedCategory}
                stockStats={stockStats}
                pennyStats={pennyStats}
                cryptoStats={cryptoStats}
              />
            )}
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            {leaderboard[0] && (
              <LeaderboardCard 
                entry={leaderboard[0]} 
                rank={1} 
                category={selectedCategory}
                stockStats={stockStats}
                pennyStats={pennyStats}
                cryptoStats={cryptoStats}
                featured
              />
            )}
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-12">
            {leaderboard[2] && (
              <LeaderboardCard 
                entry={leaderboard[2]} 
                rank={3} 
                category={selectedCategory}
                stockStats={stockStats}
                pennyStats={pennyStats}
                cryptoStats={cryptoStats}
              />
            )}
          </div>
        </div>

        {/* Rest of Leaderboard */}
        {leaderboard.slice(3).map((entry, index) => (
          <div
            key={entry.aiModelId}
            className={`bg-gray-900/50 backdrop-blur border rounded-xl p-4 mb-3 ${getRankBorder(index + 4)}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 text-center">
                {getRankIcon(index + 4)}
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: entry.color + '20', color: entry.color }}
              >
                {entry.displayName.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{entry.displayName}</div>
                <div className="text-sm text-gray-400">
                  {entry.totalPoints.toFixed(0)} points
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-semibold">{entry.stockPoints.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Stocks</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold">{entry.pennyStockPoints.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Penny</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">{entry.cryptoPoints.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Crypto</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Links */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Explore Markets</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/hot-picks" className="group">
            <div className="bg-gradient-to-br from-green-900/20 to-green-950/50 border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all">
              <TrendingUp className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">Hot Stocks</h3>
              <p className="text-gray-400 text-sm">Blue chip and mid-cap stock picks from our AI models.</p>
              <div className="mt-4 text-green-400 text-sm flex items-center gap-1">
                View Picks <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
          
          <Link href="/penny-stocks" className="group">
            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/50 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-all">
              <Zap className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">Penny Stocks</h3>
              <p className="text-gray-400 text-sm">High-risk, high-reward penny stock picks under $5.</p>
              <div className="mt-4 text-yellow-400 text-sm flex items-center gap-1">
                View Picks <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
          
          <Link href="/crypto" className="group">
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/50 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
              <Bitcoin className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Crypto</h3>
              <p className="text-gray-400 text-sm">AI-powered cryptocurrency predictions and analysis.</p>
              <div className="mt-4 text-purple-400 text-sm flex items-center gap-1">
                View Picks <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ 
  entry, 
  rank, 
  category,
  stockStats,
  pennyStats,
  cryptoStats,
  featured 
}: { 
  entry: CompetitionLeaderboard; 
  rank: number;
  category: string;
  stockStats: AIStatistics[];
  pennyStats: AIStatistics[];
  cryptoStats: AIStatistics[];
  featured?: boolean;
}) {
  const getStats = () => {
    switch (category) {
      case 'stocks': return stockStats.find(s => s.aiModelId === entry.aiModelId);
      case 'penny': return pennyStats.find(s => s.aiModelId === entry.aiModelId);
      case 'crypto': return cryptoStats.find(s => s.aiModelId === entry.aiModelId);
      default: return null;
    }
  };
  
  const categoryStats = getStats();
  
  const getRankGradient = () => {
    switch (rank) {
      case 1: return 'from-yellow-500 to-amber-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-amber-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className={`w-full bg-gray-900/50 backdrop-blur border rounded-2xl p-6 ${
      rank === 1 ? 'border-yellow-500/50 ring-2 ring-yellow-500/20' :
      rank === 2 ? 'border-gray-400/50' :
      'border-amber-600/50'
    } ${featured ? 'transform scale-105' : ''}`}>
      {/* Rank Badge */}
      <div className={`mx-auto w-14 h-14 rounded-full bg-gradient-to-br ${getRankGradient()} flex items-center justify-center mb-4 ${featured ? 'ring-4 ring-yellow-500/30' : ''}`}>
        {rank === 1 ? (
          <Crown className="w-7 h-7 text-white" />
        ) : (
          <span className="text-2xl font-bold text-white">{rank}</span>
        )}
      </div>
      
      {/* AI Info */}
      <div 
        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl mb-3"
        style={{ backgroundColor: entry.color + '20', color: entry.color }}
      >
        {entry.displayName.slice(0, 2)}
      </div>
      <h3 className="text-xl font-bold text-center mb-2">{entry.displayName}</h3>
      
      {/* Points */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-cyan-400">
          {category === 'overall' ? entry.totalPoints.toFixed(0) :
           category === 'stocks' ? entry.stockPoints.toFixed(0) :
           category === 'penny' ? entry.pennyStockPoints.toFixed(0) :
           entry.cryptoPoints.toFixed(0)}
        </div>
        <div className="text-sm text-gray-400">points</div>
      </div>
      
      {/* Category Stats */}
      {categoryStats ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Win Rate</span>
            <span className={categoryStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
              {categoryStats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Return</span>
            <span className={categoryStats.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
              {categoryStats.avgReturn >= 0 ? '+' : ''}{categoryStats.avgReturn.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Picks</span>
            <span>{categoryStats.totalPicks}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-green-400 font-semibold">{entry.stockPoints.toFixed(0)}</div>
            <div className="text-gray-500">Stocks</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold">{entry.pennyStockPoints.toFixed(0)}</div>
            <div className="text-gray-500">Penny</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-semibold">{entry.cryptoPoints.toFixed(0)}</div>
            <div className="text-gray-500">Crypto</div>
          </div>
        </div>
      )}
      
      {/* Streak */}
      {entry.streak > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-400">{entry.streak} win streak</span>
        </div>
      )}
    </div>
  );
}
