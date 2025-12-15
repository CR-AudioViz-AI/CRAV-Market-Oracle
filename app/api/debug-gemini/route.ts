// app/api/debug-gemini/route.ts
// Debug endpoint to test Gemini directly

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    keyPresent: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY?.length || 0,
    keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || 'none',
  };

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ...results, error: 'No GEMINI_API_KEY' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    results.sdkInitialized = true;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    results.modelCreated = true;

    const result = await model.generateContent('Say "Hello Market Oracle" in exactly 3 words');
    results.generateCalled = true;

    const response = await result.response;
    results.responseReceived = true;

    const text = response.text();
    results.text = text;
    results.success = true;

    return NextResponse.json(results);
  } catch (error: unknown) {
    const err = error as Error & { status?: number; statusText?: string; message?: string };
    results.error = {
      message: err.message || 'Unknown error',
      status: err.status,
      statusText: err.statusText,
      name: err.name,
      stack: err.stack?.split('\n').slice(0, 5),
    };
    return NextResponse.json(results, { status: 500 });
  }
}
