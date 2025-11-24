import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Try multiple model names
  const models = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
  const results = [];
  
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say hi' }] }],
          }),
        }
      );
      
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      results.push({
        model,
        status,
        works: status === 200,
        error: data.error?.message?.slice(0, 50) || null,
      });
    } catch (e) {
      results.push({ model, status: 'error', works: false, error: String(e).slice(0, 50) });
    }
  }
  
  return NextResponse.json({ apiKey: apiKey?.slice(0, 10) + '...', results });
}
