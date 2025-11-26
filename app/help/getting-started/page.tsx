// app/help/getting-started/page.tsx
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ArrowRight, Target, Eye, TrendingUp, Trophy } from 'lucide-react';

export default function GettingStartedPage() {
  const steps = [
    { icon: Eye, title: 'Explore the Dashboard', description: 'The main dashboard shows all active AI picks across Regular Stocks, Penny Stocks, and Crypto. Use the category tabs to filter.' },
    { icon: TrendingUp, title: 'Understand Picks', description: 'Each pick shows Entry Price (when AI picked it), Current Price (live), Target Price (AI prediction), and P&L percentage.' },
    { icon: Trophy, title: 'Track AI Performance', description: 'Visit the AI Battle page to see which AI is winning. Check win rates, accuracy, and head-to-head comparisons.' },
    { icon: Target, title: 'Use Watchlist', description: 'Add picks to your personal watchlist to track specific stocks you\'re interested in following.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/help" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Help Center
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Getting Started with Market Oracle</h1>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl">
          Welcome! This guide will help you understand how to use Market Oracle to follow AI-powered stock predictions.
        </p>

        <div className="space-y-8 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 p-6 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <step.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Step {i + 1}: {step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-8 border border-cyan-800/50">
          <h3 className="text-2xl font-bold mb-4">Ready to explore?</h3>
          <p className="text-slate-300 mb-6">Start by checking out today's hot picks from our AI models.</p>
          <Link href="/hot-picks" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors">
            View Hot Picks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
