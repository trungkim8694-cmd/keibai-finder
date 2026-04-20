import React from 'react';

export const revalidate = 86400; // ISR for 24 hours

import { resolveCityCode, fetchMlitApiData, MlitTransaction, mapPropertyTypeToMlit, getMarketValuation } from '@/lib/mlitApi';
import TradeSearchForm from '@/components/Trade/TradeSearchForm';
import TradeList from '@/components/Trade/TradeList';
import TradeCharts from '@/components/Trade/TradeCharts';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TradeSocialShare } from '@/components/Trade/TradeSocialShare';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const pref = typeof searchParams?.pref === 'string' ? searchParams.pref : '';
  const city = typeof searchParams?.city === 'string' ? searchParams.city : '';
  const type = typeof searchParams?.type === 'string' ? searchParams.type : '戸建て';

  let title = "不動産取引価格検索 (相場) | Keibai Finder";
  let description = "国土交通省のデータを元にした不動産取引価格（相場）の検索ツールです。直近5年の地価推移や実際の取引履歴を確認できます。";

  if (pref && city) {
    title = `🔥 ${pref}${city} ${type}の不動産取引価格相場 & 地価推移 | Keibai Finder`;
    description = `${pref}${city}エリアの${type}の過去の取引価格や、直近5年間の地価推移、平均面積・単価などの最新データを完全無料で確認できます。`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function TradeFindPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  
  const city = typeof searchParams?.city === 'string' ? searchParams.city : '';
  const type = typeof searchParams?.type === 'string' ? searchParams.type : '戸建て';
  const pref = typeof searchParams?.pref === 'string' ? searchParams.pref : '';

  let transactions: MlitTransaction[] = [];
  let cityCode = null;
  let districtQuery = '';
  let displayCity = city;

  if (pref && city) {
    const resolved = await resolveCityCode(pref, city);
    if (resolved) {
      cityCode = resolved.cityCode;
      districtQuery = city.replace(resolved.cityName, '').trim();

      // Fetch specifically for the selected property type.
      // fetchMlitApiData returns ALL properties for the city in that year.
      const mlitTypes = mapPropertyTypeToMlit(type);
      const rawData = await fetchMlitApiData(cityCode, '2023');
      
      let baseTransactions = rawData.filter(t => t.Type && mlitTypes.includes(t.Type));
      
      if (districtQuery && baseTransactions.length > 0) {
        const districtTrans = baseTransactions.filter(t => t.DistrictName && districtQuery.startsWith(t.DistrictName));
        // Check rule: if district filtering results in >= 2 items, use it. Otherwise fallback to city level.
        if (districtTrans.length >= 2) {
          baseTransactions = districtTrans;
          const matchedDistricts = [...new Set(districtTrans.map(t => t.DistrictName).filter(Boolean))];
          if (matchedDistricts.length > 0) {
              matchedDistricts.sort((a, b) => (b as string).length - (a as string).length);
              displayCity = `${resolved.cityName}${matchedDistricts[0]}`;
          }
        } else {
          // Fallback to city level! Reset districtQuery so trend charts also use city level consistently.
          districtQuery = '';
          displayCity = resolved.cityName;
        }
      } else {
          displayCity = resolved.cityName;
      }
      
      transactions = baseTransactions;
    }
  }

  // Fetch trend data
  let trendData: { year: string, price: number, area: number }[] = [];
  if (cityCode) {
     const trendYears = ['2019', '2020', '2021', '2022', '2023'];
     const trendPromises = trendYears.map(year => getMarketValuation(cityCode, type, year, districtQuery));
     const multiYearData = await Promise.all(trendPromises);
     
     trendData = trendYears.map((year, index) => ({
       year,
       price: multiYearData[index]?.avgTradePrice || 0,
       area: multiYearData[index]?.avgArea || 0
     })).filter(d => d.price > 0);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      {/* Header Container */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" />
                ホームへ戻る
              </Link>
              <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">📊</span> 
                {city ? `${pref}${city} ${type}の` : ''}不動産取引価格検索
              </h1>
            </div>
            <TradeSocialShare 
               title={city ? `🔥 ${pref}${displayCity} ${type}の不動産取引価格相場 & 地価推移 | Keibai Finder` : "🔥 不動産取引価格検索 (相場) | Keibai Finder"} 
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Form & List */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <TradeSearchForm initialCity={city} initialPref={pref} initialType={type} />
            
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 lg:p-6 overflow-hidden">
               <div className="mb-4 flex items-center justify-between">
                 <h2 className="text-lg font-bold">取引実績: {transactions.length > 0 ? transactions.length.toLocaleString('ja-JP') : 0} 件</h2>
                 {transactions.length > 0 && (
                   <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">MLIT API 同期済</span>
                 )}
               </div>
               
               {city && !cityCode ? (
                 <div className="py-12 text-center text-zinc-500">
                    市区町村が見つかりません。都道府県と市区町村名が正しいか確認してください。（例：富山県富山市）
                 </div>
               ) : !city ? (
                 <div className="py-12 text-center text-zinc-500">
                    検索窓から市区町村名を入力して検索してください。
                 </div>
               ) : (
                 <TradeList transactions={transactions} />
               )}
            </div>
          </div>

          {/* Right Column: Analytics Charts */}
          <div className="xl:col-span-4">
             <div className="xl:sticky top-32 space-y-6">
                <TradeCharts transactions={transactions} trendData={trendData} propertyType={type} city={displayCity} pref={pref} />
                
                <div className="text-right">
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
          </div>

        </div>
      </div>
    </div>
  );
}
