/**
 * MARKET ORACLE - WEEKLY PICKS GENERATION API
 * Triggered every Monday at 6 AM to generate new picks
 * November 24, 2025 - 4:50 AM ET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAllPredictions, savePredictionsToDatabase } from '@/lib/ai-prediction-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add force-dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * POST /api/market-oracle/generate-picks
 * Generate weekly stock picks from all 5 AIs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting weekly picks generation...');

    // Get or create active competition
    const competition = await getOrCreateActiveCompetition();
    
    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Failed to get/create competition' },
        { status: 500 }
      );
    }

    // Calculate current week number
    const weekNumber = calculateWeekNumber(competition.start_date);

    console.log(`📅 Competition: ${competition.name}, Week: ${weekNumber}`);

    // Generate predictions from all 5 AIs
    const predictions = await generateAllPredictions();

    // Save to database
    await savePredictionsToDatabase(predictions, competition.id, weekNumber);

    // Update AI model statistics
    await updateAIStatistics(predictions);

    // Send summary
    const summary = predictions.map(p => ({
      aiModel: p.aiModel,
      success: p.success,
      picksCount: p.picks.length,
      error: p.error,
    }));

    console.log('✅ Weekly picks generation complete!');

    return NextResponse.json({
      success: true,
      competition: {
        id: competition.id,
        name: competition.name,
        week: weekNumber,
      },
      predictions: summary,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate picks error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/market-oracle/generate-picks?manual=true
 * Manual trigger (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manual = searchParams.get('manual');

    if (manual !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Use POST with cron secret' },
        { status: 400 }
      );
    }

    // Get active competition
    const { data: competition } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'active')
      .single();

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'No active competition' },
        { status: 404 }
      );
    }

    const weekNumber = calculateWeekNumber(competition.start_date);

    return NextResponse.json({
      success: true,
      message: 'Use POST /api/market-oracle/generate-picks with cron secret',
      competition: {
        id: competition.id,
        name: competition.name,
        week: weekNumber,
        status: competition.status,
      },
    });

  } catch (error) {
    console.error('Get picks info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getOrCreateActiveCompetition() {
  // Check for active competition
  const { data: activeCompetition } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .single();

  if (activeCompetition) {
    return activeCompetition;
  }

  // Create new competition (90 days)
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 90);

  const competitionName = `Q${Math.ceil((today.getMonth() + 1) / 3)} ${today.getFullYear()} Competition`;

  const { data: newCompetition, error } = await supabase
    .from('competitions')
    .insert({
      name: competitionName,
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating competition:', error);
    return null;
  }

  console.log(`✅ Created new competition: ${competitionName}`);
  return newCompetition;
}

function calculateWeekNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

async function updateAIStatistics(predictions: any[]) {
  for (const prediction of predictions) {
    if (!prediction.success) continue;

    await supabase
      .from('ai_models')
      .update({
        total_picks: supabase.raw('total_picks + ?', [prediction.picks.length]),
        updated_at: new Date().toISOString(),
      })
      .eq('name', prediction.aiModel);
  }
}
