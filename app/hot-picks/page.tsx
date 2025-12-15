// app/hot-picks/page.tsx
// Hot Picks - Shows high-consensus stock picks with links to detail pages

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, TrendingUp, TrendingDown, RefreshCw,
  Target, Brain, Zap, Sparkles, Bot, Clock,
  ChevronRight, MinusCircle, ExternalLink
} from 'lucide-react';

interface Pick {
  id: string;
  ai_model: string;
  symbol: string;
  company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  created_at: string;
  status: string;
}

interface HotPick {
  symbol: string;
  companyName: string;
  sector: string;
  consensusDirection: 'UP' | 'DOWN' | 'HOLD';
  avgConfidence: number;
  aiCount: number;
  picks: Pick[];
  latestPick: Pick;
}

const AI_ICONS: Record<string, { icon: JSX.Element; color: string }> = {
  gpt4: { icon: <Brain className="w-4 h-4" />, color: 'emerald' },
  claude: { icon: <Bot className="w-4 h-4" />, color: 'purple' },
  gemini: { icon: <Sparkles className="w-4 h-4" />, color: 'blue' },
  perplexity: { icon: <Zap className="w-4 h-4" />, color: 'cyan' },
};

export default function HotPicksPage() {
  const [hotPicks, setHotPicks] = useState<HotPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'UP' | 'DOWN'>('all');

  useEffect(() => {
    fetchPicks();
  }, []);

  const fetchPicks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-picks/generate?limit=100');
      const data = await res.json();

      if (data.success && data.picks) {
        // Group by symbol
        const bySymbol: Record<string, Pick[]> = {};
        for (const pick of data.picks) {
          if (!bySymbol[pick.symbol]) {
            bySymbol[pick.symbol] = [];
          }
          bySymbol[pick.symbol].push(pick);
        }

        // Calculate consensus for each symbol
        const hotPicksList: HotPick[] = [];
        for (const [symbol, picks] of Object.entries(bySymbol)) {
          // Get latest pick from each AI
          const latestByAI: Record<string, Pick> = {};
          for (const pick of picks) {
            if (!latestByAI[pick.ai_model] || 
                new Date(pick.created_at) > new Date(latestByAI[pick.ai_model].created_at)) {
              latestByAI[pick.ai_model] = pick;
            }
          }
          
          const latestPicks = Object.values(latestByAI);
          if (latestPicks.length < 2) continue; // Need at least 2 AI opinions

          // Count directions
          const dirCounts: Record<string, number> = { UP: 0, DOWN: 0, HOLD: 0 };
          let totalConfidence = 0;
          for (const pick of latestPicks) {
            dirCounts[pick.direction]++;
            totalConfidence += pick.confidence;
          }

          // Get consensus direction
          const consensusDirection = Object.entries(dirCounts)
            .sort((a, b) => b[1] - a[1])[0][0] as 'UP' | 'DOWN' | 'HOLD';

          // Only include if majority agrees
          const agreementRatio = dirCounts[consensusDirection] / latestPicks.length;
          if (agreementRatio < 0.5) continue;

          const latestPick = latestPicks.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          hotPicksList.push({
            symbol,
            companyName: latestPick.company_name || symbol,
            sector: latestPick.sector || 'Unknown',
            consensusDirection,
            avgConfidence: totalConfidence / latestPicks.length,
            aiCount: latestPicks.length,
            picks: latestPicks,
            latestPick,
          });
        }

        // Sort by confidence
        hotPicksList.sort((a, b) => b.avgConfidence - a.avgConfidence);
        setHotPicks(hotPicksList);
      }
    } catch (err) {
      console.error('Failed to fetch picks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPicks = filter === 'all' 
    ? hotPicks 
    : hotPicks.filter(p => p.consensusDirection === filter);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hot Picks</h1>
              <p className="text-gray-400">High-consensus opportunities from multiple AIs</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['all', 'UP', 'DOWN'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f 
                      ? 'bg-amber-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <button
              onClick={fetchPicks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading hot picks...</p>
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <Flame className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Hot Picks Right Now</h3>
            <p className="text-gray-400 mb-6">
              Hot picks appear when multiple AIs agree on a direction. Try analyzing some stocks first!
            </p>
            <Link
              href="/ai-picks"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Analyze Stocks <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPicks.map((pick) => (
              <Link
                key={pick.symbol}
                href={`/stock/${pick.symbol}`}
                className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/50 rounded-xl p-6 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Direction Badge */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      pick.consensusDirection === 'UP' 
                        ? 'bg-emerald-500/20' 
                        : pick.consensusDirection === 'DOWN'
                        ? 'bg-red-500/20'
                        : 'bg-yellow-500/20'
                    }`}>
                      {pick.consensusDirection === 'UP' && (
                        <TrendingUp className="w-7 h-7 text-emerald-400" />
                      )}
                      {pick.consensusDirection === 'DOWN' && (
                        <TrendingDown className="w-7 h-7 text-red-400" />
                      )}
                      {pick.consensusDirection === 'HOLD' && (
                        <MinusCircle className="w-7 h-7 text-yellow-400" />
                      )}
                    </div>

                    {/* Stock Info */}
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition">
                        {pick.symbol}
                        <ExternalLink className="w-4 h-4 inline ml-2 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-gray-400">{pick.companyName}</p>
                      <p className="text-gray-500 text-sm">{pick.sector}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    {/* AI Agreement */}
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">AI Agreement</p>
                      <p className="text-xl font-bold text-white">{pick.aiCount}/4</p>
                      <div className="flex gap-1 mt-1 justify-center">
                        {pick.picks.map((p, i) => {
                          const ai = AI_ICONS[p.ai_model];
                          return (
                            <div 
                              key={i}
                              className={`w-6 h-6 rounded-full bg-${ai?.color || 'gray'}-500/20 flex items-center justify-center text-${ai?.color || 'gray'}-400`}
                              title={p.ai_model}
                            >
                              {ai?.icon || <Bot className="w-3 h-3" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Avg Confidence</p>
                      <p className="text-2xl font-bold text-amber-400">{pick.avgConfidence.toFixed(0)}%</p>
                    </div>

                    {/* Target */}
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Target</p>
                      <p className="text-xl font-bold text-emerald-400">
                        ${pick.latestPick.target_price?.toFixed(2) || 'N/A'}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-amber-400 transition" />
                  </div>
                </div>

                {/* Thesis Preview */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {pick.latestPick.thesis}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
