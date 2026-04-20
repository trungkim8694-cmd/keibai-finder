import React from 'react';
import { getMarketValuation, resolveCityCode } from '@/lib/mlitApi';
import { cleanAddress } from '@/lib/utils';
import { PriceTrendsChart } from './PriceTrendsChart';
import { NearbyTransactions } from './NearbyTransactions';
import { TrendingUp, Activity, BadgePercent } from 'lucide-react';

interface MarketValuationProps {
  prefecture: string;
  city: string;
  rawAddress?: string;
  propertyType: string;
  basePriceNum: number;
  propertyArea?: number | null;
  dbMlitEstimatedPrice?: number | null;
  dbMlitInvestmentGap?: number | null;
}

export async function MarketValuation({ prefecture, city, rawAddress, propertyType, basePriceNum, propertyArea, dbMlitEstimatedPrice, dbMlitInvestmentGap }: MarketValuationProps) {
  // Resolve Area Code
  const resolved = await resolveCityCode(prefecture, city);
  if (!resolved) return null;
  const cityCode = resolved.cityCode;

  // Determine District Query based on rawAddress
  let combinedCity = city;
  let districtQuery = '';
  
  if (rawAddress && rawAddress !== 'Unknown') {
     const fullClean = cleanAddress(rawAddress, prefecture, city);
     // CleanAddress returns "{prefecture}{city}{district}". We only need "{city}{district}" for combinedCity
     combinedCity = fullClean.startsWith(prefecture) ? fullClean.substring(prefecture.length).trim() : fullClean;

     // The precise DistrictName is anything left over after stripping out the clean city name
     districtQuery = combinedCity.startsWith(resolved.cityName) 
         ? combinedCity.substring(resolved.cityName.length).trim() 
         : combinedCity.trim();
  } else {
     districtQuery = city.replace(resolved.cityName, '').trim();
  }

  // Phase 1: Try to fetch Market Data deeply for the specific District
  let marketData = await getMarketValuation(cityCode, propertyType, '2023', districtQuery);
  let isCityFallback = false;
  
  // Phase 2: If less than 2 transactions, automatically fall back to broad City level
  if (!marketData || (marketData.transactions?.length || 0) < 2) {
      districtQuery = '';
      isCityFallback = true;
      marketData = await getMarketValuation(cityCode, propertyType, '2023', '');
  }

  let displayCity = combinedCity;
  if (!isCityFallback && marketData && marketData.transactions && marketData.transactions.length > 0) {
      const matchedDistricts = [...new Set(marketData.transactions.map(t => t.DistrictName).filter(Boolean))];
      if (matchedDistricts.length > 0) {
          matchedDistricts.sort((a, b) => b!.length - a!.length);
          displayCity = `${city}${matchedDistricts[0]}`;
      }
  } else if (isCityFallback) {
      displayCity = city;
  }
  
  if (!marketData || (!marketData.avgTradePrice && (!marketData.transactions || marketData.transactions.length === 0))) {
    return (
      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-full mb-4">
            <Activity className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">市場価格データなし</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
            現在、このエリア（{prefecture}{city}）における過去の「{propertyType}」の取引履歴は、国土交通省（MLIT）のデータベースに記録されていません。<br/>そのため、市場価格比較および価格推移チャートを表示できません。
          </p>
        </section>
      </div>
    );
  }

  // We fetch last 5 years of averages for the chart trend
  const trendYears = ['2019', '2020', '2021', '2022', '2023'];
  const trendPromises = trendYears.map(year => getMarketValuation(cityCode, propertyType, year, districtQuery));
  const multiYearData = await Promise.all(trendPromises);
  
  const chartData = trendYears.map((year, index) => ({
    year,
    price: multiYearData[index]?.avgTradePrice || 0,
    area: multiYearData[index]?.avgArea || 0
  })).filter(d => d.price > 0);

  // Determine the reference value based on area
  const avgPricePerSqm = marketData.avgPricePerSqm || null;
  
  // Use Database Values as the SINGLE SOURCE OF TRUTH
  // If DB hasn't calculated it yet, DO NOT auto-gen on UI, show "Waiting for System" instead
  const hasDbCalculation = !!dbMlitEstimatedPrice && dbMlitEstimatedPrice > 0;
  
  const estimatedMarketPrice = hasDbCalculation ? dbMlitEstimatedPrice : null;
  const calculationMethod = hasDbCalculation ? "AI/システム 査定結果" : "更新待ち";

  const investmentGapPercent = hasDbCalculation ? (dbMlitInvestmentGap ?? 0) : null;
  const isHighPotential = hasDbCalculation && investmentGapPercent && investmentGapPercent > 30;

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
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">市場価格比較</h2>
          {isHighPotential && (
            <span className="ml-auto flex items-center gap-1 text-[10px] whitespace-nowrap font-bold px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full animate-pulse shadow-md">
              <BadgePercent className="w-3 h-3" />
              高ポテンシャル
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
           <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">売却基準価額 (Keibai)</div>
              <div className="text-base font-black text-zinc-900 dark:text-zinc-100 break-words">{basePriceNum > 0 ? manYenFormat(basePriceNum) : '-'}</div>
           </div>
           <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" />
                 想定市場価格推定
              </div>
              <div className="text-base font-black text-blue-700 dark:text-blue-400 break-words">{estimatedMarketPrice ? manYenFormat(estimatedMarketPrice) : '更新待ち'}</div>
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-2 translate-y-2">
                 <TrendingUp className="w-16 h-16 text-blue-500" />
              </div>
           </div>
           
           <div className={`col-span-2 md:col-span-1 rounded-xl p-4 border ${isHighPotential ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30' : (investmentGapPercent === null ? 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800/50' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30')}`}>
              <div className="text-xs font-bold mb-1 opacity-70">投資ギャップ (利益率目安)</div>
              <div className={`text-base font-black break-words ${isHighPotential ? 'text-orange-600 dark:text-orange-400' : (investmentGapPercent === null ? 'text-zinc-500 dark:text-zinc-400' : 'text-emerald-600 dark:text-emerald-400')}`}>
                 {investmentGapPercent !== null ? (investmentGapPercent > 0 ? `+${investmentGapPercent.toFixed(1)}%` : `${investmentGapPercent.toFixed(1)}%`) : '更新待ち'}
              </div>
           </div>
        </div>

        {/* AI Smart Comment injected directly from data */}
        {basePriceNum > 0 && estimatedMarketPrice && investmentGapPercent !== null ? (
          <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
            <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
              💡 <span className="font-bold">分析コメント:</span> この{propertyType}の売却基準価額は、
              AIシステムによる想定市場価値
              （{manYenFormat(estimatedMarketPrice)}）を
              <span className="font-bold mx-1">{investmentGapPercent > 0 ? `${investmentGapPercent.toFixed(1)}%下回って` : `${Math.abs(investmentGapPercent).toFixed(1)}%上回って`}</span>います。
              {isHighPotential ? "市場価格との差額が大きいため、非常に高いポテンシャルを秘めています。" : "市場価格に近い、または上回る価格設定です。"}
            </p>
            <p className="mt-2 text-[11px] text-violet-600/70 dark:text-violet-400/80 leading-relaxed font-medium">
              ※ 注意：上記の利益率目安には、落札時の諸経費（各種手数料、税金、修繕費用等の追加コスト）は含まれておりません。実際の投資採算はそれらの費用により変動するため、あくまで参考値としてご活用ください。
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              💡 <span className="font-bold">分析コメント:</span> 現在、AIシステムがこの物件の想定市場価格を演算・分析中です。データが揃い次第更新されます。（更新待ち）
            </p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-right">
          <a 
            href="https://www.reinfolib.mlit.go.jp/landPrices/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            出典：国土交通省地価公示
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {/* 2. Price Trends Chart */}
        <PriceTrendsChart data={chartData} city={displayCity} prefecture={prefecture} propertyType={propertyType} />

        {/* 3. Nearby Transactions */}
        <NearbyTransactions transactions={marketData.transactions || []} prefecture={prefecture} city={displayCity} propertyType={propertyType} />
      </div>
    </div>
  );
}
