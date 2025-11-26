// components/JavariWidget.tsx - Floating AI Assistant
'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, ExternalLink } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function JavariWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Javari AI 👋 I can help you understand Market Oracle, explain AI picks, or answer questions about the platform. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    'How do I read stock picks?',
    'Which AI is best?',
    'What does P&L mean?',
    'Is this real trading?'
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (in production, this would call the Javari API)
    setTimeout(() => {
      let response = '';
      const lowerMsg = userMessage.toLowerCase();
      
      if (lowerMsg.includes('read') || lowerMsg.includes('understand') || lowerMsg.includes('pick')) {
        response = 'Each pick shows: **Entry Price** (when AI picked it), **Current Price** (live), **Target** (AI\'s prediction), and **P&L %** (actual performance in green/red). The "Target ↑" badge shows what the AI predicts will happen.';
      } else if (lowerMsg.includes('best') || lowerMsg.includes('which ai') || lowerMsg.includes('accurate')) {
        response = 'No single AI is always best! Performance varies by market conditions. Check the **AI Battle** page to see current rankings. GPT-4 tends to be conservative, while Javari often finds riskier plays.';
      } else if (lowerMsg.includes('p&l') || lowerMsg.includes('profit') || lowerMsg.includes('loss')) {
        response = 'P&L = Profit & Loss. It\'s calculated as: ((Current Price - Entry Price) / Entry Price) × 100. Green = profit, Red = loss, Gray "EVEN" = no change.';
      } else if (lowerMsg.includes('real') || lowerMsg.includes('trade') || lowerMsg.includes('money') || lowerMsg.includes('invest')) {
        response = '⚠️ **Important**: Market Oracle is for **educational purposes only**. These are NOT real trades and should NOT be used for actual investment decisions. Always consult a licensed financial advisor.';
      } else if (lowerMsg.includes('update') || lowerMsg.includes('price') || lowerMsg.includes('refresh')) {
        response = 'Prices update every **15 minutes** during market hours (9 AM - 4 PM EST, Mon-Fri). Crypto updates every 4 hours on weekends. New picks are generated every Sunday at 8 AM.';
      } else if (lowerMsg.includes('category') || lowerMsg.includes('penny') || lowerMsg.includes('crypto')) {
        response = 'We have 3 categories: **Regular Stocks** (large-cap >$10), **Penny Stocks** (small-cap <$5, higher risk), and **Crypto** (Bitcoin, Ethereum, etc.). Use the tabs on the dashboard to filter.';
      } else {
        response = 'Great question! For detailed help, check out our **Help Center** or visit the full Javari AI at craudiovizai.com/javari for more comprehensive assistance. Is there something specific about Market Oracle I can clarify?';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Javari AI</div>
                <div className="text-xs text-slate-400">Market Oracle Assistant</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  {msg.content.split('**').map((part, j) => 
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about Market Oracle..."
                className="flex-1 px-4 py-2 bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <a 
              href="https://craudiovizai.com/javari" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Full Javari AI Experience <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
