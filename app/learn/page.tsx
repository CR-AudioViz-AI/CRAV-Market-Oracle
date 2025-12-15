// app/learn/page.tsx
// Comprehensive Trading Education & Platform Training

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Award,
  Users,
  Lightbulb,
  AlertTriangle,
  DollarSign,
  Clock,
  Star
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string[];
  keyTakeaways: string[];
}

interface Module {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lessons: Lesson[];
}

const MODULES: Module[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: PlayCircle,
    description: 'Learn the basics of Market Oracle and how to use AI-powered analysis',
    lessons: [
      {
        id: 'intro',
        title: 'Introduction to Market Oracle',
        description: 'Understand what Market Oracle is and how it works',
        duration: '5 min',
        difficulty: 'Beginner',
        content: [
          'Market Oracle is a multi-AI stock analysis platform that combines predictions from four leading AI models: GPT-4, Claude, Gemini, and Perplexity.',
          'Each AI analyzes the same stock independently, bringing unique perspectives and methodologies.',
          'Our proprietary Javari AI then synthesizes these predictions into a weighted consensus verdict.',
          'This approach provides more balanced, well-rounded analysis than any single AI could offer.'
        ],
        keyTakeaways: [
          '4 AI models analyze each stock',
          'Javari creates weighted consensus',
          'Multiple perspectives reduce bias',
          'Learning system improves over time'
        ]
      },
      {
        id: 'navigation',
        title: 'Navigating the Dashboard',
        description: 'Learn to use all dashboard features effectively',
        duration: '8 min',
        difficulty: 'Beginner',
        content: [
          'The Dashboard is your command center. Enter any stock symbol to generate a fresh multi-AI analysis.',
          'Hot Picks shows trending stocks with strong AI consensus. These are stocks where multiple AIs agree.',
          'AI Battle lets you compare AI performance over time. See which AI is winning in accuracy.',
          'Click any stock card to expand and see detailed reasoning from each AI model.',
          'The Javari Consensus section shows the combined verdict with confidence level and reasoning.'
        ],
        keyTakeaways: [
          'Dashboard: Generate new analyses',
          'Hot Picks: High-consensus opportunities',
          'AI Battle: Compare AI performance',
          'Click to expand for full details'
        ]
      },
      {
        id: 'understanding-picks',
        title: 'Understanding AI Picks',
        description: 'Decode the information in each AI pick',
        duration: '10 min',
        difficulty: 'Beginner',
        content: [
          'Direction: UP means the AI expects the price to rise. DOWN means decline. HOLD suggests maintaining current position.',
          'Confidence: A percentage from 0-100 indicating how certain the AI is. Higher confidence = stronger conviction.',
          'Target Price: Where the AI expects the stock to reach within the timeframe.',
          'Stop Loss: The price level where you should exit if the trade goes wrong. This limits potential losses.',
          'Thesis: A brief summary of why the AI made this recommendation.',
          'Full Reasoning: The detailed analysis including technical, fundamental, and sentiment factors.',
          'Factor Assessments: Individual evaluation of metrics like P/E ratio, moving averages, volume, etc.'
        ],
        keyTakeaways: [
          'Direction tells you expected movement',
          'Confidence indicates AI certainty',
          'Always note the stop loss level',
          'Read full reasoning for context'
        ]
      }
    ]
  },
  {
    id: 'understanding-ai',
    title: 'Understanding Our AI Models',
    icon: Brain,
    description: 'Deep dive into each AI model\'s strengths and approach',
    lessons: [
      {
        id: 'gpt4',
        title: 'GPT-4: The Conservative Analyst',
        description: 'Learn GPT-4\'s analytical approach and when to trust it',
        duration: '7 min',
        difficulty: 'Intermediate',
        content: [
          'GPT-4 from OpenAI is known for thorough, methodical analysis. It tends to be conservative.',
          'Strengths: Deep reasoning, considering multiple scenarios, excellent at identifying risks.',
          'Tendency: Leans toward HOLD recommendations. When GPT-4 says BUY, it\'s usually well-considered.',
          'Best for: Long-term analysis, blue-chip stocks, risk assessment.',
          'Watch out for: Can be overly cautious, may miss momentum plays.',
          'When GPT-4 and another aggressive AI both say UP, that\'s a strong signal.'
        ],
        keyTakeaways: [
          'Conservative and thorough',
          'Strong on risk identification',
          'Trust its BUY signals more',
          'Best for long-term analysis'
        ]
      },
      {
        id: 'gemini',
        title: 'Gemini: The Technical Pattern Spotter',
        description: 'How Gemini analyzes charts and patterns',
        duration: '7 min',
        difficulty: 'Intermediate',
        content: [
          'Google\'s Gemini excels at pattern recognition and technical analysis.',
          'Strengths: Chart patterns, support/resistance levels, price targets.',
          'Methodology: Focuses heavily on technical indicators like moving averages, RSI, MACD.',
          'Best for: Short-term trades, swing trading, identifying entry/exit points.',
          'Watch out for: May miss fundamental changes, can be whipsawed in choppy markets.',
          'When Gemini identifies a breakout pattern with high confidence, pay attention.'
        ],
        keyTakeaways: [
          'Technical analysis specialist',
          'Strong on price patterns',
          'Great for swing trades',
          'Trust breakout signals'
        ]
      },
      {
        id: 'perplexity',
        title: 'Perplexity: The News Hunter',
        description: 'How Perplexity uses real-time data',
        duration: '7 min',
        difficulty: 'Intermediate',
        content: [
          'Perplexity is connected to real-time web data, making it uniquely current.',
          'Strengths: Breaking news integration, sentiment analysis, recent developments.',
          'Methodology: Searches the web for latest information, analyst updates, news events.',
          'Best for: Event-driven trades, earnings plays, reacting to news.',
          'Watch out for: Can be reactive, may overweight recent news.',
          'When Perplexity has news-driven conviction, check if other AIs support the thesis.'
        ],
        keyTakeaways: [
          'Real-time data connection',
          'Best for news-driven plays',
          'Great for earnings analysis',
          'Cross-reference with other AIs'
        ]
      },
      {
        id: 'javari',
        title: 'Javari: The Consensus Builder',
        description: 'How our proprietary AI creates unified verdicts',
        duration: '10 min',
        difficulty: 'Intermediate',
        content: [
          'Javari AI is CR AudioViz\'s proprietary consensus engine. It\'s not just averaging - it\'s intelligent weighting.',
          'Weights each AI based on: Historical accuracy, sector-specific performance, current confidence level.',
          'Consensus Strength: STRONG (80%+ agreement), MODERATE (60-80%), WEAK (<60%), SPLIT (no agreement).',
          'Learning System: Javari tracks outcomes and adjusts weights over time. Better performers get more influence.',
          'When to trust most: STRONG consensus with 70%+ confidence. All or most AIs agreeing.',
          'When to be cautious: WEAK or SPLIT consensus. This indicates genuine uncertainty.',
          'The Javari confidence score factors in both agreement level and individual confidence scores.'
        ],
        keyTakeaways: [
          'Intelligent weighting, not averaging',
          'Tracks and learns from outcomes',
          'Trust STRONG consensus most',
          'SPLIT means genuine uncertainty'
        ]
      }
    ]
  },
  {
    id: 'trading-fundamentals',
    title: 'Trading Fundamentals',
    icon: BarChart3,
    description: 'Essential trading concepts every investor should know',
    lessons: [
      {
        id: 'risk-management',
        title: 'Risk Management Essentials',
        description: 'Protect your capital with proper risk management',
        duration: '12 min',
        difficulty: 'Beginner',
        content: [
          'Rule #1: Never risk more than 1-2% of your portfolio on a single trade.',
          'Always use stop losses. Market Oracle provides stop loss levels - use them.',
          'Position sizing: If your stop loss is 5% below entry, and you want to risk 1% of portfolio, position size = 20% of portfolio.',
          'Diversification: Don\'t put all picks in one sector. Spread across different industries.',
          'The Kelly Criterion: Optimal bet size = Edge / Odds. Our AI confidence can help estimate edge.',
          'Emotional discipline: Stick to your plan. Don\'t chase losses or get greedy on wins.',
          'Review and learn: Track your trades, analyze what worked, adjust strategy.'
        ],
        keyTakeaways: [
          'Never risk >2% per trade',
          'Always use stop losses',
          'Size positions based on risk',
          'Diversify across sectors'
        ]
      },
      {
        id: 'technical-basics',
        title: 'Technical Analysis Basics',
        description: 'Understanding charts and indicators',
        duration: '15 min',
        difficulty: 'Intermediate',
        content: [
          'Support: Price level where buying pressure prevents further decline. Look for multiple touches.',
          'Resistance: Price level where selling pressure prevents further rise. Breakouts above are bullish.',
          'Moving Averages: SMA50 (50-day simple moving average) and SMA200 are key. Price above both is bullish.',
          'Golden Cross: When SMA50 crosses above SMA200 - bullish signal.',
          'Death Cross: When SMA50 crosses below SMA200 - bearish signal.',
          'Volume: Confirms price moves. High volume on breakout = more reliable. Low volume = suspect.',
          'RSI (Relative Strength Index): Above 70 = overbought, below 30 = oversold.',
          'Our AIs analyze all these factors and more in their assessments.'
        ],
        keyTakeaways: [
          'Support/resistance are key levels',
          'Moving averages show trend',
          'Volume confirms moves',
          'RSI shows overbought/oversold'
        ]
      },
      {
        id: 'fundamental-basics',
        title: 'Fundamental Analysis Basics',
        description: 'Evaluating a company\'s true value',
        duration: '15 min',
        difficulty: 'Intermediate',
        content: [
          'P/E Ratio: Price divided by Earnings. Lower = cheaper. Compare to sector average.',
          'Revenue Growth: Is the company growing? Look for consistent year-over-year growth.',
          'Profit Margins: Higher margins = more efficient business. Watch for margin expansion/contraction.',
          'Debt/Equity: How leveraged is the company? High debt = higher risk.',
          'Free Cash Flow: Cash generated after expenses. Companies need FCF to survive and grow.',
          'Market Cap: Total value of all shares. Mega-cap (>$200B) vs small-cap (<$2B) have different risk profiles.',
          'Sector Context: Tech companies often have higher P/Es than utilities. Compare apples to apples.',
          'Our AIs evaluate these factors and include them in Factor Assessments.'
        ],
        keyTakeaways: [
          'P/E for relative value',
          'Revenue growth shows trajectory',
          'Watch debt levels',
          'Compare within sectors'
        ]
      }
    ]
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Strategies',
    icon: Target,
    description: 'Maximize your use of Market Oracle',
    lessons: [
      {
        id: 'reading-consensus',
        title: 'Reading AI Consensus Like a Pro',
        description: 'Extract maximum value from multi-AI analysis',
        duration: '10 min',
        difficulty: 'Advanced',
        content: [
          'Strong Agreement (4/4 AIs same direction): Highest conviction. Consider larger position size.',
          'Mixed Agreement (3/4 AIs agree): Good signal, but note the dissenting view. Understand why one AI disagrees.',
          'Split Decision (2/2 split): Market is uncertain. May be good to wait or reduce position size.',
          'Confidence Dispersion: If all AIs agree but confidences vary widely (e.g., 90%, 60%, 50%, 45%), be cautious.',
          'Unanimous High Confidence: Very rare. When it happens, pay close attention.',
          'Watch for AI-specific patterns: If Perplexity is bullish due to news but others are bearish on fundamentals, the news may be priced in.',
          'Time your entry: Use Gemini\'s technical levels for entry points, Perplexity for timing around events.'
        ],
        keyTakeaways: [
          '4/4 agreement = highest conviction',
          'Understand dissenting views',
          'Split decisions = wait',
          'Use each AI for its strength'
        ]
      },
      {
        id: 'sector-rotation',
        title: 'Sector Rotation with AI',
        description: 'Use AI analysis for sector allocation',
        duration: '12 min',
        difficulty: 'Advanced',
        content: [
          'Track AI accuracy by sector over time. Some AIs may excel in tech, others in healthcare.',
          'Economic cycles favor different sectors. Use AI consensus to identify rotating leadership.',
          'Defensive vs Cyclical: In uncertain times, look for AI consensus in defensive sectors (utilities, healthcare, staples).',
          'Growth vs Value: Tech AIs may favor growth. Traditional analysis AIs may favor value. Balance both.',
          'Monitor the AI Battle leaderboard by sector to see which AI to weight more heavily.',
          'Look for sector-wide AI agreement. If all AIs are bullish on financials, consider sector ETF.',
          'Contrarian plays: When all AIs are bearish on a sector, it may be near a bottom. Watch for sentiment shift.'
        ],
        keyTakeaways: [
          'Track AI performance by sector',
          'Rotate with economic cycle',
          'Balance growth and value AIs',
          'Consider sector ETFs on consensus'
        ]
      }
    ]
  },
  {
    id: 'platform-features',
    title: 'Platform Features Deep Dive',
    icon: Zap,
    description: 'Master every feature of Market Oracle',
    lessons: [
      {
        id: 'ai-battle',
        title: 'Mastering AI Battle',
        description: 'Use the leaderboard to optimize your strategy',
        duration: '8 min',
        difficulty: 'Intermediate',
        content: [
          'AI Battle shows real-time performance rankings based on actual pick outcomes.',
          'Win Rate: Percentage of picks that hit target before stop loss or expiration.',
          'Total Return: Simulated return if you followed all picks with equal position sizes.',
          'Average Confidence: How confident this AI tends to be. High confidence + high win rate = reliable.',
          'Use the leaderboard to weight your own decisions. If SwingTrader X is crushing it, weight their picks more.',
          'Click any AI to see their full pick history with detailed reasoning.',
          'Rankings update in real-time as picks expire and outcomes are determined.'
        ],
        keyTakeaways: [
          'Track AI performance over time',
          'High win rate + high confidence = best',
          'Weight top performers more heavily',
          'Click for detailed history'
        ]
      },
      {
        id: 'hot-picks',
        title: 'Understanding Hot Picks',
        description: 'Find high-consensus opportunities',
        duration: '6 min',
        difficulty: 'Beginner',
        content: [
          'Hot Picks surfaces stocks with strong multi-AI consensus.',
          'Filter by direction (UP/DOWN/HOLD), sector, and confidence level.',
          'Recent Picks shows the latest analyses across all stocks.',
          'Trending shows stocks being analyzed most frequently by users.',
          'Click any pick to see full breakdown from each AI.',
          'Set up alerts to be notified when consensus reaches your threshold.',
          'Hot Picks is great for finding opportunities you might not have considered.'
        ],
        keyTakeaways: [
          'High consensus stocks',
          'Filter by your criteria',
          'Great for discovery',
          'Set up alerts'
        ]
      },
      {
        id: 'stock-detail',
        title: 'Stock Detail Pages',
        description: 'Extract maximum insight from each stock',
        duration: '8 min',
        difficulty: 'Intermediate',
        content: [
          'Click any stock to open its dedicated analysis page.',
          'See every AI\'s individual analysis expanded - full reasoning, factors, risks.',
          'Compare target prices across AIs. Large dispersion = high uncertainty.',
          'Read each AI\'s thesis carefully. Different AIs may highlight different catalysts or risks.',
          'Factor Assessments show how each AI evaluated specific metrics. Look for disagreements.',
          'Generate fresh analysis anytime with the Refresh button.',
          'Historical analyses are saved. Track how AI views changed over time.'
        ],
        keyTakeaways: [
          'Full individual AI reasoning',
          'Compare across all AIs',
          'Factor assessment details',
          'Track view changes over time'
        ]
      }
    ]
  }
];

export default function LearnPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>('getting-started');
  const [expandedLesson, setExpandedLesson] = useState<string | null>('intro');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Market Oracle Academy</h1>
              <p className="text-gray-400">Master AI-powered trading with comprehensive lessons</p>
            </div>
          </div>
          
          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-2 text-gray-400">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>{MODULES.reduce((a, m) => a + m.lessons.length, 0)} Lessons</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>~2 hours total</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Certificate on completion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Module List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 text-gray-400">Modules</h2>
            <nav className="space-y-2">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = expandedModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setExpandedModule(isActive ? null : module.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${
                      isActive ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{module.title}</span>
                    {isActive ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {MODULES.map((module) => {
              if (expandedModule !== module.id) return null;
              const Icon = module.icon;
              
              return (
                <div key={module.id}>
                  {/* Module Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{module.title}</h2>
                      <p className="text-gray-400">{module.description}</p>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-4">
                    {module.lessons.map((lesson) => {
                      const isExpanded = expandedLesson === lesson.id;
                      
                      return (
                        <div
                          key={lesson.id}
                          className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                        >
                          {/* Lesson Header */}
                          <button
                            onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                            className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50 transition"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-amber-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg">{lesson.title}</h3>
                                <p className="text-sm text-gray-500">{lesson.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                                lesson.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {lesson.difficulty}
                              </span>
                              <span className="text-gray-500 text-sm">{lesson.duration}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Lesson Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-800 p-6 space-y-6">
                              {/* Main Content */}
                              <div className="space-y-4">
                                {lesson.content.map((paragraph, i) => (
                                  <p key={i} className="text-gray-300 leading-relaxed">
                                    {paragraph}
                                  </p>
                                ))}
                              </div>

                              {/* Key Takeaways */}
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
                                <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-5 h-5" />
                                  Key Takeaways
                                </h4>
                                <ul className="space-y-2">
                                  {lesson.keyTakeaways.map((takeaway, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-300">
                                      <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                                      {takeaway}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold mb-4">Ready to Put Your Knowledge to Work?</h2>
          <p className="text-gray-400 mb-6">
            Start analyzing stocks with our AI-powered platform
          </p>
          <Link
            href="/ai-picks"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition"
          >
            <TrendingUp className="w-5 h-5" />
            Start Analyzing
          </Link>
        </div>
      </div>
    </div>
  );
}
