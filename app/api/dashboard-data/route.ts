import { NextResponse } from "next/server";
import { getPicks, getAIModels, getAIStatistics, getHotPicks, getOverallStats, getRecentWinners, type AssetType } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Map category param to AssetType
function mapCategoryToAssetType(category: string): AssetType | undefined {
  const mapping: Record<string, AssetType> = {
    'regular': 'stock',
    'stock': 'stock',
    'penny': 'penny_stock',
    'penny_stock': 'penny_stock',
    'crypto': 'crypto'
  };
  return mapping[category];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const assetType = category === "all" ? undefined : mapCategoryToAssetType(category);
  
  try {
    const [picksData, modelsData, statsData, hotData, overallData, winnersData] = await Promise.all([
      getPicks({ assetType, limit: 500 }),
      getAIModels(),
      getAIStatistics(assetType),
      getHotPicks(10, assetType),
      getOverallStats(),
      getRecentWinners(5, assetType),
    ]);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        picks: picksData,
        aiModels: modelsData,
        aiStats: statsData,
        hotPicks: hotData,
        overallStats: overallData,
        recentWinners: winnersData,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
