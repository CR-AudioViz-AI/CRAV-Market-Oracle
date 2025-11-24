import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.models) {
      return NextResponse.json({
        count: data.models.length,
        models: data.models.map((m: any) => m.name).slice(0, 15)
      });
    }
    
    return NextResponse.json({ error: data.error?.message || 'Unknown', status: response.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
