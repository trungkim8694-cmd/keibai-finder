import React from 'react';
import { getMarketValuation, resolveCityCode } from '@/lib/mlitApi';
import { cleanAddress } from '@/lib/utils';
import { PriceTrendsChart } from './PriceTrendsChart';
import { NearbyTransactions } from './NearbyTransactions';
import { TrendingUp, Activity, BadgePercent, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface MarketValuationProps {
  prefecture: string;
  city: string;
  rawAddress?: string;
  propertyType: string;
  basePriceNum: number;
  propertyArea?: number | null;
  dbMlitEstimatedPrice?: number | null;
  dbMlitInvestmentGap?: number | null;
  sourceProvider?: string | null;
  displayPropertyType?: string;
}

export async function MarketValuation({ 
  prefecture, 
  city, 
  rawAddress, 
  propertyType, 
  basePriceNum, 
  propertyArea, 
  dbMlitEstimatedPrice, 
  dbMlitInvestmentGap,
  sourceProvider,
  displayPropertyType
}: MarketValuationProps) {
  // Resolve Area Code
  const resolved = await resolveCityCode(prefecture, city);
  if (!resolved) return null;
  const cityCode = resolved.cityCode;

  // Determine District Query based on rawAddress
  let combinedCity = city;
  let districtQuery = '';
  
  if (rawAddress && rawAddress !== 'Unknown') {
     const fullClean = cleanAddress(rawAddress, prefecture, city);
     combinedCity = fullClean.startsWith(prefecture) ? fullClean.substring(prefecture.length).trim() : fullClean;
     districtQuery = combinedCity.startsWith(resolved.cityName) 
         ? combinedCity.substring(resolved.cityName.length).trim() 
         : combinedCity.trim();
  } else {
     districtQuery = city.replace(resolved.cityName, '').trim();
  }

  // Phase 1: Try to fetch Market Data for District
  let marketData = await getMarketValuation(cityCode, propertyType, '2023', districtQuery);
  let isCityFallback = false;
  
  // Phase 2: If district has less than 8 transactions, fall back to broad City level for statistical stability
  if (!marketData || (marketData.transactions?.length || 0) < 8) {
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
      displayCity = `${city}全域`;
  }
  
  if (!marketData || (!marketData.avgTradePrice && (!marketData.transactions || marketData.transactions.length === 0))) {
    return (
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xs border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">市場価格データなし</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            現在、このエリア（{prefecture}{city}）における過去の「{propertyType}」の取引履歴は、国土交通省（MLIT）のデータベースに記録されていません。
          </p>
        </section>
      </div>
    );
  }

  // We fetch last 5 years of averages for the chart trend (2020-2024 or 2019-2023)
  const trendYears = ['2020', '2021', '2022', '2023', '2024'];
  const trendPromises = trendYears.map(year => getMarketValuation(cityCode, propertyType, year, districtQuery));
  const multiYearData = await Promise.all(trendPromises);
  
  const chartData = trendYears.map((year, index) => ({
    year,
    price: multiYearData[index]?.avgTradePrice || 0,
    area: multiYearData[index]?.avgArea || 0,
    pricePerSqm: multiYearData[index]?.avgPricePerSqm || 0,
    count: multiYearData[index]?.count || 0
  })).filter(d => d.price > 0 || d.pricePerSqm > 0);

  const hasDbCalculation = !!dbMlitEstimatedPrice && dbMlitEstimatedPrice > 0;

  // Live fallback from already-fetched MLIT marketData if DB cache hasn't been calculated yet
  const computeFallbackValuation = () => {
    const avgPrice = marketData?.avgTradePrice || 0;
    const avgSqm = marketData?.avgPricePerSqm || 0;
    const avgArea = marketData?.avgArea || 0;
    const refArea = (propertyArea && propertyArea > 0) ? propertyArea : avgArea;

    let baseEst = avgPrice;
    if (avgSqm > 0 && refArea > 0) {
      baseEst = avgSqm * refArea;
    }
    if (!baseEst || baseEst <= 0) return null;

    const factor = propertyType === '土地' ? 1.0 : (propertyType === 'マンション' ? 0.8 : 0.65);
    return Math.round(baseEst * factor);
  };

  const estimatedMarketPrice = hasDbCalculation ? dbMlitEstimatedPrice : computeFallbackValuation();
  const investmentGapPercent = hasDbCalculation
    ? (dbMlitInvestmentGap ?? 0)
    : (estimatedMarketPrice && basePriceNum > 0
        ? ((estimatedMarketPrice - basePriceNum) / estimatedMarketPrice) * 100
        : null);
  const isHighPotential = Boolean(investmentGapPercent !== null && investmentGapPercent > 30);

  const manYenFormat = (val: number) => {
    return `${Math.round(val / 10000).toLocaleString('ja-JP')}万円`;
  };

  const isKoubai = sourceProvider === 'NTA';
  const effectiveTypeLabel = displayPropertyType && displayPropertyType !== propertyType 
    ? `${displayPropertyType}（参考：${propertyType}相場）`
    : propertyType;

  // Compute property unit price per m2 for direct comparison if available
  const propertySqmPriceMan = (basePriceNum > 0 && propertyArea && propertyArea > 0)
    ? (basePriceNum / 10000 / propertyArea).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Market Comparison Widget */}
      <section className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-2xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1B4F8A]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              市場実取引価格との比較 (MLIT)
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              {displayCity}
            </span>
            {isHighPotential && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                <BadgePercent className="w-3 h-3" />
                割安
              </span>
            )}
          </div>
        </div>
        
        {/* Anti-Cramping Layout: 2 Columns for Prices + 1 Full-width Banner for Margin */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Box 1: Auction Start Price */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 leading-tight">
                  {isKoubai ? '見積価額（公売基準）' : '売却基準価額（競売）'}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {basePriceNum > 0 ? manYenFormat(basePriceNum) : '-'}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">入札スタート価格</p>
            </div>

            {/* Box 2: Estimated Market Price */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1 leading-tight">
                  <TrendingUp className="w-3 h-3 text-[#1B4F8A]" />
                  <span>想定市場流通相場</span>
                </div>
                <div className="text-base font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                  {estimatedMarketPrice ? manYenFormat(estimatedMarketPrice) : '更新待ち'}
                </div>
              </div>
              {estimatedMarketPrice ? (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums truncate">
                  目安: {manYenFormat(Math.round(estimatedMarketPrice * 0.9 / 10000) * 10000)}〜{manYenFormat(Math.round(estimatedMarketPrice * 1.1 / 10000) * 10000)}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">統計的推計値</p>
              )}
            </div>
          </div>

          {/* Full-width Safety Margin Card with Progress Bar */}
          <div className="rounded-lg p-3 border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                価格差（安全マージン）
              </span>
              {investmentGapPercent !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                  市場相場比 {investmentGapPercent > 0 ? `${investmentGapPercent.toFixed(1)}% 割安` : `${Math.abs(investmentGapPercent).toFixed(1)}% 割高`}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm md:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {estimatedMarketPrice && basePriceNum > 0 
                  ? `約${Math.round((estimatedMarketPrice - basePriceNum) / 10000).toLocaleString('ja-JP')}万円 安価`
                  : (investmentGapPercent !== null ? `${investmentGapPercent.toFixed(1)}%` : 'データ更新待ち')
                }
              </span>
              {propertySqmPriceMan && (
                <span className="text-[10px] text-slate-500 tabular-nums">
                  基準単価: 約{propertySqmPriceMan}万円/㎡
                </span>
              )}
            </div>

            {/* Visual Price Comparison Bar */}
            {estimatedMarketPrice && basePriceNum > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-[#1B4F8A] h-full" 
                    style={{ width: `${Math.min(Math.round((basePriceNum / estimatedMarketPrice) * 100), 100)}%` }}
                    title={`入札スタート価格: ${Math.round((basePriceNum / estimatedMarketPrice) * 100)}%`}
                  />
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${Math.max(100 - Math.round((basePriceNum / estimatedMarketPrice) * 100), 0)}%` }}
                    title="価格差（安全マージン）"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
                  <span>スタート額: {Math.round((basePriceNum / estimatedMarketPrice) * 100)}%</span>
                  <span>安全マージン: {Math.max(100 - Math.round((basePriceNum / estimatedMarketPrice) * 100), 0)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* B2B Analysis Note */}
        {basePriceNum > 0 && estimatedMarketPrice && investmentGapPercent !== null ? (
          <div className="mt-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              <span className="font-semibold text-slate-900 dark:text-slate-100">相場分析: </span> 
              当物件の{isKoubai ? '見積価額' : '売却基準価額'}（{manYenFormat(basePriceNum)}）は、国土交通省の取引データおよび建物現況の減価修正に基づく想定市場相場（{manYenFormat(estimatedMarketPrice)}）に対して、
              <span className="font-bold text-[#1B4F8A] dark:text-blue-400 mx-1 tabular-nums">
                {investmentGapPercent > 0 
                  ? `約${Math.round((estimatedMarketPrice - basePriceNum) / 10000).toLocaleString('ja-JP')}万円（${investmentGapPercent.toFixed(1)}%）割安` 
                  : `${Math.abs(investmentGapPercent).toFixed(1)}%割高`
                }
              </span>
              な水準に設定されています。
            </p>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
              ※ 本数値は近隣実取引データに基づく統計的推計値（築年数減価修正済）であり、個別事情による補正費用は含まれておりません。
            </p>
          </div>
        ) : null}
        
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <Link
            href={`/trade-find?pref=${encodeURIComponent(prefecture)}&city=${encodeURIComponent(city)}&type=${encodeURIComponent(propertyType)}`}
            className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
          >
            <span>「{prefecture}{city}」の取引価格相場・推移を詳しく分析</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <a 
            href="https://www.reinfolib.mlit.go.jp/landPrices/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
          >
            出典: 国土交通省 不動産情報ライブラリ (MLIT)
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {/* 2. Price Trends Chart */}
        <PriceTrendsChart 
          data={chartData} 
          city={displayCity} 
          prefecture={prefecture} 
          propertyType={effectiveTypeLabel} 
        />

        {/* 3. Nearby Transactions (With reference unit price & table) */}
        <NearbyTransactions 
          transactions={marketData.transactions || []} 
          prefecture={prefecture} 
          city={displayCity} 
          propertyType={effectiveTypeLabel}
          currentBasePriceNum={basePriceNum}
          currentArea={propertyArea}
        />
      </div>
    </div>
  );
}
