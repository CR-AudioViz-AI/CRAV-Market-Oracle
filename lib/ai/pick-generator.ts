// lib/ai/pick-generator.ts
// Market Oracle Ultimate - Real AI Pick Generator
// Updated: December 14, 2025
// Purpose: Generate stock picks using REAL AI API calls with full reasoning

import { createClient } from '@supabase/supabase-js';
import type { 
  AIModelName, 
  AIPick, 
  PickDirection,
  FactorAssessment
} from '../types/learning';
import { getLatestCalibration } from '../learning/calibration-engine';
import { buildJavariConsensus } from '../learning/javari-consensus';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// AI API ENDPOINTS & CONFIGS - UPDATED December 14, 2025
// ============================================================================

interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

const AI_CONFIGS: Record<Exclude<AIModelName, 'javari'>, AIConfig> = {
  gpt4: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: true, // WORKING
  },
  claude: {
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: false, // DISABLED - needs billing credits
  },
  gemini: {
    model: 'gemini-1.5-flash',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: false, // DISABLED - API key 403 error
  },
  perplexity: {
    model: 'sonar', // UPDATED from llama-3.1-sonar-large-128k-online
    maxTokens: 2000,
    temperature: 0.3,
    enabled: true, // WORKING
  },
};

// ============================================================================
// MARKET DATA FETCHER
// ============================================================================

interface MarketData {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  high52Week: number;
  low52Week: number;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
}

async function getMarketData(symbol: string): Promise<MarketData | null> {
  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    // Get quote data
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];

    if (!quote || !quote['05. price']) {
      console.log(`No quote data for ${symbol}`);
      return null;
    }

    // Get company overview
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const overview = await overviewResponse.json();

    return {
      symbol: symbol.toUpperCase(),
      companyName: overview.Name || symbol,
      sector: overview.Sector || 'Unknown',
      currentPrice: parseFloat(quote['05. price']),
      change24h: parseFloat(quote['09. change'] || '0'),
      changePercent24h: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
      volume: parseInt(quote['06. volume'] || '0'),
      avgVolume: parseInt(overview.AverageVolume || '0'),
      marketCap: parseInt(overview.MarketCapitalization || '0'),
      peRatio: overview.PERatio ? parseFloat(overview.PERatio) : null,
      high52Week: parseFloat(overview['52WeekHigh'] || quote['03. high']),
      low52Week: parseFloat(overview['52WeekLow'] || quote['04. low']),
      sma50: overview['50DayMovingAverage'] ? parseFloat(overview['50DayMovingAverage']) : null,
      sma200: overview['200DayMovingAverage'] ? parseFloat(overview['200DayMovingAverage']) : null,
      rsi: null,
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// BUILD ANALYSIS PROMPT
// ============================================================================

function buildAnalysisPrompt(
  marketData: MarketData,
  calibration: { bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null,
  recentNews: string[]
): string {
  let prompt = `You are a professional stock analyst for Market Oracle. Analyze ${marketData.symbol} (${marketData.companyName}) and provide a pick recommendation.

## CURRENT MARKET DATA
- Symbol: ${marketData.symbol}
- Company: ${marketData.companyName}
- Sector: ${marketData.sector}
- Current Price: $${marketData.currentPrice.toFixed(2)}
- 24h Change: ${marketData.changePercent24h.toFixed(2)}%
- Volume: ${marketData.volume.toLocaleString()} (Avg: ${marketData.avgVolume.toLocaleString()})
- Market Cap: $${(marketData.marketCap / 1e9).toFixed(2)}B
- P/E Ratio: ${marketData.peRatio || 'N/A'}
- 52-Week Range: $${marketData.low52Week.toFixed(2)} - $${marketData.high52Week.toFixed(2)}
- SMA 50: ${marketData.sma50 ? `$${marketData.sma50.toFixed(2)}` : 'N/A'}
- SMA 200: ${marketData.sma200 ? `$${marketData.sma200.toFixed(2)}` : 'N/A'}

## RECENT NEWS
${recentNews.length > 0 ? recentNews.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'No recent news available.'}
`;

  if (calibration) {
    prompt += `
## YOUR CALIBRATION NOTES (Based on past performance)
- Best sectors for you: ${calibration.bestSectors.join(', ') || 'Still learning'}
- Sectors to be cautious in: ${calibration.worstSectors.join(', ') || 'Still learning'}
- Adjustments to make: ${calibration.adjustments.slice(0, 3).join('; ') || 'None yet'}
`;
  }

  prompt += `
## YOUR TASK
Analyze this stock and provide a recommendation. You MUST respond in this EXACT JSON format:

{
  "direction": "UP" | "DOWN" | "HOLD",
  "confidence": <number 0-100>,
  "thesis": "<one sentence summary of your thesis>",
  "full_reasoning": "<detailed 2-3 paragraph analysis>",
  "target_price": <number - your price target>,
  "stop_loss": <number - your stop loss>,
  "timeframe": "1W" | "2W" | "1M",
  "factor_assessments": [
    {
      "factorId": "pe_ratio" | "volume_trend" | "sma_50" | "news_sentiment" | "price_momentum_1m",
      "factorName": "<human readable name>",
      "value": "<the value you observed>",
      "interpretation": "BULLISH" | "BEARISH" | "NEUTRAL",
      "confidence": <0-100>,
      "reasoning": "<why this factor matters for this pick>"
    }
  ],
  "key_bullish_factors": ["<factor 1>", "<factor 2>"],
  "key_bearish_factors": ["<factor 1>", "<factor 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "catalysts": ["<upcoming catalyst 1>", "<catalyst 2>"]
}

IMPORTANT:
- Be specific with numbers and reasoning
- Your confidence should reflect your actual certainty (don't be overconfident)
- Include at least 3 factor assessments
- Stop loss should typically be 5-10% from entry
- Target should reflect your timeframe (1W: 2-5%, 2W: 5-10%, 1M: 10-20%)
- If you don't have a strong view, use "HOLD" with lower confidence

Respond ONLY with the JSON object, no additional text or markdown.`;

  return prompt;
}

// ============================================================================
// CALL GPT-4
// ============================================================================

async function callGPT4(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIGS.gpt4.model,
        messages: [
          { role: 'system', content: 'You are a professional stock analyst. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI_CONFIGS.gpt4.maxTokens,
        temperature: AI_CONFIGS.gpt4.temperature,
      }),
    });

    if (!response.ok) {
      console.error(`GPT-4 API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4 call failed:', error);
    return null;
  }
}

// ============================================================================
// CALL CLAUDE - DISABLED (needs billing)
// ============================================================================

async function callClaude(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.claude.enabled) {
    console.log('Claude API disabled - needs billing credits');
    return null;
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIGS.claude.model,
        max_tokens: AI_CONFIGS.claude.maxTokens,
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude call failed:', error);
    return null;
  }
}

// ============================================================================
// CALL GEMINI - DISABLED (API key issue)
// ============================================================================

async function callGemini(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.gemini.enabled) {
    console.log('Gemini API disabled - 403 error');
    return null;
  }
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIGS.gemini.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini call failed:', error);
    return null;
  }
}

// ============================================================================
// CALL PERPLEXITY - WORKING
// ============================================================================

async function callPerplexity(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.perplexity.enabled) {
    console.log('Perplexity API disabled');
    return null;
  }
  
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIGS.perplexity.model, // "sonar"
        messages: [
          { role: 'system', content: 'You are a professional stock analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI_CONFIGS.perplexity.maxTokens,
        temperature: AI_CONFIGS.perplexity.temperature,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Perplexity call failed:', error);
    return null;
  }
}

// ============================================================================
// PARSE AI RESPONSE
// ============================================================================

function parseAIResponse(response: string, aiModel: AIModelName, marketData: MarketData): AIPick | null {
  try {
    // Clean up response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    const pick: AIPick = {
      id: crypto.randomUUID(),
      ai_model: aiModel,
      symbol: marketData.symbol,
      company_name: marketData.companyName,
      sector: marketData.sector,
      direction: parsed.direction as PickDirection,
      confidence: parsed.confidence,
      timeframe: parsed.timeframe || '1W',
      entry_price: marketData.currentPrice,
      target_price: parsed.target_price,
      stop_loss: parsed.stop_loss,
      thesis: parsed.thesis,
      full_reasoning: parsed.full_reasoning,
      factor_assessments: parsed.factor_assessments || [],
      key_bullish_factors: parsed.key_bullish_factors || [],
      key_bearish_factors: parsed.key_bearish_factors || [],
      risks: parsed.risks || [],
      catalysts: parsed.catalysts || [],
      created_at: new Date().toISOString(),
      expires_at: getExpirationDate(parsed.timeframe || '1W'),
      status: 'PENDING',
    };

    return pick;
  } catch (error) {
    console.error(`Failed to parse ${aiModel} response:`, error);
    console.error('Raw response:', response.substring(0, 500));
    return null;
  }
}

function getExpirationDate(timeframe: string): string {
  const now = new Date();
  switch (timeframe) {
    case '1W':
      now.setDate(now.getDate() + 7);
      break;
    case '2W':
      now.setDate(now.getDate() + 14);
      break;
    case '1M':
      now.setDate(now.getDate() + 30);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }
  return now.toISOString();
}

// ============================================================================
// GENERATE PICK FROM SPECIFIC AI
// ============================================================================

export async function generatePickFromAI(
  aiModel: Exclude<AIModelName, 'javari'>,
  symbol: string
): Promise<AIPick | null> {
  console.log(`Generating ${aiModel} pick for ${symbol}...`);
  
  // Check if model is enabled
  if (!AI_CONFIGS[aiModel].enabled) {
    console.log(`${aiModel} is disabled`);
    return null;
  }

  // Get market data
  const marketData = await getMarketData(symbol);
  if (!marketData) {
    console.error(`Could not get market data for ${symbol}`);
    return null;
  }

  // Get calibration data if available
  const calibration = await getLatestCalibration(aiModel);

  // Build prompt
  const prompt = buildAnalysisPrompt(marketData, calibration, []);

  // Call appropriate AI
  let response: string | null = null;
  switch (aiModel) {
    case 'gpt4':
      response = await callGPT4(prompt);
      break;
    case 'claude':
      response = await callClaude(prompt);
      break;
    case 'gemini':
      response = await callGemini(prompt);
      break;
    case 'perplexity':
      response = await callPerplexity(prompt);
      break;
  }

  if (!response) {
    console.error(`No response from ${aiModel}`);
    return null;
  }

  // Parse response
  const pick = parseAIResponse(response, aiModel, marketData);
  if (!pick) {
    console.error(`Failed to parse ${aiModel} response`);
    return null;
  }

  // Save to database
  const { error } = await supabase
    .from('market_oracle_picks')
    .insert(pick);

  if (error) {
    console.error(`Failed to save ${aiModel} pick:`, error);
  } else {
    console.log(`✅ ${aiModel} pick saved for ${symbol}`);
  }

  return pick;
}

// ============================================================================
// GENERATE ALL AI PICKS + JAVARI CONSENSUS
// ============================================================================

export async function generateAllAIPicks(symbol: string): Promise<{
  picks: AIPick[];
  consensus: ReturnType<typeof buildJavariConsensus> | null;
}> {
  console.log(`\n========================================`);
  console.log(`Generating ALL AI picks for ${symbol}`);
  console.log(`========================================\n`);

  const aiModels: Exclude<AIModelName, 'javari'>[] = ['gpt4', 'perplexity']; // Only enabled models
  const picks: AIPick[] = [];

  for (const model of aiModels) {
    if (AI_CONFIGS[model].enabled) {
      try {
        const pick = await generatePickFromAI(model, symbol);
        if (pick) {
          picks.push(pick);
        }
      } catch (error) {
        console.error(`Error generating ${model} pick:`, error);
      }
    }
  }

  // Generate Javari consensus if we have picks
  let consensus = null;
  if (picks.length >= 2) {
    consensus = buildJavariConsensus(picks);
    
    // Save consensus to database
    if (consensus) {
      const { error } = await supabase
        .from('market_oracle_consensus_picks')
        .insert({
          symbol,
          direction: consensus.direction,
          ai_combination: consensus.agreeing_models,
          ai_combination_key: consensus.agreeing_models.sort().join('+'),
          consensus_strength: consensus.consensus_strength,
          weighted_confidence: consensus.weighted_confidence,
          javari_confidence: consensus.javari_confidence,
          javari_reasoning: consensus.reasoning,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to save consensus:', error);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Generated ${picks.length} picks for ${symbol}`);
  console.log(`========================================\n`);

  return { picks, consensus };
}
