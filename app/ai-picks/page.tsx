'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, Minus, RefreshCw, 
  Target, Shield, Zap, BarChart3, Clock, Award,
  ChevronDown, ChevronUp, Sparkles, AlertCircle
} from 'lucide-react';

// Types
interface AIPick {
  id: string;
  ai_model: string;
  symbol: string;
  company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  full_reasoning: string;
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  status: string;
  actual_return?: number;
  created_at: string;
}

interface ConsensusData {
  symbol: string;
  consensusDirection: string;
  consensusStrength: number;
  weightedConfidence: number;
  javariConfidence: number;
  javariReasoning: string;
  aiPicks: { aiModel: string; direction: string; confidence: number }[];
}

interface AIPerformance {
  model: string;
  wins: number;
  losses: number;
  winRate: number;
  avgConfidence: number;
}

// AI Model Colors & Config
const AI_CONFIG: Record<string, { color: string; gradient: string; name: string }> = {
  gpt4: { 
    color: '#10B981', 
    gradient: 'from-emerald-500 to-teal-600',
    name: 'GPT-4' 
  },
  perplexity: { 
    color: '#8B5CF6', 
    gradient: 'from-violet-500 to-purple-600',
    name: 'Perplexity' 
  },
  claude: { 
    color: '#F59E0B', 
    gradient: 'from-amber-500 to-orange-600',
    name: 'Claude' 
  },
  gemini: { 
    color: '#3B82F6', 
    gradient: 'from-blue-500 to-indigo-600',
    name: 'Gemini' 
  },
};

// Direction Badge Component
function DirectionBadge({ direction, size = 'md' }: { direction: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    UP: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    DOWN: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    HOLD: { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  };
  const { icon: Icon, color, bg, border } = config[direction as keyof typeof config] || config.HOLD;
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm', lg: 'px-4 py-1.5 text-base' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizes[size]} ${bg} ${color} ${border} border rounded-full font-semibold`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {direction}
    </span>
  );
}

// Confidence Meter Component
function ConfidenceMeter({ value, label }: { value: number; label?: string }) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColor(value)} transition-all duration-500`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm font-mono text-gray-300 w-12 text-right">{value.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// AI Pick Card Component
function PickCard({ pick, expanded, onToggle }: { pick: AIPick; expanded: boolean; onToggle: () => void }) {
  const aiConfig = AI_CONFIG[pick.ai_model] || AI_CONFIG.gpt4;
  const isResolved = pick.status !== 'PENDING';
  
  return (
    <div className={`bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-600 ${expanded ? 'ring-1 ring-gray-600' : ''}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Symbol & AI */}
          <div className="flex items-center gap-3">
            <div 
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${aiConfig.gradient} flex items-center justify-center shadow-lg`}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{pick.symbol}</h3>
                <DirectionBadge direction={pick.direction} />
              </div>
              <p className="text-sm text-gray-400">{aiConfig.name} • {pick.timeframe}</p>
            </div>
          </div>
          
          {/* Right: Confidence & Status */}
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{pick.confidence}%</div>
            <div className="text-xs text-gray-500">confidence</div>
            {isResolved && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                pick.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 
                pick.status === 'LOSS' ? 'bg-red-500/20 text-red-400' : 
                'bg-gray-500/20 text-gray-400'
              }`}>
                {pick.status} {pick.actual_return ? `(${pick.actual_return > 0 ? '+' : ''}${pick.actual_return.toFixed(1)}%)` : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Price Targets */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Entry</div>
            <div className="text-sm font-semibold text-gray-300">${pick.entry_price?.toFixed(2)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
            <div className="text-xs text-emerald-400 mb-1">Target</div>
            <div className="text-sm font-semibold text-emerald-300">${pick.target_price?.toFixed(2)}</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
            <div className="text-xs text-red-400 mb-1">Stop Loss</div>
            <div className="text-sm font-semibold text-red-300">${pick.stop_loss?.toFixed(2)}</div>
          </div>
        </div>
        
        {/* Thesis Preview */}
        <p className="mt-3 text-sm text-gray-400 line-clamp-2">{pick.thesis}</p>
        
        {/* Expand Toggle */}
        <div className="flex justify-center mt-2">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700/50 pt-4 space-y-4">
          {/* Full Reasoning */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Full Analysis
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">{pick.full_reasoning}</p>
          </div>
          
          {/* Bullish/Bearish Factors */}
          <div className="grid md:grid-cols-2 gap-4">
            {pick.key_bullish_factors?.length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Bullish Factors
                </h4>
                <ul className="space-y-1">
                  {pick.key_bullish_factors.map((factor, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {pick.key_bearish_factors?.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Bearish Factors
                </h4>
                <ul className="space-y-1">
                  {pick.key_bearish_factors.map((factor, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Risks & Catalysts */}
          <div className="grid md:grid-cols-2 gap-4">
            {pick.risks?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> Risks
                </h4>
                <ul className="space-y-1">
                  {pick.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-gray-400">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {pick.catalysts?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Catalysts
                </h4>
                <ul className="space-y-1">
                  {pick.catalysts.map((catalyst, i) => (
                    <li key={i} className="text-xs text-gray-400">• {catalyst}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Javari Consensus Card
function ConsensusCard({ consensus }: { consensus: ConsensusData }) {
  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur border border-amber-500/30 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Javari Consensus</h3>
          <p className="text-sm text-amber-400">{consensus.symbol}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <DirectionBadge direction={consensus.consensusDirection} size="lg" />
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{consensus.javariConfidence?.toFixed(0)}%</div>
          <div className="text-xs text-gray-400">Javari Confidence</div>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <ConfidenceMeter value={consensus.consensusStrength * 100} label="Consensus Strength" />
        <ConfidenceMeter value={consensus.weightedConfidence} label="Weighted AI Confidence" />
      </div>
      
      <div className="bg-gray-900/50 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">AI Votes</h4>
        <div className="flex flex-wrap gap-2">
          {consensus.aiPicks?.map((pick, i) => (
            <span 
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                pick.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' :
                pick.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              }`}
            >
              {AI_CONFIG[pick.aiModel]?.name || pick.aiModel}: {pick.direction}
            </span>
          ))}
        </div>
      </div>
      
      <p className="mt-3 text-sm text-gray-400 italic">&ldquo;{consensus.javariReasoning}&rdquo;</p>
    </div>
  );
}

// Performance Card
function PerformanceCard({ performance }: { performance: AIPerformance[] }) {
  return (
    <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-400" /> AI Performance
      </h3>
      
      <div className="space-y-3">
        {performance.map((ai) => {
          const config = AI_CONFIG[ai.model] || AI_CONFIG.gpt4;
          return (
            <div key={ai.model} className="flex items-center gap-3">
              <div 
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
              >
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{config.name}</span>
                  <span className={`text-sm font-bold ${ai.winRate >= 60 ? 'text-emerald-400' : ai.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {ai.winRate.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-emerald-400">{ai.wins}W</span>
                  <span>/</span>
                  <span className="text-red-400">{ai.losses}L</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Generate Pick Form
function GeneratePickForm({ onGenerate, loading }: { onGenerate: (symbol: string) => void; loading: boolean }) {
  const [symbol, setSymbol] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onGenerate(symbol.trim().toUpperCase());
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Enter symbol (e.g., AAPL)"
        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !symbol.trim()}
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
      >
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        Generate AI Picks
      </button>
    </form>
  );
}

// Main Dashboard Component
export default function AIPicksDashboard() {
  const [picks, setPicks] = useState<AIPick[]>([]);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [performance, setPerformance] = useState<AIPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPick, setExpandedPick] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch picks and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-picks/generate?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPicks(data.picks || []);
        
        // Calculate performance from picks
        const stats: Record<string, { wins: number; losses: number; total: number }> = {};
        for (const pick of data.picks || []) {
          const model = pick.ai_model;
          if (!stats[model]) stats[model] = { wins: 0, losses: 0, total: 0 };
          if (pick.status === 'WIN') stats[model].wins++;
          else if (pick.status === 'LOSS') stats[model].losses++;
          stats[model].total++;
        }
        
        setPerformance(
          Object.entries(stats).map(([model, s]) => ({
            model,
            wins: s.wins,
            losses: s.losses,
            winRate: s.total > 0 ? (s.wins / (s.wins + s.losses || 1)) * 100 : 0,
            avgConfidence: 0,
          }))
        );
      }
    } catch (err) {
      setError('Failed to load picks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate new picks
  const handleGenerate = async (symbol: string) => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/ai-picks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add new picks to the list
        if (data.picks) {
          setPicks(prev => [...data.picks, ...prev]);
        } else if (data.pick) {
          setPicks(prev => [data.pick, ...prev]);
        }
        
        if (data.consensus) {
          setConsensus(data.consensus);
        }
      } else {
        setError(data.error || 'Failed to generate picks');
      }
    } catch (err) {
      setError('Failed to generate picks');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            AI-Powered Stock Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Market Oracle <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">AI Picks</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Multi-AI consensus system that learns and adapts. GPT-4, Perplexity, and Javari work together to find high-probability trades.
          </p>
        </div>
        
        {/* Generate Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <GeneratePickForm onGenerate={handleGenerate} loading={generating} />
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Picks List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Recent AI Picks
              </h2>
              <button 
                onClick={fetchData}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-800/60 rounded-2xl p-4 animate-pulse">
                    <div className="h-20 bg-gray-700/50 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : picks.length === 0 ? (
              <div className="bg-gray-800/60 rounded-2xl p-8 text-center">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No picks yet. Enter a symbol above to generate AI analysis.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {picks.map((pick) => (
                  <PickCard 
                    key={pick.id} 
                    pick={pick}
                    expanded={expandedPick === pick.id}
                    onToggle={() => setExpandedPick(expandedPick === pick.id ? null : pick.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Consensus Card */}
            {consensus && <ConsensusCard consensus={consensus} />}
            
            {/* Performance Card */}
            {performance.length > 0 && <PerformanceCard performance={performance} />}
            
            {/* Stats Card */}
            <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" /> Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{picks.length}</div>
                  <div className="text-xs text-gray-400">Total Picks</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {picks.filter(p => p.status === 'WIN').length}
                  </div>
                  <div className="text-xs text-gray-400">Wins</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {picks.filter(p => p.status === 'LOSS').length}
                  </div>
                  <div className="text-xs text-gray-400">Losses</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {picks.filter(p => p.status === 'PENDING').length}
                  </div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
              </div>
            </div>
            
            {/* Info Card */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">1.</span>
                  Multiple AIs analyze the stock independently
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">2.</span>
                  Javari builds weighted consensus from all picks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">3.</span>
                  System tracks outcomes and learns over time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">4.</span>
                  AI weights adjust weekly based on performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
