'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Brain, TrendingUp, TrendingDown, Minus, RefreshCw, 
  Target, Shield, Zap, BarChart3, Clock, Award,
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Search, X, Info, Lightbulb, Star, ArrowRight,
  Eye, MessageCircle, HelpCircle, Flame, LogIn, Coins
} from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';

// Credit costs
const CREDIT_COSTS = {
  FULL_ANALYSIS: 5,
};

// Stock database for symbol lookup (same as landing page)
const STOCK_DATABASE = [
  // Popular Stocks
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group' },
  { symbol: 'HD', name: 'Home Depot Inc.' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'KO', name: 'Coca-Cola Co.' },
  { symbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'MRK', name: 'Merck & Co.' },
  { symbol: 'CSCO', name: 'Cisco Systems' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  // Banks
  { symbol: 'FITB', name: 'Fifth Third Bancorp' },
  { symbol: 'WFC', name: 'Wells Fargo & Co.' },
  { symbol: 'C', name: 'Citigroup Inc.' },
  { symbol: 'GS', name: 'Goldman Sachs' },
  { symbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'USB', name: 'U.S. Bancorp' },
  { symbol: 'PNC', name: 'PNC Financial Services' },
  { symbol: 'TFC', name: 'Truist Financial' },
  { symbol: 'SCHW', name: 'Charles Schwab' },
  // Penny Stocks
  { symbol: 'SNDL', name: 'Sundial Growers Inc.' },
  { symbol: 'MULN', name: 'Mullen Automotive' },
  { symbol: 'FFIE', name: 'Faraday Future' },
  { symbol: 'CLOV', name: 'Clover Health' },
  { symbol: 'WISH', name: 'ContextLogic Inc.' },
  { symbol: 'SOFI', name: 'SoFi Technologies' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'NIO', name: 'NIO Inc.' },
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'MATIC', name: 'Polygon' },
];

// Types
interface AIPick {
  id: string;
  aiModel: string;
  symbol: string;
  companyName: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  timeframe: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  thesis: string;
  fullReasoning: string;
  factorAssessments?: Array<{
    factorId: string;
    factorName: string;
    value: string;
    interpretation: string;
    confidence: number;
    reasoning: string;
  }>;
  keyBullishFactors: string[];
  keyBearishFactors: string[];
  risks: string[];
  catalysts: string[];
  status: string;
  actualReturn?: number;
  createdAt: string;
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

interface StockAnalysis {
  symbol: string;
  companyName: string;
  sector: string;
  picks: AIPick[];
  consensus: ConsensusData | null;
}

// AI Model Colors & Config
const AI_CONFIG: Record<string, { color: string; gradient: string; name: string; description: string }> = {
  gpt4: { 
    color: '#10B981', 
    gradient: 'from-emerald-500 to-teal-600',
    name: 'GPT-4',
    description: 'Conservative, thorough analysis with deep reasoning'
  },
  perplexity: { 
    color: '#8B5CF6', 
    gradient: 'from-violet-500 to-purple-600',
    name: 'Perplexity',
    description: 'Real-time web data and breaking news integration'
  },
  claude: { 
    color: '#F59E0B', 
    gradient: 'from-amber-500 to-orange-600',
    name: 'Claude',
    description: 'Balanced analysis with strong risk awareness'
  },
  gemini: { 
    color: '#3B82F6', 
    gradient: 'from-blue-500 to-indigo-600',
    name: 'Gemini',
    description: 'Technical patterns and price target focus'
  },
};

// Helper: Resolve company name or search term to symbol
function resolveToSymbol(query: string): string {
  const q = query.toUpperCase().trim();
  
  // If it's already a known symbol, return it
  const exactSymbol = STOCK_DATABASE.find(s => s.symbol === q);
  if (exactSymbol) return exactSymbol.symbol;
  
  // Search by company name
  const byName = STOCK_DATABASE.find(s => 
    s.name.toUpperCase().includes(q) || q.includes(s.name.toUpperCase())
  );
  if (byName) return byName.symbol;
  
  // Partial match on name words
  const words = q.split(/\s+/);
  const partial = STOCK_DATABASE.find(s => 
    words.every(w => s.name.toUpperCase().includes(w))
  );
  if (partial) return partial.symbol;
  
  // Return as-is (might be a valid symbol we don't have in our database)
  return q;
}

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
function ConfidenceMeter({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {showLabel && <span className="text-sm font-mono text-gray-300 w-12 text-right">{value.toFixed(0)}%</span>}
    </div>
  );
}

// Stock Card Component
function StockCard({ 
  analysis, 
  onClick 
}: { 
  analysis: StockAnalysis; 
  onClick: () => void;
}) {
  const latestPick = analysis.picks[0];
  const aiCount = analysis.picks.length;
  const consensus = analysis.consensus;
  
  const directions = analysis.picks.map(p => p.direction);
  const upVotes = directions.filter(d => d === 'UP').length;
  const downVotes = directions.filter(d => d === 'DOWN').length;
  const holdVotes = directions.filter(d => d === 'HOLD').length;
  
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
              {analysis.symbol}
            </h3>
            {consensus && <DirectionBadge direction={consensus.consensusDirection} />}
          </div>
          <p className="text-sm text-gray-400">{latestPick?.companyName || analysis.symbol}</p>
          <p className="text-xs text-gray-500">{latestPick?.sector}</p>
        </div>
        
        {consensus && (
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{consensus.javariConfidence?.toFixed(0)}%</div>
            <div className="text-xs text-amber-400">Javari Score</div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-semibold">{upVotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400 font-semibold">{holdVotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-semibold">{downVotes}</span>
        </div>
        <span className="text-xs text-gray-500 ml-auto">{aiCount} AI{aiCount > 1 ? 's' : ''} analyzed</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {analysis.picks.map(pick => {
          const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
          return (
            <div 
              key={pick.id}
              className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} text-white flex items-center gap-1.5`}
            >
              <span>{config.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                pick.direction === 'UP' ? 'bg-emerald-500/30' :
                pick.direction === 'DOWN' ? 'bg-red-500/30' : 'bg-amber-500/30'
              }`}>
                {pick.direction}
              </span>
            </div>
          );
        })}
      </div>
      
      <p className="text-sm text-gray-400 line-clamp-2">{latestPick?.thesis}</p>
      
      <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {latestPick?.createdAt ? new Date(latestPick.createdAt).toLocaleDateString() : ''}
        </span>
        <button className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300">
          <Eye className="w-3 h-3" />
          View All AI Analyses
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// AI Analysis Panel Component
function AIAnalysisPanel({ pick }: { pick: AIPick }) {
  const [expanded, setExpanded] = useState(false);
  const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
  
  return (
    <div className={`bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden`}>
      <div 
        className={`p-4 cursor-pointer bg-gradient-to-r ${config.gradient} bg-opacity-10`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white">{config.name}</h4>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DirectionBadge direction={pick.direction} />
            <div className="text-right">
              <div className="text-lg font-bold text-white">{pick.confidence.toFixed(0)}%</div>
              <div className="text-xs text-gray-400">Confidence</div>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 space-y-4 border-t border-gray-700/50">
          <div>
            <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Thesis
            </h5>
            <p className="text-sm text-gray-400">{pick.thesis}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Entry</div>
              <div className="text-sm font-semibold text-white">${pick.entryPrice.toFixed(2)}</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <div className="text-xs text-emerald-400 mb-1">Target</div>
              <div className="text-sm font-semibold text-emerald-400">${pick.targetPrice.toFixed(2)}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-xs text-red-400 mb-1">Stop Loss</div>
              <div className="text-sm font-semibold text-red-400">${pick.stopLoss.toFixed(2)}</div>
            </div>
          </div>
          
          {pick.fullReasoning && (
            <div>
              <h5 className="text-sm font-semibold text-gray-300 mb-2">Full Analysis</h5>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{pick.fullReasoning}</p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            {pick.keyBullishFactors?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Bullish Factors
                </h5>
                <ul className="space-y-1">
                  {pick.keyBullishFactors.map((f, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pick.keyBearishFactors?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Bearish Factors
                </h5>
                <ul className="space-y-1">
                  {pick.keyBearishFactors.map((f, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {pick.risks?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Key Risks
              </h5>
              <div className="flex flex-wrap gap-2">
                {pick.risks.map((r, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stock Detail Modal
function StockDetailModal({ analysis, onClose }: { analysis: StockAnalysis; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{analysis.symbol}</h2>
                {analysis.consensus && <DirectionBadge direction={analysis.consensus.consensusDirection} size="lg" />}
              </div>
              <p className="text-gray-400">{analysis.companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {analysis.consensus && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">Javari Consensus</h3>
                  <span className="text-2xl font-bold text-amber-400">{analysis.consensus.javariConfidence?.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-gray-400">{analysis.consensus.javariReasoning}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex border-b border-gray-700 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'all' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            All AIs ({analysis.picks.length})
          </button>
          {analysis.picks.map(pick => {
            const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
            return (
              <button
                key={pick.aiModel}
                onClick={() => setActiveTab(pick.aiModel)}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === pick.aiModel ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'}`}
              >
                {config.name}
                <DirectionBadge direction={pick.direction} size="sm" />
              </button>
            );
          })}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'all' ? (
            analysis.picks.map(pick => <AIAnalysisPanel key={pick.id} pick={pick} />)
          ) : (
            analysis.picks.filter(p => p.aiModel === activeTab).map(pick => (
              <AIAnalysisPanel key={pick.id} pick={pick} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Hot Picks Section
function HotPicksSection({ analyses, onSelect }: { analyses: StockAnalysis[]; onSelect: (a: StockAnalysis) => void }) {
  const hotPicks = analyses
    .filter(a => a.consensus && a.consensus.javariConfidence >= 60 && a.consensus.consensusDirection === 'UP')
    .sort((a, b) => (b.consensus?.javariConfidence || 0) - (a.consensus?.javariConfidence || 0))
    .slice(0, 5);
  
  if (hotPicks.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-xl font-bold text-white">Hot Picks</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {hotPicks.map(analysis => (
          <div
            key={analysis.symbol}
            onClick={() => onSelect(analysis)}
            className="flex-shrink-0 w-48 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 cursor-pointer hover:border-orange-500/60 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-white">{analysis.symbol}</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{analysis.consensus?.javariConfidence?.toFixed(0)}%</div>
            <div className="text-xs text-gray-400">Javari Score</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Help Panel
function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">How Market Oracle Works</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Enter a Stock Symbol</h3>
              <p className="text-sm text-gray-400">Type any stock ticker and click Analyze. Costs 5 credits per analysis.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Four AIs Analyze Simultaneously</h3>
              <p className="text-sm text-gray-400">GPT-4, Claude, Gemini, and Perplexity each provide unique insights.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Javari Builds Consensus</h3>
              <p className="text-sm text-gray-400">Our AI weighs each model's prediction to give you a unified verdict.</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500">
            <strong>Disclaimer:</strong> This is not financial advice. Always do your own research.
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function AIDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, credits, loading: authLoading } = useAuthContext();
  
  const analyzeParam = searchParams.get('analyze');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StockAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<string | null>(null);
  
  // Track if we've already processed the URL param
  const processedParamRef = useRef(false);
  
  const groupPicksBySymbol = useCallback((picks: AIPick[], consensusData?: Record<string, ConsensusData>): StockAnalysis[] => {
    const grouped: Record<string, StockAnalysis> = {};
    for (const pick of picks) {
      if (!grouped[pick.symbol]) {
        grouped[pick.symbol] = {
          symbol: pick.symbol,
          companyName: pick.companyName,
          sector: pick.sector,
          picks: [],
          consensus: consensusData?.[pick.symbol] || null
        };
      }
      grouped[pick.symbol].picks.push(pick);
    }
    return Object.values(grouped).sort((a, b) => {
      const aTime = new Date(a.picks[0]?.createdAt || 0).getTime();
      const bTime = new Date(b.picks[0]?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, []);
  
  // Load existing picks
  useEffect(() => {
    const loadPicks = async () => {
      try {
        const res = await fetch('/api/ai-picks/generate?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (data.picks?.length > 0) {
            setAnalyses(groupPicksBySymbol(data.picks, {}));
          }
        }
      } catch (err) {
        console.error('Failed to load picks:', err);
      }
    };
    loadPicks();
  }, [groupPicksBySymbol]);
  
  // Handle analyze param from URL - resolve company name to symbol
  useEffect(() => {
    if (analyzeParam && !processedParamRef.current) {
      const resolvedSymbol = resolveToSymbol(analyzeParam);
      setSymbol(resolvedSymbol);
      setPendingAnalysis(resolvedSymbol);
      processedParamRef.current = true;
    }
  }, [analyzeParam]);
  
  // Auto-trigger analysis when user logs in and we have a pending analysis
  useEffect(() => {
    if (pendingAnalysis && user && !authLoading && credits >= CREDIT_COSTS.FULL_ANALYSIS) {
      handleAnalyze(pendingAnalysis);
      setPendingAnalysis(null);
      // Clear the URL param
      router.replace('/ai-picks', { scroll: false });
    } else if (pendingAnalysis && !user && !authLoading) {
      // User not logged in - show login modal
      setShowLogin(true);
    }
  }, [pendingAnalysis, user, authLoading, credits]);
  
  const handleAnalyze = async (sym?: string) => {
    const rawInput = sym || symbol;
    const targetSymbol = resolveToSymbol(rawInput);
    if (!targetSymbol) return;
    
    // Update the input field with resolved symbol
    setSymbol(targetSymbol);
    
    // Check if user is logged in
    if (!user) {
      setPendingAnalysis(targetSymbol);
      setShowLogin(true);
      return;
    }
    
    // Check credits
    if (credits < CREDIT_COSTS.FULL_ANALYSIS) {
      setError(`Insufficient credits. Need ${CREDIT_COSTS.FULL_ANALYSIS} credits, you have ${credits}.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai-picks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: targetSymbol, userId: user.id })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to analyze stock');
        return;
      }
      
      const newAnalysis: StockAnalysis = {
        symbol: targetSymbol,
        companyName: data.picks?.[0]?.companyName || targetSymbol,
        sector: data.picks?.[0]?.sector || 'Unknown',
        picks: data.picks || [],
        consensus: data.consensus || null
      };
      
      setAnalyses(prev => {
        const filtered = prev.filter(a => a.symbol !== targetSymbol);
        return [newAnalysis, ...filtered];
      });
      
      setSelectedAnalysis(newAnalysis);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle successful login - trigger pending analysis
  const handleLoginClose = () => {
    setShowLogin(false);
    // The useEffect watching pendingAnalysis will handle triggering the analysis
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Page Content - Global Header is in layout.tsx */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* How It Works Button - Floating */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300">How It Works</span>
          </button>
        </div>
        {/* Credit Cost Notice */}
        {user && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Analysis costs <strong className="text-amber-400">{CREDIT_COSTS.FULL_ANALYSIS} credits</strong> • Your balance: <strong className="text-white">{credits}</strong></span>
          </div>
        )}
        
        {/* Pending Analysis Notice */}
        {pendingAnalysis && !user && !authLoading && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-amber-400 font-medium">Sign in to analyze {pendingAnalysis}</p>
              <p className="text-sm text-gray-400">Your search will continue automatically after you sign in.</p>
            </div>
          </div>
        )}
        
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="Enter stock symbol (e.g., AAPL, TSLA)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-lg"
                />
              </div>
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !symbol.trim()}
                className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
          </div>
        </div>
        
        <HotPicksSection analyses={analyses} onSelect={setSelectedAnalysis} />
        
        {analyses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Recent Analyses
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyses.map(analysis => (
                <StockCard key={analysis.symbol} analysis={analysis} onClick={() => setSelectedAnalysis(analysis)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No analyses yet</h3>
            <p className="text-gray-500 mb-4">Enter a stock symbol above to get started</p>
          </div>
        )}
      </main>
      
      {selectedAnalysis && <StockDetailModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      {showLogin && <LoginModal isOpen={showLogin} onClose={handleLoginClose} />}
    </div>
  );
}
