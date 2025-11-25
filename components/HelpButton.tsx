// components/HelpButton.tsx - Floating Help Button
'use client';

import { useState } from 'react';
import { HelpCircle, X, Book, Target, TrendingUp, BarChart3, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-brand-cyan hover:bg-cyan-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Help"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <HelpCircle className="w-8 h-8" />
                  Market Oracle Help
                </h2>
                <p className="text-cyan-100 text-sm mt-1">Quick guides and resources</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-cyan-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              
              {/* Quick Start */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Quick Start
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• <strong>Dashboard:</strong> View AI-generated stock picks across Regular, Penny, and Crypto categories</p>
                  <p>• <strong>AI Models:</strong> 5 competing AIs (GPT-4, Claude, Gemini, Perplexity, Javari) generate 15 picks each per week</p>
                  <p>• <strong>Confidence:</strong> Each pick includes a confidence score (0-100%) and price targets</p>
                  <p>• <strong>Track Performance:</strong> See which AI performs best over time</p>
                </div>
              </div>

              {/* How It Works */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  How It Works
                </h3>
                <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
                  <li><strong>AI Generation:</strong> Every week, 5 AI models analyze market data and generate picks</li>
                  <li><strong>Categories:</strong> Each AI picks 5 stocks in 3 categories (Regular, Penny, Crypto) = 75 total picks</li>
                  <li><strong>Competition:</strong> AIs compete to see which has the best accuracy and returns</li>
                  <li><strong>Real-time Updates:</strong> Track picks as they perform in real markets</li>
                </ol>
              </div>

              {/* Understanding Picks */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Understanding Pick Data
                </h3>
                <div className="bg-slate-800 rounded-lg p-4 space-y-2 text-sm text-slate-300">
                  <p>• <strong>Entry Price:</strong> AI's recommended buy price</p>
                  <p>• <strong>Target Price:</strong> AI's predicted price target</p>
                  <p>• <strong>Stop Loss:</strong> Automatic risk management level (±5%)</p>
                  <p>• <strong>Direction:</strong> UP (bullish), DOWN (bearish), or HOLD</p>
                  <p>• <strong>Confidence:</strong> AI's certainty in the pick (higher = more confident)</p>
                </div>
              </div>

              {/* Help Resources */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Book className="w-5 h-5 text-yellow-400" />
                  Help Resources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/help/getting-started"
                    className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 transition-colors border border-slate-700 hover:border-cyan-500"
                  >
                    <p className="font-medium text-white mb-1">Getting Started Guide</p>
                    <p className="text-xs text-slate-400">Complete beginner tutorial</p>
                  </Link>
                  <Link
                    href="/help/ai-models"
                    className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 transition-colors border border-slate-700 hover:border-cyan-500"
                  >
                    <p className="font-medium text-white mb-1">AI Models Explained</p>
                    <p className="text-xs text-slate-400">Learn about each AI</p>
                  </Link>
                  <Link
                    href="/help/faq"
                    className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 transition-colors border border-slate-700 hover:border-cyan-500"
                  >
                    <p className="font-medium text-white mb-1">FAQ</p>
                    <p className="text-xs text-slate-400">Common questions answered</p>
                  </Link>
                  <a
                    href="https://craudiovizai.com/support"
                    target="_blank"
                    className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 transition-colors border border-slate-700 hover:border-cyan-500 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white mb-1">Contact Support</p>
                      <p className="text-xs text-slate-400">Get personalized help</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-yellow-200 text-sm font-medium mb-2">⚠️ Important Disclaimer</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Market Oracle is for educational and research purposes only. This is NOT financial advice. 
                  All AI predictions are experimental. Always do your own research and consult a licensed 
                  financial advisor before investing.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-800 p-4 flex justify-between items-center">
              <Link
                href="/help"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Book className="w-4 h-4" />
                View Full Documentation
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
