'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PieChart, TrendingUp, TrendingDown, ArrowRight, RefreshCw, Activity } from 'lucide-react';

interface SectorData {
  name: string;
  symbol: string;
  changePercent: number;
  relativeStrength: number;
  flowSignal: 'inflow' | 'outflow' | 'neutral';
  ranking: number;
}

interface SectorRotationData {
  summary: {
    marketCycle: { phase: string; name: string; description: string; outlook: string };
    spread: number;
    topPerformer: SectorData;
    bottomPerformer: SectorData;
  };
  insights: string[];
  sectors: SectorData[];
  heatmap: Array<{ name: string; symbol: string; change: number; color: string }>;
}

export default function SectorRotationPage() {
  const [data, setData] = useState<SectorRotationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/sectors-flow');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  const getChangeColor = (change: number) => {
    if (change > 1.5) return 'bg-green-500 text-white';
    if (change > 0.5) return 'bg-green-400/80 text-white';
    if (change > 0) return 'bg-green-300/60 text-green-900';
    if (change > -0.5) return 'bg-red-300/60 text-red-900';
    if (change > -1.5) return 'bg-red-400/80 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/20 via-purple-900/10 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <PieChart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                  Sector Rotation
                </h1>
                <p className="text-gray-400">Track money flow between market sectors</p>
              </div>
            </div>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Market Cycle */}
          {data && (
            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl p-6 border border-violet-500/20 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-violet-400" />
                <span className="text-gray-400">Current Market Cycle</span>
              </div>
              <h2 className="text-3xl font-bold text-violet-400 mb-2">{data.summary.marketCycle.name}</h2>
              <p className="text-gray-300 mb-4">{data.summary.marketCycle.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Outlook:</span>
                <span className={`font-semibold ${
                  data.summary.marketCycle.outlook.toLowerCase().includes('bullish') ? 'text-green-400' :
                  data.summary.marketCycle.outlook.toLowerCase().includes('bearish') ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {data.summary.marketCycle.outlook}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-400 mb-4" />
          </div>
        ) : data && (
          <>
            {/* Heatmap */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">🗺️ Sector Heatmap</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.heatmap.map(sector => (
                  <div
                    key={sector.symbol}
                    className={`rounded-xl p-4 text-center ${getChangeColor(sector.change)}`}
                  >
                    <div className="font-bold text-lg">{sector.symbol}</div>
                    <div className="text-sm opacity-90">{sector.name}</div>
                    <div className="text-lg font-semibold mt-1">
                      {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Key Insights */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-4">💡 Key Insights</h3>
                <ul className="space-y-3">
                  {data.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowRight className="w-4 h-4 text-violet-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Leaders & Laggards */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-4">📊 Leaders & Laggards</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="font-semibold text-green-400">{data.summary.topPerformer.name}</div>
                        <div className="text-sm text-gray-400">{data.summary.topPerformer.symbol}</div>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold">
                      +{data.summary.topPerformer.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <div>
                        <div className="font-semibold text-red-400">{data.summary.bottomPerformer.name}</div>
                        <div className="text-sm text-gray-400">{data.summary.bottomPerformer.symbol}</div>
                      </div>
                    </div>
                    <span className="text-red-400 font-bold">
                      {data.summary.bottomPerformer.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-center text-gray-400 text-sm">
                    Spread: {data.summary.spread.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Full Rankings */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold mb-4">🏆 Full Sector Rankings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Sector</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">ETF</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Change</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Rel. Strength</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectors.map(sector => (
                      <tr key={sector.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4">
                          <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-sm font-bold ${
                            sector.ranking <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {sector.ranking}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{sector.name}</td>
                        <td className="py-3 px-4 text-blue-400">{sector.symbol}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${
                          sector.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                        </td>
                        <td className={`py-3 px-4 text-right ${
                          sector.relativeStrength > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sector.relativeStrength > 0 ? '+' : ''}{sector.relativeStrength.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sector.flowSignal === 'inflow' ? 'bg-green-500/20 text-green-400' :
                            sector.flowSignal === 'outflow' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {sector.flowSignal.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cycle Guide */}
            <div className="mt-8 bg-violet-500/10 border border-violet-500/20 rounded-xl p-6">
              <h3 className="font-bold text-violet-400 mb-4">📚 Economic Cycle Guide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-green-400 mb-1">Early Expansion</div>
                  <p className="text-gray-400">Financials, Consumer Discretionary lead</p>
                </div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Mid Cycle</div>
                  <p className="text-gray-400">Technology, Industrials lead</p>
                </div>
                <div>
                  <div className="font-semibold text-yellow-400 mb-1">Late Expansion</div>
                  <p className="text-gray-400">Energy, Materials lead</p>
                </div>
                <div>
                  <div className="font-semibold text-red-400 mb-1">Recession</div>
                  <p className="text-gray-400">Utilities, Healthcare, Staples lead</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">
          Back to Market Oracle
        </Link>
      </div>
    </div>
  );
}
