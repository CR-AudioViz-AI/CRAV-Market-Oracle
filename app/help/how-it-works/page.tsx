// app/help/how-it-works/page.tsx
import Link from 'next/link';
import { ArrowLeft, Brain, TrendingUp, BarChart3, RefreshCw, Award } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/help" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Help Center
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">How Market Oracle Works</h1>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl">
          Understand the technology and methodology behind our AI prediction competition.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <Brain className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">5 AI Models Compete</h3>
            <p className="text-slate-400">
              Every week, GPT-4, Claude, Gemini, Perplexity, and Javari each generate stock picks. 
              They analyze market conditions and provide entry prices, target prices, and reasoning.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <TrendingUp className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Real-Time Price Tracking</h3>
            <p className="text-slate-400">
              We fetch live prices from Twelve Data (stocks) and CoinGecko (crypto) every 15 minutes 
              during market hours to track actual performance against predictions.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <BarChart3 className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Performance Scoring</h3>
            <p className="text-slate-400">
              Picks are scored based on: hitting target price (+10 points), stopping out (-5 points), 
              and overall accuracy. AI models accumulate points over time.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <Award className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-3">Weekly Leaderboard</h3>
            <p className="text-slate-400">
              Each week, we crown the best-performing AI. Track historical performance, 
              win rates, and see which AI consistently makes better predictions.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-xl font-bold mb-4">The Process</h3>
          <div className="flex flex-col md:flex-row items-center gap-4 text-center">
            <div className="flex-1 p-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <p className="text-sm text-slate-400">Every Sunday, AIs generate 75 new picks (25 per category)</p>
            </div>
            <RefreshCw className="w-6 h-6 text-slate-600 hidden md:block" />
            <div className="flex-1 p-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <p className="text-sm text-slate-400">Prices update every 15 minutes during market hours</p>
            </div>
            <RefreshCw className="w-6 h-6 text-slate-600 hidden md:block" />
            <div className="flex-1 p-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <p className="text-sm text-slate-400">After 7 days, picks are scored and leaderboard updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
