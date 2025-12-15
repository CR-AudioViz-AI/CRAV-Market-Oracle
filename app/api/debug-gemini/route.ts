// app/api/debug-gemini/route.ts
// Debug endpoint to test Gemini models

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    keyPresent: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || 'none',
  };

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ...results, error: 'No GEMINI_API_KEY' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Try multiple model names
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro-latest',
  ];

  const modelResults: Record<string, unknown> = {};

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      modelResults[modelName] = { success: true, text: text.substring(0, 50) };
      // If we get one working, break
      results.workingModel = modelName;
      results.response = text;
      break;
    } catch (error: unknown) {
      const err = error as Error & { status?: number };
      modelResults[modelName] = { 
        success: false, 
        status: err.status,
        error: err.message?.substring(0, 100)
      };
    }
  }

  results.modelResults = modelResults;
  return NextResponse.json(results);
}
