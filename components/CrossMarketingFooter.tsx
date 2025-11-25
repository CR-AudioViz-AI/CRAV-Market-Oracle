// components/CrossMarketingFooter.tsx - Enterprise Footer with Cross-Marketing
'use client';

import Link from 'next/link';
import { ExternalLink, HelpCircle, Book, Mail, Twitter, Linkedin } from 'lucide-react';

export default function CrossMarketingFooter() {
  return (
    <footer className="border-t border-slate-800 mt-16 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* About CR AudioViz AI */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-cyan">CR AudioViz AI</span>
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              "Your Story. Our Design" - Empowering creators and businesses with AI-powered tools for success.
            </p>
            <Link 
              href="https://craudiovizai.com" 
              target="_blank"
              className="text-brand-cyan hover:text-cyan-400 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Visit Main Site <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Our Tools */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Our AI Tools</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://craudiovizai.com/tools/javari" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  Javari AI Assistant <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="text-white font-medium text-sm"
                >
                  Market Oracle (You are here)
                </Link>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/tools" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  60+ Professional Tools <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/craiverse" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  CRAIverse Virtual World <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/games" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  1,200+ Games <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Resources */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/help" 
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Book className="w-4 h-4" /> Getting Started Guide
                </Link>
              </li>
              <li>
                <Link 
                  href="/help/how-it-works" 
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  How Market Oracle Works
                </Link>
              </li>
              <li>
                <Link 
                  href="/help/ai-models" 
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Understanding AI Models
                </Link>
              </li>
              <li>
                <Link 
                  href="/help/faq" 
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/support" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <a 
                  href="https://craudiovizai.com/about" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/pricing" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Pricing Plans
                </a>
              </li>
              <li>
                <Link 
                  href="/disclaimer" 
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/privacy" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="https://craudiovizai.com/terms" 
                  target="_blank"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-3">
              <a 
                href="https://twitter.com/craudiovizai" 
                target="_blank"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/cr-audioviz-ai" 
                target="_blank"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="border-t border-slate-800 pt-6 mb-6">
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-yellow-200 text-sm font-medium mb-2">
              ⚠️ Investment Disclaimer
            </p>
            <p className="text-slate-300 text-xs leading-relaxed">
              Market Oracle is an AI-powered research and analysis tool. <strong>This is NOT financial advice.</strong> All stock picks are AI-generated predictions for educational and entertainment purposes only. Past performance does not guarantee future results. Always consult with a licensed financial advisor before making investment decisions. Trading stocks involves substantial risk of loss.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-slate-400 text-sm">
              Powered by <span className="text-brand-cyan font-semibold">CR AudioViz AI, LLC</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">
              "Your Story. Our Design" | EIN: 93-4520864 | Fort Myers, FL
            </p>
          </div>
          
          <div className="text-slate-500 text-xs text-center md:text-right">
            <p>© {new Date().getFullYear()} CR AudioViz AI. All rights reserved.</p>
            <p className="mt-1">
              Built with 5 AI Models: GPT-4, Claude, Gemini, Perplexity, Javari
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
