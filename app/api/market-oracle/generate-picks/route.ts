// app/api/market-oracle/generate-picks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // 5 minutes for all AI calls
export const dynamic = 'force-dynamic';

// Types
type Category = 'regular' | 'penny' | 'crypto';
type Direction = 'UP' | 'DOWN' | 'HOLD';
type AIProvider = 'openai' | 'claude' | 'gemini' | 'perplexity' | 'javari';

interface StockPick {
  ticker: string;
  category: Category;
  direction: Direction;
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
}

// Category-specific prompts
const CATEGORY_PROMPTS: Record<Category, string> = {
  regular: `REGULAR STOCKS (Large/Mid Cap, $10+):
Pick 5 stocks from well-known companies trading above $10.
Focus on: S&P 500, major tech, healthcare, finance, consumer, energy.
Examples: AAPL, NVDA, TSLA, GOOGL, AMZN, META, MSFT, JPM, JNJ, XOM, DIS, BA, V, MA`,
  
  penny: `PENNY STOCKS (Under $5):
Pick 5 penny stocks trading under $5 with high potential.
Focus on: Small caps, biotech, emerging tech, meme stocks, recent IPOs.
MUST be real tradeable stocks under $5. Research current prices.
Examples when under $5: SNDL, MULN, TELL, GSAT, WISH, OPEN, SOFI, HOOD, DNA`,
  
  crypto: `CRYPTOCURRENCY:
Pick 5 cryptocurrencies with strong potential.
Mix of: Large caps (BTC, ETH), mid caps (SOL, AVAX), and promising altcoins.
Focus on: Technical setups, upcoming catalysts, ecosystem growth.
Examples: BTC, ETH, SOL, AVAX, MATIC, LINK, DOT, ADA, XRP, DOGE, NEAR, ARB, OP`
};

function buildPrompt(category: Category, currentDate: string): string {
  return `You are an elite AI investment analyst in the Market Oracle AI Battle.
Today is ${currentDate}. Provide your ${category.toUpperCase()} picks.

${CATEGORY_PROMPTS[category]}

Provide EXACTLY 5 picks. For each:
- ticker: Symbol (uppercase, no special chars)
- direction: UP, DOWN, or HOLD
- confidence: 0-100
- entry_price: Current approximate price
- target_price: 7-day target
- stop_loss: Stop loss level
- reasoning: 2-3 sentences

Respond ONLY with JSON array, no markdown:
[{"ticker":"SYM","direction":"UP","confidence":75,"entry_price":100,"target_price":110,"stop_loss":95,"reasoning":"Analysis"}]`;
}

function parseResponse(text: string, category: Category): StockPick[] {
  try {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']') + 1;
    if (start >= 0 && end > start) cleaned = cleaned.slice(start, end);
    
    const picks = JSON.parse(cleaned);
    return picks.slice(0, 5).map((p: any) => ({
      ticker: String(p.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      category,
      direction: ['UP', 'DOWN', 'HOLD'].includes(p.direction) ? p.direction : 'HOLD',
      confidence: Math.min(100, Math.max(0, Number(p.confidence) || 50)),
      entry_price: Number(p.entry_price) || 0,
      target_price: Number(p.target_price) || 0,
      stop_loss: Number(p.stop_loss) || 0,
      reasoning: String(p.reasoning || '').slice(0, 500),
    }));
  } catch { return []; }
}

// AI Providers
async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callPerplexity(prompt: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}` },
    body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function getAIPicks(provider: AIProvider, category: Category, date: string, otherPicks: StockPick[] = []): Promise<StockPick[]> {
  let prompt = buildPrompt(category, date);
  if (provider === 'javari' && otherPicks.length > 0) {
    prompt += `\n\nOther AIs picked: ${[...new Set(otherPicks.map(p => p.ticker))].join(', ')}. Consider this for your analysis.`;
  }
  
  const text = provider === 'openai' ? await callOpenAI(prompt)
    : provider === 'claude' ? await callClaude(prompt)
    : provider === 'gemini' ? await callGemini(prompt)
    : provider === 'perplexity' ? await callPerplexity(prompt)
    : await callClaude(prompt); // Javari uses Claude
  
  return parseResponse(text, category);
}

function getNextFriday(): string {
  const now = new Date();
  const days = (5 - now.getDay() + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(now.getDate() + days);
  fri.setHours(16, 0, 0, 0);
  return fri.toISOString();
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return generatePicks();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('trigger') === 'manual') {
    return generatePicks();
  }
  
  return NextResponse.json({
    success: true,
    message: 'Market Oracle V3 - Weekly Picks Generator',
    categories: ['regular', 'penny', 'crypto'],
    picksPerAI: 15,
    totalWeekly: 75,
    schedule: 'Every Monday at 6 AM ET',
  });
}

async function generatePicks() {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const categories: Category[] = ['regular', 'penny', 'crypto'];
  const providers: { name: string; provider: AIProvider }[] = [
    { name: 'GPT-4', provider: 'openai' },
    { name: 'Claude', provider: 'claude' },
    { name: 'Gemini', provider: 'gemini' },
    { name: 'Perplexity', provider: 'perplexity' },
    { name: 'Javari', provider: 'javari' },
  ];
  
  // Get or create competition
  let { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .single();
  
  if (!competition) {
    const { data: newComp } = await supabase
      .from('competitions')
      .insert({ name: 'Q4 2025 AI Battle V3', status: 'active', start_date: new Date().toISOString() })
      .select()
      .single();
    competition = newComp;
  }
  
  // Calculate week number
  const startDate = new Date(competition.start_date);
  const weekNumber = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const expiryDate = getNextFriday();
  
  // Get AI model IDs
  const { data: aiModels } = await supabase.from('ai_models').select('id, name').eq('is_active', true);
  const aiMap = new Map(aiModels?.map(m => [m.name, m.id]) || []);
  
  const results: any[] = [];
  const allPicks: StockPick[] = [];
  let totalSaved = 0;
  
  // Generate for each AI
  for (const ai of providers) {
    const aiResult = { name: ai.name, regular: 0, penny: 0, crypto: 0, total: 0, errors: [] as string[] };
    const aiModelId = aiMap.get(ai.name);
    
    if (!aiModelId) {
      aiResult.errors.push('AI model not found in database');
      results.push(aiResult);
      continue;
    }
    
    // Generate for each category
    for (const category of categories) {
      try {
        const picks = await getAIPicks(ai.provider, category, currentDate, ai.provider === 'javari' ? allPicks : []);
        
        for (const pick of picks) {
          if (!pick.ticker) continue;
          
          const { error } = await supabase.from('stock_picks').insert({
            competition_id: competition.id,
            ai_model_id: aiModelId,
            ticker: pick.ticker,
            category: pick.category,
            direction: pick.direction,
            confidence: pick.confidence,
            entry_price: pick.entry_price,
            target_price: pick.target_price,
            stop_loss: pick.stop_loss,
            reasoning: pick.reasoning,
            week_number: weekNumber,
            pick_date: new Date().toISOString(),
            expiry_date: expiryDate,
            status: 'active',
          });
          
          if (!error) {
            aiResult[category]++;
            aiResult.total++;
            totalSaved++;
            allPicks.push(pick);
          }
        }
      } catch (e) {
        aiResult.errors.push(`${category}: ${e}`);
      }
    }
    
    results.push(aiResult);
  }
  
  return NextResponse.json({
    success: true,
    competition: { id: competition.id, name: competition.name, week: weekNumber },
    summary: {
      totalPicks: totalSaved,
      byCategory: {
        regular: allPicks.filter(p => p.category === 'regular').length,
        penny: allPicks.filter(p => p.category === 'penny').length,
        crypto: allPicks.filter(p => p.category === 'crypto').length,
      },
    },
    results,
    timestamp: new Date().toISOString(),
  });
}
