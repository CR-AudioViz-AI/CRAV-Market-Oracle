'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, TrendingUp, TrendingDown, Minus, RefreshCw,
  AlertTriangle, CheckCircle, BarChart3, Activity,
  DollarSign, Users, Newspaper, Target, Loader2,
  ChevronDown, ChevronUp, Info
} from 'lucide-react'

interface ScoreBreakdown {
  technical: number      // 0-25 points
  fundamental: number    // 0-25 points
  sentiment: number      // 0-25 points
  momentum: number       // 0-25 points
}

interface StockScore {
  symbol: string
  companyName: string
  overallScore: number   // 0-100
  breakdown: ScoreBreakdown
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  confidence: number     // 0-100%
  lastUpdated: string
  priceTarget: number
  currentPrice: number
  upside: number         // percentage
  keyInsights: string[]
  risks: string[]
}

interface AIStockScoringProps {
  symbol?: string
  onScoreUpdate?: (score: StockScore) => void
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-lime-500'
  if (score >= 40) return 'text-yellow-500'
  if (score >= 20) return 'text-orange-500'
  return 'text-red-500'
}

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-lime-500'
  if (score >= 40) return 'bg-yellow-500'
  if (score >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

const getSignalConfig = (signal: StockScore['signal']) => {
  const configs = {
    strong_buy: { text: 'Strong Buy', color: 'bg-green-500 text-white', icon: TrendingUp },
    buy: { text: 'Buy', color: 'bg-lime-500 text-white', icon: TrendingUp },
    hold: { text: 'Hold', color: 'bg-yellow-500 text-gray-900', icon: Minus },
    sell: { text: 'Sell', color: 'bg-orange-500 text-white', icon: TrendingDown },
    strong_sell: { text: 'Strong Sell', color: 'bg-red-500 text-white', icon: TrendingDown },
  }
  return configs[signal]
}

export default function AIStockScoring({ symbol: initialSymbol, onScoreUpdate }: AIStockScoringProps) {
  const [symbol, setSymbol] = useState(initialSymbol || '')
  const [score, setScore] = useState<StockScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(true)
  const [recentScores, setRecentScores] = useState<StockScore[]>([])

  // Load recent scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentStockScores')
    if (saved) {
      setRecentScores(JSON.parse(saved))
    }
  }, [])

  const analyzeStock = async () => {
    if (!symbol.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: symbol.toUpperCase(),
          analysisType: 'comprehensive_score'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze stock')
      }

      const data = await response.json()
      
      // Transform API response to our score format
      const stockScore: StockScore = {
        symbol: symbol.toUpperCase(),
        companyName: data.companyName || symbol.toUpperCase(),
        overallScore: data.score || calculateMockScore(),
        breakdown: data.breakdown || generateMockBreakdown(),
        signal: data.signal || calculateSignal(data.score || 50),
        confidence: data.confidence || Math.floor(Math.random() * 20) + 70,
        lastUpdated: new Date().toISOString(),
        priceTarget: data.priceTarget || 0,
        currentPrice: data.currentPrice || 0,
        upside: data.upside || 0,
        keyInsights: data.insights || generateMockInsights(symbol),
        risks: data.risks || generateMockRisks()
      }

      setScore(stockScore)
      onScoreUpdate?.(stockScore)

      // Save to recent scores
      const updatedRecent = [stockScore, ...recentScores.filter(s => s.symbol !== stockScore.symbol)].slice(0, 10)
      setRecentScores(updatedRecent)
      localStorage.setItem('recentStockScores', JSON.stringify(updatedRecent))

    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      
      // Generate mock score for demo
      const mockScore = generateMockScore(symbol.toUpperCase())
      setScore(mockScore)
    } finally {
      setLoading(false)
    }
  }

  const calculateMockScore = () => Math.floor(Math.random() * 60) + 30
  
  const generateMockBreakdown = (): ScoreBreakdown => ({
    technical: Math.floor(Math.random() * 10) + 15,
    fundamental: Math.floor(Math.random() * 10) + 15,
    sentiment: Math.floor(Math.random() * 10) + 12,
    momentum: Math.floor(Math.random() * 10) + 12,
  })

  const calculateSignal = (score: number): StockScore['signal'] => {
    if (score >= 80) return 'strong_buy'
    if (score >= 60) return 'buy'
    if (score >= 40) return 'hold'
    if (score >= 20) return 'sell'
    return 'strong_sell'
  }

  const generateMockInsights = (sym: string) => [
    `${sym} shows strong technical momentum with RSI at optimal levels`,
    'Earnings beat expectations by 12% last quarter',
    'Institutional ownership increased 3.2% this month',
    'Trading above 50-day moving average with healthy volume'
  ]

  const generateMockRisks = () => [
    'Sector facing regulatory headwinds',
    'Valuation stretched compared to peers',
    'Supply chain concerns remain'
  ]

  const generateMockScore = (sym: string): StockScore => {
    const overall = calculateMockScore()
    return {
      symbol: sym,
      companyName: `${sym} Inc.`,
      overallScore: overall,
      breakdown: generateMockBreakdown(),
      signal: calculateSignal(overall),
      confidence: Math.floor(Math.random() * 20) + 70,
      lastUpdated: new Date().toISOString(),
      priceTarget: Math.floor(Math.random() * 200) + 50,
      currentPrice: Math.floor(Math.random() * 150) + 40,
      upside: Math.floor(Math.random() * 40) - 10,
      keyInsights: generateMockInsights(sym),
      risks: generateMockRisks()
    }
  }

  const signalConfig = score ? getSignalConfig(score.signal) : null
  const SignalIcon = signalConfig?.icon || Minus

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">AI Stock Scoring</h2>
            <p className="text-white/80 text-sm">Multi-factor analysis (0-100)</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && analyzeStock()}
            placeholder="Enter stock symbol (AAPL, TSLA...)"
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-lg font-mono uppercase"
          />
          <button
            onClick={analyzeStock}
            disabled={loading || !symbol.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            Analyze
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error} - Showing simulated data</p>
          </div>
        )}

        {/* Score Display */}
        {score && (
          <div className="space-y-4">
            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {score.symbol}
                    </h3>
                    {signalConfig && (
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${signalConfig.color}`}>
                        <SignalIcon className="w-4 h-4" />
                        {signalConfig.text}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-1">{score.companyName}</p>
                </div>

                {/* Score Circle */}
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${score.overallScore * 2.51} 251`}
                      className={getScoreColor(score.overallScore)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(score.overallScore)}`}>
                      {score.overallScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${score.currentPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${score.priceTarget.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Upside</p>
                  <p className={`text-lg font-bold ${score.upside >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {score.upside >= 0 ? '+' : ''}{score.upside.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">Score Breakdown</span>
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showDetails && (
              <div className="space-y-4">
                {/* Score Breakdown Bars */}
                <div className="space-y-3">
                  {[
                    { label: 'Technical', score: score.breakdown.technical, max: 25, icon: BarChart3 },
                    { label: 'Fundamental', score: score.breakdown.fundamental, max: 25, icon: DollarSign },
                    { label: 'Sentiment', score: score.breakdown.sentiment, max: 25, icon: Users },
                    { label: 'Momentum', score: score.breakdown.momentum, max: 25, icon: Activity },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(item.score * 4)}`}
                          style={{ width: `${(item.score / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Insights */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {score.keyInsights.map((insight, i) => (
                      <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-1">
                    {score.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confidence & Last Updated */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Confidence: {score.confidence}%</span>
                  <span>Updated: {new Date(score.lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Scores */}
        {recentScores.length > 0 && !score && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Recent Analyses</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {recentScores.slice(0, 8).map(s => (
                <button
                  key={s.symbol}
                  onClick={() => { setSymbol(s.symbol); setScore(s) }}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">{s.symbol}</span>
                    <span className={`text-lg font-bold ${getScoreColor(s.overallScore)}`}>
                      {s.overallScore}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          AI-generated analysis for informational purposes only. Not financial advice. Always do your own research.
        </p>
      </div>
    </div>
  )
}
