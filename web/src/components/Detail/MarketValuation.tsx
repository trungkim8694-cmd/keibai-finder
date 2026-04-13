import React from 'react';
import { getMarketValuation, resolveCityCode } from '@/lib/mlitApi';
import { PriceTrendsChart } from './PriceTrendsChart';
import { NearbyTransactions } from './NearbyTransactions';
import { TrendingUp, Activity, BadgePercent } from 'lucide-react';

interface MarketValuationProps {
  prefecture: string;
  city: string;
  propertyType: string;
  basePriceNum: number;
  propertyArea?: number | null;
}

export async function MarketValuation({ prefecture, city, propertyType, basePriceNum, propertyArea }: MarketValuationProps) {
  // Resolve Area Code
  const cityCode = await resolveCityCode(prefecture, city);
  if (!cityCode) return null;

  // Fetch recent data (2023) for Comparison & Transactions
  const marketData = await getMarketValuation(cityCode, propertyType, '2023');
  if (!marketData || !marketData.avgTradePrice) return null;

  // We fetch last 5 years of averages for the chart trend
  const trendYears = ['2019', '2020', '2021', '2022', '2023'];
  const trendPromises = trendYears.map(year => getMarketValuation(cityCode, propertyType, year));
  const multiYearData = await Promise.all(trendPromises);
  
  const chartData = trendYears.map((year, index) => ({
    year,
    price: multiYearData[index]?.avgTradePrice || 0,
    area: multiYearData[index]?.avgArea || 0
  })).filter(d => d.price > 0);

  // Determine the reference value based on area
  const avgPricePerSqm = marketData.avgPricePerSqm || null;
  const avgArea = marketData.avgArea || 0;
  
  const referenceArea = propertyArea || avgArea; // Fallback to avgArea if property doesn't have area
  let estimatedMarketPrice = marketData.avgTradePrice;
  let calculationMethod = "平均取引価格";

  if (avgPricePerSqm && avgPricePerSqm > 0 && referenceArea > 0) {
      estimatedMarketPrice = avgPricePerSqm * referenceArea;
      calculationMethod = propertyArea ? `市場単価 × 物件面積(${Math.round(propertyArea)}㎡)` : `市場単価 × 平均面積`;
  }

  const investmentGapPercent = (basePriceNum > 0 && estimatedMarketPrice > 0) 
    ? ((estimatedMarketPrice - basePriceNum) / estimatedMarketPrice) * 100 
    : 0;
  const isHighPotential = investmentGapPercent > 30;

  const manYenFormat = (val: number) => {
    // Round to nearest Man
    return `${Math.round(val / 10000).toLocaleString('ja-JP')}万円`;
  };
  
  const sqmPriceFormat = (val: number) => {
    return `${(val / 10000).toFixed(1)}万円/㎡`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Market Comparison Widget */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">市場価格比較 (MLIT API)</h2>
          {isHighPotential && (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold px-3 py-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full animate-pulse shadow-md">
              <BadgePercent className="w-3.5 h-3.5" />
              高ポテンシャル
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
           <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">売却基準価額 (Keibai)</div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{basePriceNum > 0 ? manYenFormat(basePriceNum) : '-'}</div>
           </div>
           <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" />
                 想定市場価格推定
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{estimatedMarketPrice ? manYenFormat(estimatedMarketPrice) : '-'}</div>
              <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">{calculationMethod}</div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-2 translate-y-2">
                 <TrendingUp className="w-16 h-16 text-blue-500" />
              </div>
           </div>
           
           <div className={`col-span-2 md:col-span-1 rounded-xl p-4 border ${isHighPotential ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'}`}>
              <div className="text-xs font-bold mb-1 opacity-70">投資ギャップ (利益率目安)</div>
              <div className={`text-3xl font-black ${isHighPotential ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                 {investmentGapPercent > 0 ? `+${investmentGapPercent.toFixed(1)}%` : '-'}
              </div>
           </div>
        </div>

        {/* AI Smart Comment injected directly from data */}
        {basePriceNum > 0 && estimatedMarketPrice > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
            <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
              💡 <span className="font-bold">分析コメント:</span> この{propertyType}の売却基準価額は、
              {avgPricePerSqm && referenceArea ? `地域平均単価（${sqmPriceFormat(avgPricePerSqm)}）と物件面積を掛け合わせた想定市場価値` : `地域の平均取引相場`}
              （{manYenFormat(estimatedMarketPrice)}）を
              <span className="font-bold mx-1">{investmentGapPercent > 0 ? `${investmentGapPercent.toFixed(1)}%下回って` : `${Math.abs(investmentGapPercent).toFixed(1)}%上回って`}</span>います。
              {isHighPotential ? "市場価格との差額が大きいため、非常に高いポテンシャルを秘めています。" : "市場価格に近い、または上回る価格設定です。"}
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Price Trends Chart */}
        <PriceTrendsChart data={chartData} city={city} propertyType={propertyType} />

        {/* 3. Nearby Transactions */}
        <NearbyTransactions transactions={marketData.transactions || []} prefecture={prefecture} city={city} propertyType={propertyType} />
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-right pr-2">
        <a 
          href="https://www.reinfolib.mlit.go.jp/landPrices/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          出典：国土交通省地価公示
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
