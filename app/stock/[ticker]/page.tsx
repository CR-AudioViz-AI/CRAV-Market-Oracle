// app/stock/[ticker]/page.tsx - Dynamic Stock Detail Page
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Calendar, Brain, ExternalLink, AlertTriangle } from 'lucide-react';

// This would normally fetch from database
async function getStockData(ticker: string) {
  // In production, fetch from Supabase
  return null;
}

export default async function StockDetailPage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{ticker}</h1>
              <p className="text-slate-400">AI Pick Analysis</p>
            </div>
            <a 
              href={`https://finance.yahoo.com/quote/${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              View on Yahoo Finance <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Placeholder for live data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Entry Price</div>
              <div className="text-xl font-bold">--</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Current Price</div>
              <div className="text-xl font-bold">--</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Target Price</div>
              <div className="text-xl font-bold">--</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">P&L</div>
              <div className="text-xl font-bold text-gray-400">EVEN</div>
            </div>
          </div>
        </div>

        {/* AI Picks for this ticker */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Predictions for {ticker}
          </h2>
          <p className="text-slate-400 mb-4">
            View all AI model predictions for this ticker across different time periods.
          </p>
          <div className="text-center py-8 text-slate-500">
            <p>Loading AI predictions...</p>
            <p className="text-sm mt-2">Check the main dashboard for all {ticker} picks</p>
          </div>
        </div>

        {/* External Resources */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-4">Research Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a 
              href={`https://finance.yahoo.com/quote/${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="font-medium mb-1">Yahoo Finance</div>
              <div className="text-sm text-slate-400">Charts, financials, news</div>
            </a>
            <a 
              href={`https://www.google.com/search?q=${ticker}+stock`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="font-medium mb-1">Google Search</div>
              <div className="text-sm text-slate-400">Latest news and analysis</div>
            </a>
            <a 
              href={`https://www.tradingview.com/symbols/${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="font-medium mb-1">TradingView</div>
              <div className="text-sm text-slate-400">Technical analysis</div>
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-900/20 border border-amber-700/50 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              <strong className="text-amber-400">Educational Only:</strong> AI predictions are for learning purposes. 
              Do not make investment decisions based on this data. Always consult a financial advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
