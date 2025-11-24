// app/api/market-oracle/generate-picks/route.ts
// V3 Compatible - Works with existing schema
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

type Category = 'regular' | 'penny' | 'crypto';

interface StockPick {
  ticker: string;
  category: Category;
  confidence: number;
  entry_price: number;
  target_price: number;
  reasoning: string;
}

const CATEGORY_PROMPTS: Record<Category, string> = {
  regular: `REGULAR STOCKS ($10+): Pick 5 stocks from major companies (FAANG, S&P 500). Examples: AAPL, NVDA, TSLA, GOOGL, AMZN, META, MSFT`,
  penny: `PENNY STOCKS (Under $5): Pick 5 stocks trading under $5. Focus on small caps, biotech, momentum plays. Examples: SNDL, MULN, SOFI, HOOD`,
  crypto: `CRYPTO: Pick 5 cryptocurrencies. Mix large caps (BTC, ETH) with altcoins (SOL, AVAX, MATIC, LINK, DOT, XRP, DOGE)`
};

function buildPrompt(category: Category): string {
  return `You are an AI investment analyst. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

${CATEGORY_PROMPTS[category]}

Provide EXACTLY 5 picks as JSON array:
[{"ticker":"SYM","confidence":75,"entry_price":100.00,"target_price":110.00,"reasoning":"Brief analysis"}]

Respond ONLY with valid JSON array, no markdown.`;
}

function parseResponse(text: string): StockPick[] {
  try {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']') + 1;
    if (start >= 0 && end > start) cleaned = cleaned.slice(start, end);
    
    return JSON.parse(cleaned).slice(0, 5).map((p: any) => ({
      ticker: String(p.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      confidence: Math.min(100, Math.max(0, Number(p.confidence) || 50)),
      entry_price: Number(p.entry_price) || 0,
      target_price: Number(p.target_price) || 0,
      reasoning: String(p.reasoning || '').slice(0, 500),
    }));
  } catch { return []; }
}

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  return (await res.json()).content[0].text;
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return (await res.json()).candidates[0].content.parts[0].text;
}

async function callPerplexity(prompt: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}` },
    body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

function getNextFriday(): string {
  const now = new Date();
  const days = (5 - now.getDay() + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(now.getDate() + days);
  fri.setHours(16, 0, 0, 0);
  return fri.toISOString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('trigger') !== 'manual') {
    return NextResponse.json({
      success: true,
      message: 'Market Oracle V3 - Weekly Picks Generator',
      categories: ['regular', 'penny', 'crypto'],
      picksPerAI: 15,
      totalWeekly: 75,
    });
  }
  return generatePicks();
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return generatePicks();
}

async function generatePicks() {
  const categories: Category[] = ['regular', 'penny', 'crypto'];
  const providers = [
    { name: 'GPT-4', call: callOpenAI },
    { name: 'Claude', call: callClaude },
    { name: 'Gemini', call: callGemini },
    { name: 'Perplexity', call: callPerplexity },
    { name: 'Javari', call: callClaude },
  ];

  // Get competition
  let { data: competition } = await supabase.from('competitions').select('*').eq('status', 'active').single();
  if (!competition) {
    const { data: newComp } = await supabase.from('competitions')
      .insert({ name: 'Q4 2025 AI Battle V3', status: 'active', start_date: new Date().toISOString() })
      .select().single();
    competition = newComp;
  }

  // Get AI models
  const { data: aiModels } = await supabase.from('ai_models').select('id, name').eq('is_active', true);
  const aiMap = new Map(aiModels?.map(m => [m.name, m.id]) || []);

  const weekNumber = Math.ceil((Date.now() - new Date(competition.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const expiryDate = getNextFriday();
  const results: any[] = [];
  let totalSaved = 0;
  const byCategory = { regular: 0, penny: 0, crypto: 0 };

  for (const ai of providers) {
    const aiResult = { name: ai.name, regular: 0, penny: 0, crypto: 0, total: 0, errors: [] as string[] };
    const aiModelId = aiMap.get(ai.name);

    if (!aiModelId) {
      aiResult.errors.push('AI model not found');
      results.push(aiResult);
      continue;
    }

    for (const category of categories) {
      try {
        const prompt = buildPrompt(category);
        const text = await ai.call(prompt);
        const picks = parseResponse(text);

        for (const pick of picks) {
          if (!pick.ticker) continue;

          // Store category in reasoning as prefix until schema updated
          const categoryReasoning = `[${category.toUpperCase()}] ${pick.reasoning}`;

          const { error } = await supabase.from('stock_picks').insert({
            competition_id: competition.id,
            ai_model_id: aiModelId,
            ticker: pick.ticker,
            confidence: pick.confidence,
            entry_price: pick.entry_price,
            target_price: pick.target_price,
            reasoning: categoryReasoning,
            week_number: weekNumber,
            pick_date: new Date().toISOString(),
            expiry_date: expiryDate,
            status: 'active',
          });

          if (!error) {
            aiResult[category]++;
            aiResult.total++;
            byCategory[category]++;
            totalSaved++;
          } else {
            aiResult.errors.push(`${pick.ticker}: ${error.message}`);
          }
        }
      } catch (e: any) {
        aiResult.errors.push(`${category}: ${e.message}`);
      }
    }
    results.push(aiResult);
  }

  return NextResponse.json({
    success: totalSaved > 0,
    competition: { id: competition.id, name: competition.name, week: weekNumber },
    summary: { totalPicks: totalSaved, byCategory },
    results,
    timestamp: new Date().toISOString(),
  });
}
