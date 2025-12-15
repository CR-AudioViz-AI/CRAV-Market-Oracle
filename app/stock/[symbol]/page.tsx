// app/stock/[symbol]/page.tsx
// Stock Detail Page - Shows ALL AI analyses for a specific stock

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Brain,
  Bot,
  Sparkles,
  Zap,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  BarChart3,
  DollarSign,
  Activity
} from 'lucide-react';

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
  factor_assessments: Array<{
    factorId: string;
    factorName: string;
    value: string;
    interpretation: string;
    confidence: number;
    reasoning: string;
  }>;
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  status: string;
  created_at: string;
}

interface Consensus {
  consensusDirection: string;
  consensusStrength: string;
  javariConfidence: number;
  javariReasoning: string;
}

const AI_INFO: Record<string, { name: string; icon: React.ElementType; color: string; description: string }> = {
  gpt4: { 
    name: 'GPT-4', 
    icon: Brain, 
    color: 'emerald',
    description: 'Conservative & thorough analysis'
  },
  claude: { 
    name: 'Claude', 
    icon: Bot, 
    color: 'purple',
    description: 'Balanced & risk-aware'
  },
  gemini: { 
    name: 'Gemini', 
    icon: Sparkles, 
    color: 'blue',
    description: 'Technical pattern focus'
  },
  perplexity: { 
    name: 'Perplexity', 
    icon: Zap, 
    color: 'cyan',
    description: 'Real-time news & data'
  },
};

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();
  
  const [picks, setPicks] = useState<AIPick[]>([]);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPicks = async (generate = false) => {
    if (generate) {
      setGenerating(true);
      try {
        const res = await fetch('/api/ai-picks/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        });
        const data = await res.json();
        if (data.success) {
          setPicks(data.picks || []);
          setConsensus(data.consensus);
        } else {
          setError(data.error || 'Failed to generate picks');
        }
      } catch (err) {
        setError('Failed to generate analysis');
      }
      setGenerating(false);
    } else {
      setLoading(true);
      try {
        const res = await fetch(`/api/ai-picks/generate?symbol=${symbol}&limit=10`);
        const data = await res.json();
        if (data.success && data.picks?.length > 0) {
          setPicks(data.picks);
        }
      } catch (err) {
        console.error('Failed to fetch picks:', err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks();
  }, [symbol]);

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const latestPickByAI = picks.reduce((acc, pick) => {
    if (!acc[pick.ai_model] || new Date(pick.created_at) > new Date(acc[pick.ai_model].created_at)) {
      acc[pick.ai_model] = pick;
    }
    return acc;
  }, {} as Record<string, AIPick>);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/ai-picks" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{symbol}</h1>
              <p className="text-gray-400 mt-1">
                {picks[0]?.company_name || 'Loading...'} • {picks[0]?.sector || ''}
              </p>
            </div>
            
            <button
              onClick={() => fetchPicks(true)}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Generate New Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Javari Consensus */}
        {consensus && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Javari Consensus</h2>
                <p className="text-gray-400 text-sm">Multi-AI weighted verdict</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className={`text-3xl font-bold ${
                  consensus.consensusDirection === 'UP' ? 'text-green-400' :
                  consensus.consensusDirection === 'DOWN' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {consensus.consensusDirection}
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {consensus.javariConfidence?.toFixed(0)}%
                </div>
              </div>
            </div>
            <p className="text-gray-300">{consensus.javariReasoning}</p>
            <div className="mt-3 text-sm text-gray-500">
              Consensus Strength: {consensus.consensusStrength}
            </div>
          </div>
        )}

        {/* Individual AI Analyses */}
        <h2 className="text-2xl font-bold mb-6">Individual AI Analyses</h2>
        <p className="text-gray-400 mb-6">Click each AI to see their full reasoning and analysis</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : Object.keys(latestPickByAI).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No analyses found for {symbol}</p>
            <button
              onClick={() => fetchPicks(true)}
              disabled={generating}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Generate Analysis Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(latestPickByAI).map(([aiModel, pick]) => {
              const ai = AI_INFO[aiModel] || { name: aiModel, icon: Brain, color: 'gray', description: '' };
              const Icon = ai.icon;
              const isExpanded = expandedAI === aiModel;
              
              return (
                <div
                  key={aiModel}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                >
                  {/* AI Header - Clickable */}
                  <button
                    onClick={() => setExpandedAI(isExpanded ? null : aiModel)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colorClasses[ai.color]} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg">{ai.name}</div>
                        <div className="text-sm text-gray-500">{ai.description}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Direction */}
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
                        pick.direction === 'UP' ? 'bg-green-500/20 text-green-400' :
                        pick.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {pick.direction === 'UP' ? <TrendingUp className="w-5 h-5" /> :
                         pick.direction === 'DOWN' ? <TrendingDown className="w-5 h-5" /> :
                         <MinusCircle className="w-5 h-5" />}
                        {pick.direction}
                      </div>
                      
                      {/* Confidence */}
                      <div className="text-center">
                        <div className="text-2xl font-bold">{pick.confidence}%</div>
                        <div className="text-xs text-gray-500">confidence</div>
                      </div>
                      
                      {/* Target */}
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">${pick.target_price?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">target</div>
                      </div>
                      
                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Full Analysis */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 p-6 space-y-6 bg-gray-950/50">
                      {/* Thesis */}
                      <div className="bg-gray-800/50 rounded-xl p-4">
                        <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Thesis
                        </h4>
                        <p className="text-gray-200 text-lg">{pick.thesis}</p>
                      </div>
                      
                      {/* Price Targets */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                          <div className="text-sm text-gray-500">Entry Price</div>
                          <div className="text-2xl font-bold">${pick.entry_price?.toFixed(2)}</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
                          <div className="text-sm text-green-400">Target Price</div>
                          <div className="text-2xl font-bold text-green-400">${pick.target_price?.toFixed(2)}</div>
                          <div className="text-sm text-green-400">
                            +{(((pick.target_price - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-2" />
                          <div className="text-sm text-red-400">Stop Loss</div>
                          <div className="text-2xl font-bold text-red-400">${pick.stop_loss?.toFixed(2)}</div>
                          <div className="text-sm text-red-400">
                            {(((pick.stop_loss - pick.entry_price) / pick.entry_price) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Full Reasoning */}
                      <div>
                        <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" /> Full Analysis
                        </h4>
                        <div className="bg-gray-800/50 rounded-xl p-4">
                          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{pick.full_reasoning}</p>
                        </div>
                      </div>
                      
                      {/* Factor Assessments */}
                      {pick.factor_assessments && pick.factor_assessments.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Factor Analysis
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {pick.factor_assessments.map((factor, i) => (
                              <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{factor.factorName}</span>
                                  <span className={`text-sm px-2 py-0.5 rounded ${
                                    factor.interpretation === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                                    factor.interpretation === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {factor.interpretation}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-400">
                                  Value: {factor.value} • Confidence: {factor.confidence}%
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{factor.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Bullish/Bearish Factors */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Bullish Factors
                          </h4>
                          <ul className="space-y-2">
                            {pick.key_bullish_factors?.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 bg-green-500/5 rounded-lg p-2">
                                <span className="text-green-400 mt-0.5">✓</span>
                                <span className="text-gray-300">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Bearish Factors
                          </h4>
                          <ul className="space-y-2">
                            {pick.key_bearish_factors?.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 bg-red-500/5 rounded-lg p-2">
                                <span className="text-red-400 mt-0.5">✗</span>
                                <span className="text-gray-300">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Risks & Catalysts */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Key Risks
                          </h4>
                          <ul className="space-y-2">
                            {pick.risks?.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 bg-orange-500/5 rounded-lg p-2">
                                <span className="text-orange-400 mt-0.5">⚠</span>
                                <span className="text-gray-300">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4" /> Potential Catalysts
                          </h4>
                          <ul className="space-y-2">
                            {pick.catalysts?.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 bg-blue-500/5 rounded-lg p-2">
                                <span className="text-blue-400 mt-0.5">★</span>
                                <span className="text-gray-300">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Timeframe & Status */}
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-800">
                        <span>Timeframe: {pick.timeframe}</span>
                        <span>Generated: {new Date(pick.created_at).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded ${
                          pick.status === 'WIN' ? 'bg-green-500/20 text-green-400' :
                          pick.status === 'LOSS' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {pick.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
