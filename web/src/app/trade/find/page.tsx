import React from 'react';
import { resolveCityCode, fetchMlitApiData, MlitTransaction, mapPropertyTypeToMlit, getMarketValuation } from '@/lib/mlitApi';
import TradeSearchForm from '@/components/Trade/TradeSearchForm';
import TradeList from '@/components/Trade/TradeList';
import TradeCharts from '@/components/Trade/TradeCharts';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

  if (pref && city) {
    cityCode = await resolveCityCode(pref, city);
    if (cityCode) {
      // Fetch specifically for the selected property type.
      // fetchMlitApiData returns ALL properties for the city in that year.
      // We need to filter them manually on the server.
      const mlitTypes = mapPropertyTypeToMlit(type);
      const rawData = await fetchMlitApiData(cityCode, '2023');
      
      transactions = rawData.filter(t => t.Type && mlitTypes.includes(t.Type));
    }
  }

  // Fetch trend data
  let trendData: { year: string, price: number, area: number }[] = [];
  if (cityCode) {
     const trendYears = ['2019', '2020', '2021', '2022', '2023'];
     const trendPromises = trendYears.map(year => getMarketValuation(cityCode, type, year));
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
                <TradeCharts transactions={transactions} trendData={trendData} propertyType={type} city={city} pref={pref} />
                
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
