import { prisma } from '@/lib/prisma';
import MarketCharts from './MarketCharts';

// Data normalizer
function extractPrefecture(address: string | null) {
  if (!address) return 'Unknown';
  const prefs = ['都', '道', '府', '県'];
  for (const p of prefs) {
    if (address.includes(p)) {
      return address.substring(0, address.indexOf(p) + 1);
    }
  }
  // Hokkaido cities fallback if missing '道'
  if (address.includes("札幌") || address.includes("旭川") || address.includes("函館") || address.includes("釧路")) {
    return "北海道";
  }
  return address.substring(0, 3); // Fallback to first 3 chars
}

function extractYear(caseNumber: string) {
  const match = caseNumber.match(/令和(\d+)年/);
  if (match) {
    return 2018 + parseInt(match[1]); // Reiwa 1 is 2019
  }
  return 2025; // Default fallback
}

export default async function MarketInsightsPage() {
  const allResults = await prisma.auctionResult.findMany({
    where: {
      winningPrice: { not: null },
      basePrice: { not: null },
    }
  });

  // Calculate Average Winning Price by Prefecture
  const prefStats: Record<string, { total: number, count: number }> = {};
  
  // Calculate Avg Margin Rate (ROI) by Region/City
  const roiStats: Record<string, { marginTotal: number, count: number }> = {};
  
  // Bidder Distribution and Trend
  const bidderTrend: Record<string, { bidders: number, count: number }> = {};
  
  allResults.forEach(res => {
    const pref = extractPrefecture(res.address);
    const winPrice = Number(res.winningPrice); // BigInt to Number
    if (winPrice > 0) {
      if (!prefStats[pref]) prefStats[pref] = { total: 0, count: 0 };
      prefStats[pref].total += winPrice;
      prefStats[pref].count += 1;
    }
    
    if (res.marginRate) {
      if (!roiStats[pref]) roiStats[pref] = { marginTotal: 0, count: 0 };
      roiStats[pref].marginTotal += res.marginRate;
      roiStats[pref].count += 1;
    }
    
    // Group by Competition Level instead of year to see impact
    const level = res.competitionLevel || "低競争";
    if (res.bidderCount) {
        if (!bidderTrend[level]) bidderTrend[level] = { bidders: 0, count: 0 };
        bidderTrend[level].bidders += res.bidderCount;
        bidderTrend[level].count += 1;
    }
  });

  const avgPriceByPref = Object.keys(prefStats).map(k => ({
    name: k,
    avgPrice: Math.round(prefStats[k].total / prefStats[k].count)
  })).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10);
  
  const topRoiZones = Object.keys(roiStats).map(k => ({
    name: k,
    avgRoi: (roiStats[k].marginTotal / roiStats[k].count) * 100
  })).sort((a, b) => b.avgRoi - a.avgRoi).slice(0, 10);
  
  const competitionStats = Object.keys(bidderTrend).map(k => ({
    name: k,
    avgBidders: Math.round((bidderTrend[k].bidders / bidderTrend[k].count) * 10) / 10,
    count: bidderTrend[k].count
  }));

  return (
    <div className="min-h-screen bg-gray-50 pt-[10vh] pb-[10vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">📈</span> 市場分析ダッシュボード
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            過去の売却結果データに基づくAIインサイト。全 {allResults.length} 件の取引データを分析中。
          </p>
        </div>

        <MarketCharts 
          avgPriceData={avgPriceByPref} 
          roiData={topRoiZones} 
          competitionData={competitionStats}
        />
      </div>
    </div>
  );
}
