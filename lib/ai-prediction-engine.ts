/**
 * MARKET ORACLE - AI PREDICTION ENGINE
 * Generates stock picks from 5 AI models
 * GPT-4, Claude, Gemini, Perplexity, Javari
 * November 24, 2025 - 4:47 AM ET
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StockPick {
  ticker: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
}

interface AIResponse {
  aiModel: string;
  picks: StockPick[];
  timestamp: string;
  success: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT TEMPLATE
// ═══════════════════════════════════════════════════════════════

function getAnalysisPrompt(currentDate: string, previousPicks?: string): string {
  return `You are a professional stock market analyst participating in a weekly stock picking competition.

CURRENT DATE: ${currentDate}
TASK: Pick 5-7 stocks for the upcoming week (next 5 trading days).

${previousPicks ? `PREVIOUS PICKS BY OTHER AIs:\n${previousPicks}\n` : ''}

For each stock, provide:
1. Ticker symbol (e.g., AAPL, TSLA)
2. Direction: UP, DOWN, or HOLD
3. Confidence level: 0-100 (how confident you are)
4. Entry price: Current/expected entry price
5. Target price: Expected price at end of week
6. Stop loss: Price at which to exit if wrong
7. Reasoning: 2-3 sentence explanation

IMPORTANT RULES:
- Pick diverse sectors (tech, finance, healthcare, energy, etc.)
- Use realistic price targets based on current market
- Confidence should reflect actual market volatility
- Stop losses should be reasonable (5-10% typical)
- Consider recent news and market trends
- Be honest about uncertainty

RESPOND IN VALID JSON ONLY:
{
  "picks": [
    {
      "ticker": "AAPL",
      "direction": "UP",
      "confidence": 75,
      "entryPrice": 180.50,
      "targetPrice": 188.00,
      "stopLoss": 175.00,
      "reasoning": "Strong iPhone 16 sales momentum and Services growth accelerating. Upcoming AI features announcement could drive further upside."
    }
  ]
}

DO NOT include any text before or after the JSON. Only output valid JSON.`;
}

// ═══════════════════════════════════════════════════════════════
// AI CLIENTS
// ═══════════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const gemini = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!
);

// ═══════════════════════════════════════════════════════════════
// GPT-4 PREDICTION
// ═══════════════════════════════════════════════════════════════

async function getGPT4Picks(prompt: string): Promise<AIResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert stock analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content || '';
    
    // Clean JSON (remove markdown if present)
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      aiModel: 'GPT-4',
      picks: parsed.picks,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('GPT-4 error:', error);
    return {
      aiModel: 'GPT-4',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE PREDICTION
// ═══════════════════════════════════════════════════════════════

async function getClaudePicks(prompt: string): Promise<AIResponse> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: 'You are an expert stock analyst. Always respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Clean JSON
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      aiModel: 'Claude',
      picks: parsed.picks,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Claude error:', error);
    return {
      aiModel: 'Claude',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// GEMINI PREDICTION
// ═══════════════════════════════════════════════════════════════

async function getGeminiPicks(prompt: string): Promise<AIResponse> {
  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });

    const responseText = result.response.text();
    
    // Clean JSON
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      aiModel: 'Gemini',
      picks: parsed.picks,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Gemini error:', error);
    return {
      aiModel: 'Gemini',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// PERPLEXITY PREDICTION
// ═══════════════════════════════════════════════════════════════

async function getPerplexityPicks(prompt: string): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert stock analyst with real-time web access. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Clean JSON
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      aiModel: 'Perplexity',
      picks: parsed.picks,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Perplexity error:', error);
    return {
      aiModel: 'Perplexity',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// JAVARI PREDICTION
// ═══════════════════════════════════════════════════════════════

async function getJavariPicks(prompt: string, previousPicks: AIResponse[]): Promise<AIResponse> {
  try {
    // Javari sees what all other AIs picked and learns from them
    const otherPicksSummary = previousPicks
      .filter(r => r.success)
      .map(r => `${r.aiModel}: ${r.picks.length} picks`)
      .join(', ');

    const javariPrompt = `${prompt}

OTHER AI MODELS' PICKS:
${otherPicksSummary}

You have access to what the other AIs picked. Use this information wisely:
- Look for consensus (multiple AIs picking same stock)
- Find opportunities others missed
- Identify where others might be wrong
- Make your own independent analysis

Your goal is to learn from others while making better predictions.`;

    // Call Javari's API
    const response = await fetch('https://javariai.com/api/javari/stock-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JAVARI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: javariPrompt,
        previousPicks: previousPicks.map(r => ({
          aiModel: r.aiModel,
          picks: r.picks,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Javari API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.response || data.content;
    
    // Clean JSON
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      aiModel: 'Javari',
      picks: parsed.picks,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Javari error:', error);
    // Fallback: Use Claude as Javari's backend
    return getClaudePicks(prompt);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN: GENERATE ALL PREDICTIONS
// ═══════════════════════════════════════════════════════════════

export async function generateAllPredictions(): Promise<AIResponse[]> {
  const currentDate = new Date().toISOString().split('T')[0];
  const basePrompt = getAnalysisPrompt(currentDate);

  console.log('🤖 Starting AI prediction generation...');

  // Run first 4 AIs in parallel
  const [gpt4Result, claudeResult, geminiResult, perplexityResult] = await Promise.all([
    getGPT4Picks(basePrompt),
    getClaudePicks(basePrompt),
    getGeminiPicks(basePrompt),
    getPerplexityPicks(basePrompt),
  ]);

  console.log('✅ Got predictions from 4 AIs');

  // Javari goes last and learns from others
  const javariResult = await getJavariPicks(
    basePrompt,
    [gpt4Result, claudeResult, geminiResult, perplexityResult]
  );

  console.log('✅ Got Javari prediction (learned from others)');

  return [gpt4Result, claudeResult, geminiResult, perplexityResult, javariResult];
}

// ═══════════════════════════════════════════════════════════════
// SAVE TO DATABASE
// ═══════════════════════════════════════════════════════════════

export async function savePredictionsToDatabase(
  predictions: AIResponse[],
  competitionId: string,
  weekNumber: number
): Promise<void> {
  const pickDate = new Date().toISOString().split('T')[0];
  
  for (const prediction of predictions) {
    if (!prediction.success || prediction.picks.length === 0) {
      console.log(`⚠️  Skipping ${prediction.aiModel} - no valid picks`);
      continue;
    }

    // Get AI model ID
    const { data: aiModel } = await supabase
      .from('ai_models')
      .select('id')
      .eq('name', prediction.aiModel)
      .single();

    if (!aiModel) {
      console.log(`⚠️  AI model not found: ${prediction.aiModel}`);
      continue;
    }

    // Save each pick
    for (const pick of prediction.picks) {
      await supabase.from('stock_picks').insert({
        competition_id: competitionId,
        ai_model_id: aiModel.id,
        ticker: pick.ticker.toUpperCase(),
        pick_date: pickDate,
        week_number: weekNumber,
        direction: pick.direction,
        confidence: pick.confidence,
        entry_price: pick.entryPrice,
        target_price: pick.targetPrice,
        stop_loss: pick.stopLoss,
        reasoning: pick.reasoning,
        expiry_date: getWeekEndDate(pickDate),
      });
    }

    console.log(`✅ Saved ${prediction.picks.length} picks for ${prediction.aiModel}`);
  }
}

// Helper: Get end of trading week (Friday)
function getWeekEndDate(dateString: string): string {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
  date.setDate(date.getDate() + daysUntilFriday);
  return date.toISOString().split('T')[0];
}
