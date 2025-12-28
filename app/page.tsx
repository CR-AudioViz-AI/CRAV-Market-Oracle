'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, Bell, Brain, BarChart3, PieChart,
  Search, Star, DollarSign, Activity, Zap, Wallet,
  ArrowUp, ArrowDown, Clock, Target, Sparkles, Globe,
  ChevronRight, Eye, RefreshCw, Filter, Menu, X
} from 'lucide-react'

import AIPredictionEngine from '@/components/AIPredictionEngine'
import PortfolioSimulator from '@/components/PortfolioSimulator'
import MarketSentimentRadar from '@/components/MarketSentimentRadar'
import PriceAlerts from '@/components/PriceAlerts'
import AIStockScoring from '@/components/AIStockScoring'
import EcosystemHub from '@/components/EcosystemHub'
import CrossMarketingFooter from '@/components/CrossMarketingFooter'
import JavariWidget from '@/components/JavariWidget'

type ActiveTab = 'dashboard' | 'predictions' | 'portfolio' | 'sentiment' | 'alerts' | 'scoring' | 'ecosystem'

interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

const MARKET_INDICES: MarketIndex[] = [
  { name: 'S&P 500', value: 4783.35, change: 25.50, changePercent: 0.54 },
  { name: 'NASDAQ', value: 15095.14, change: 78.81, changePercent: 0.52 },
  { name: 'DOW', value: 37689.54, change: 53.58, changePercent: 0.14 },
  { name: 'BTC/USD', value: 42850.00, change: 1250.00, changePercent: 3.01 },
]

export default function MarketOraclePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'predictions', label: 'AI Predictions', icon: Brain, badge: 'HOT' },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'sentiment', label: 'Sentiment', icon: Activity, badge: 'NEW' },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'scoring', label: 'Stock Scoring', icon: Target },
    { id: 'ecosystem', label: 'More Apps', icon: Sparkles },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          {/* Market Ticker */}
          <div className="flex items-center gap-6 py-2 border-b border-gray-800 overflow-x-auto">
            {MARKET_INDICES.map(index => (
              <div key={index.name} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm text-gray-400">{index.name}</span>
                <span className="font-medium">{index.value.toLocaleString()}</span>
                <span className={`text-sm flex items-center ${index.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {index.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          
          {/* Main Header */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Market Oracle
              </h1>
              <span className="hidden sm:inline px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-56 bg-gray-900 border-r border-gray-800 fixed md:sticky top-[105px] h-[calc(100vh-105px)] overflow-y-auto z-30`}>
          <nav className="p-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as ActiveTab); setMobileMenuOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 ${
                  activeTab === item.id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3"><item.icon className="w-4 h-4" /><span className="text-sm">{item.label}</span></div>
                {item.badge && <span className={`px-1.5 py-0.5 text-xs rounded ${item.badge === 'HOT' ? 'bg-red-500' : 'bg-violet-500'} text-white`}>{item.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-105px)]">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2"><Brain className="w-4 h-4" /><span className="text-sm">AI Accuracy</span></div>
                    <p className="text-2xl font-bold text-cyan-400">85.3%</p>
                    <p className="text-sm text-green-400">+2.1% this month</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2"><Target className="w-4 h-4" /><span className="text-sm">Active Picks</span></div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm text-gray-400">8 bullish, 4 bearish</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2"><Activity className="w-4 h-4" /><span className="text-sm">Market Sentiment</span></div>
                    <p className="text-2xl font-bold text-green-400">62</p>
                    <p className="text-sm text-green-400">Greed</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2"><Zap className="w-4 h-4" /><span className="text-sm">Volatility</span></div>
                    <p className="text-2xl font-bold text-yellow-400">35</p>
                    <p className="text-sm text-yellow-400">Moderate</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => setActiveTab('predictions')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center"><Brain className="w-5 h-5 text-cyan-400" /></div>
                    <div className="text-left"><p className="font-medium">AI Predictions</p><p className="text-xs text-gray-400">View all picks</p></div>
                  </button>
                  <button onClick={() => setActiveTab('portfolio')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-purple-400" /></div>
                    <div className="text-left"><p className="font-medium">Portfolio</p><p className="text-xs text-gray-400">Track & simulate</p></div>
                  </button>
                  <button onClick={() => setActiveTab('sentiment')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center"><Activity className="w-5 h-5 text-orange-400" /></div>
                    <div className="text-left"><p className="font-medium">Sentiment</p><p className="text-xs text-gray-400">Market mood</p></div>
                  </button>
                  <button onClick={() => setActiveTab('alerts')} className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center"><Bell className="w-5 h-5 text-red-400" /></div>
                    <div className="text-left"><p className="font-medium">Alerts</p><p className="text-xs text-gray-400">Set price alerts</p></div>
                  </button>
                </div>

                {/* Top AI Picks Preview */}
                <div className="bg-gray-900 rounded-xl border border-gray-700">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      <h2 className="font-semibold">Top AI Picks Today</h2>
                    </div>
                    <button onClick={() => setActiveTab('predictions')} className="text-sm text-cyan-400 flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {[
                      { symbol: 'NVDA', name: 'NVIDIA', score: 92, signal: 'Strong Buy', price: 495.22, target: 545, change: 2.3 },
                      { symbol: 'MSFT', name: 'Microsoft', score: 89, signal: 'Buy', price: 375.28, target: 410, change: 1.1 },
                      { symbol: 'AAPL', name: 'Apple', score: 82, signal: 'Buy', price: 193.15, target: 205, change: -0.5 },
                    ].map(pick => (
                      <div key={pick.symbol} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-sm">{pick.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{pick.symbol}</p>
                            <p className="text-sm text-gray-400">{pick.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium">${pick.price}</p>
                            <p className={`text-sm ${pick.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pick.change >= 0 ? '+' : ''}{pick.change}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Target</p>
                            <p className="font-medium text-cyan-400">${pick.target}</p>
                          </div>
                          <div className="w-16">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">Score</span>
                              <span className="text-xs font-medium text-cyan-400">{pick.score}</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pick.score}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predictions' && <AIPredictionEngine />}
            {activeTab === 'portfolio' && <PortfolioSimulator />}
            {activeTab === 'sentiment' && <MarketSentimentRadar />}
            {activeTab === 'alerts' && <PriceAlerts />}
            {activeTab === 'scoring' && <AIStockScoring />}
            {activeTab === 'ecosystem' && <EcosystemHub currentApp="market-oracle" />}
          </div>
        </main>
      </div>

      <CrossMarketingFooter currentApp="market-oracle" />
      <JavariWidget />
    </div>
  )
}
