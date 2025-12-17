// ============================================================================
// JAVARI AI WIDGET - Market Oracle Edition
// ALL exports: JavariWidget, JavariHelpButton, triggerJavariHelp
// Fixed: 2025-12-17 11:45 EST
// ============================================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Message { 
  role: 'user' | 'assistant'; 
  content: string; 
}

// Global event for triggering Javari from anywhere
const JAVARI_TRIGGER_EVENT = 'javari-help-trigger';

/**
 * Trigger Javari AI help from anywhere in the app
 * @param message - Optional initial message to send
 */
export function triggerJavariHelp(message?: string) {
  window.dispatchEvent(new CustomEvent(JAVARI_TRIGGER_EVENT, { 
    detail: { message } 
  }));
}

// ============================================================================
// JAVARI HELP BUTTON - For inline help throughout the app
// ============================================================================
export function JavariHelpButton({ 
  topic, 
  className = '' 
}: { 
  topic: string; 
  className?: string; 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const helpTopics: Record<string, string> = {
    'ai-battle': 'The AI Battle Royale pits our 4 AI models against each other. Track their picks, win rates, and total returns to see which AI is performing best!',
    'hot-picks': 'Hot Picks shows the most confident recent stock recommendations from all AI models. Higher confidence means the AI is more certain about the direction.',
    'consensus': 'Javari Consensus combines all 4 AI opinions into a single verdict. When multiple AIs agree, the consensus is stronger.',
    'confidence': 'Confidence shows how certain an AI is about its prediction. 80%+ is high confidence, 60-80% is moderate.',
    'direction': 'UP means the AI expects the stock to rise, DOWN means fall, HOLD means stay relatively flat.',
    'win-rate': 'Win Rate shows the percentage of picks that ended profitably. Higher is better!',
    'credits': 'Credits are used for AI analysis. Each full analysis costs 5 credits. Buy more in your account settings.',
    'error': 'Something went wrong? Click to ask Javari for help troubleshooting the issue.',
    'default': 'Click to learn more about this feature. Javari AI is here to help!'
  };
  
  const helpText = helpTopics[topic] || helpTopics['default'];
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => {
          setShowTooltip(!showTooltip);
          if (topic === 'error') {
            triggerJavariHelp('I encountered an error. Can you help me troubleshoot?');
          }
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-cyan-500/30 rounded-lg shadow-xl text-sm text-gray-300">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>{helpText}</span>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN JAVARI WIDGET - Floating Chat Assistant
// ============================================================================
export default function JavariWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Javari, your AI stock analysis assistant. Ask me about any stock, our AI predictions, or how to use Market Oracle!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Listen for external triggers
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<{ message?: string }>) => {
      setIsOpen(true);
      if (event.detail.message) {
        setInput(event.detail.message);
        // Auto-send after a short delay
        setTimeout(() => {
          const msg = event.detail.message;
          if (msg) {
            setMessages(prev => [...prev, { role: 'user', content: msg }]);
            setLoading(true);
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "I see you're having an issue. Let me help! Could you tell me more about what you were trying to do when this happened? I can guide you through troubleshooting or suggest alternative approaches." 
              }]);
              setLoading(false);
            }, 800);
          }
        }, 300);
      }
    };

    window.addEventListener(JAVARI_TRIGGER_EVENT as any, handleTrigger as EventListener);
    return () => window.removeEventListener(JAVARI_TRIGGER_EVENT as any, handleTrigger as EventListener);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    
    setTimeout(() => {
      let response = "Thanks for your question! ";
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes('stock') || lowerMsg.includes('symbol') || lowerMsg.includes('ticker')) {
        response = "To analyze a stock, go to the Dashboard and enter any ticker symbol (like AAPL or MSFT). You can also search by company name! Our 4 AI models will provide their analysis and I'll give you the consensus verdict.";
      } else if (lowerMsg.includes('battle') || lowerMsg.includes('competition') || lowerMsg.includes('leaderboard')) {
        response = "The AI Battle Royale tracks the performance of our 4 AI models: GPT-4, Claude, Gemini, and Perplexity. View the leaderboard to see who's winning based on actual stock returns!";
      } else if (lowerMsg.includes('hot pick') || lowerMsg.includes('recommend') || lowerMsg.includes('trending')) {
        response = "Hot Picks shows recent high-confidence recommendations from all AI models. Filter by UP/DOWN direction or see what's trending. Remember, higher confidence doesn't guarantee success!";
      } else if (lowerMsg.includes('credit')) {
        response = "Each full stock analysis costs 5 credits. You can buy credits on the main CR AudioViz AI site. Free users get 50 credits to start!";
      } else if (lowerMsg.includes('error') || lowerMsg.includes('problem') || lowerMsg.includes('issue') || lowerMsg.includes('help')) {
        response = "I'm sorry you're experiencing issues! Here are some things to try:\n\n1. Refresh the page\n2. Clear your browser cache\n3. Try a different browser\n4. Check your internet connection\n\nIf the problem persists, please describe what you were trying to do and I'll do my best to help!";
      } else if (lowerMsg.includes('how') && (lowerMsg.includes('work') || lowerMsg.includes('use'))) {
        response = "Here's how Market Oracle works:\n\n1. Enter a stock ticker or company name\n2. Our 4 AI models analyze it independently\n3. I (Javari) combine their views into a consensus\n4. You get direction (UP/DOWN/HOLD), confidence %, and reasoning\n\nCheck the Battle page to see which AI is performing best!";
      } else if (lowerMsg.includes('search') || lowerMsg.includes('find') || lowerMsg.includes('company')) {
        response = "You can search for stocks two ways:\n\n1. By ticker symbol (e.g., AAPL, TSLA, NVDA)\n2. By company name (e.g., 'Apple', 'Tesla')\n\nJust type in the search box on the Dashboard and we'll find matching stocks for you!";
      } else {
        response = "I'm here to help with stock analysis! You can:\n\n• Search stocks by ticker OR company name\n• View AI Battle Royale rankings\n• See Hot Picks with highest confidence\n• Get consensus from 4 AI models\n\nWhat would you like to know more about?";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 800);
  }, [input, loading]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-110 transition-all flex items-center justify-center z-50"
          aria-label="Open Javari AI Assistant"
        >
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Javari AI</h3>
                <p className="text-xs text-gray-400">Stock Analysis Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-800 text-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 px-4 py-2 rounded-2xl">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-cyan-500/30">
            <div className="flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} 
                placeholder="Ask about stocks, AI picks..." 
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none" 
              />
              <button 
                onClick={sendMessage} 
                disabled={loading || !input.trim()} 
                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Part of CR AudioViz AI • Your Story. Our Design.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
