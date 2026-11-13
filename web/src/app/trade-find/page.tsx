import React from 'react';
import { resolveCityCode, fetchMlitApiData, MlitTransaction, mapPropertyTypeToMlit, getMarketValuation } from '@/lib/mlitApi';
import TradeAdvancedFilter from '@/components/Trade/TradeAdvancedFilter';
import TradeTableHighDensity from '@/components/Trade/TradeTableHighDensity';
import TradeCharts from '@/components/Trade/TradeCharts';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Scale, Gavel, FileSpreadsheet, ExternalLink } from 'lucide-react';
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

  let title = "不動産取引価格検索 (実勢相場) | Keibai Finder";
  let description = "国土交通省 不動産取引情報ライブラリ（実勢価格）に基づく不動産取引価格相場の検索ツールです。過去5年の地価推移や実際の取引履歴を確認できます。";

  if (pref && city) {
    title = `${pref}${city} ${type}の不動産取引価格相場・地価推移 | Keibai Finder`;
    description = `${pref}${city}エリアにおける${type}の過去の取引価格、過去5年間の地価推移、平均面積・単価などの最新実績データを完全無料で検索・照合できます。`;
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
  const minPrice = typeof searchParams?.minPrice === 'string' ? searchParams.minPrice : '';
  const maxPrice = typeof searchParams?.maxPrice === 'string' ? searchParams.maxPrice : '';
  const maxWalk = typeof searchParams?.maxWalk === 'string' ? searchParams.maxWalk : '';
  const buildingAge = typeof searchParams?.buildingAge === 'string' ? searchParams.buildingAge : '';
  const currentPage = typeof searchParams?.page === 'string' ? parseInt(searchParams.page, 10) || 1 : 1;

  let rawTransactions: MlitTransaction[] = [];
  let cityCode: string | null = null;
  let districtQuery = '';
  let displayCity = city;

  if (pref && city) {
    const resolved = await resolveCityCode(pref, city);
    if (resolved) {
      cityCode = resolved.cityCode;
      districtQuery = city.replace(resolved.cityName, '').trim();

      // Lấy toàn bộ giao dịch tương ứng với loại BĐS đã chọn
      const mlitTypes = mapPropertyTypeToMlit(type);
      const rawData = await fetchMlitApiData(cityCode, '2023');
      
      let baseTransactions = rawData.filter(t => t.Type && mlitTypes.includes(t.Type));
      
      // Lọc theo khu vực phụ (District / 町名) nếu có
      if (districtQuery && baseTransactions.length > 0) {
        const districtTrans = baseTransactions.filter(t => t.DistrictName && districtQuery.startsWith(t.DistrictName));
        if (districtTrans.length >= 2) {
          baseTransactions = districtTrans;
          const matchedDistricts = [...new Set(districtTrans.map(t => t.DistrictName).filter(Boolean))];
          if (matchedDistricts.length > 0) {
              matchedDistricts.sort((a, b) => (b as string).length - (a as string).length);
              displayCity = `${resolved.cityName}${matchedDistricts[0]}`;
          }
        } else {
          districtQuery = '';
          displayCity = resolved.cityName;
        }
      } else {
        displayCity = resolved.cityName;
      }
      
      rawTransactions = baseTransactions;
    }
  }

  // Áp dụng bộ lọc nâng cao (Khoảng giá, Ga đi bộ, Tuổi nhà)
  let filteredTransactions = rawTransactions;

  // 1. Khoảng giá (minPrice, maxPrice tính bằng 万円)
  if (minPrice) {
    const min = Number(minPrice) * 10000;
    if (!isNaN(min)) {
      filteredTransactions = filteredTransactions.filter(t => Number(t.TradePrice || 0) >= min);
    }
  }
  if (maxPrice) {
    const max = Number(maxPrice) * 10000;
    if (!isNaN(max)) {
      filteredTransactions = filteredTransactions.filter(t => Number(t.TradePrice || 0) <= max);
    }
  }

  // 2. Khoảng cách tới ga gần nhất (maxWalk: phút đi bộ)
  if (maxWalk) {
    const maxMins = Number(maxWalk);
    if (!isNaN(maxMins)) {
      filteredTransactions = filteredTransactions.filter(t => {
        if (!t.TimeToNearestStation) return false;
        const mins = parseInt(t.TimeToNearestStation.replace(/[^\d]/g, ''), 10);
        return !isNaN(mins) && mins <= maxMins;
      });
    }
  }

  // 3. Tuổi nhà / Tiêu chuẩn động đất
  if (buildingAge) {
    const currentYear = new Date().getFullYear();
    filteredTransactions = filteredTransactions.filter(t => {
      if (!t.BuildingYear) return false;
      let bYear = 0;
      if (t.BuildingYear.includes('令和')) {
        bYear = 2018 + (parseInt(t.BuildingYear.replace(/[^\d]/g, '') || '1', 10));
      } else if (t.BuildingYear.includes('平成')) {
        bYear = 1988 + (parseInt(t.BuildingYear.replace(/[^\d]/g, '') || '1', 10));
      } else if (t.BuildingYear.includes('昭和')) {
        bYear = 1925 + (parseInt(t.BuildingYear.replace(/[^\d]/g, '') || '1', 10));
      } else {
        bYear = parseInt(t.BuildingYear.replace(/[^\d]/g, ''), 10) || 0;
      }
      if (!bYear) return false;

      if (buildingAge === 'old_quake') {
        return bYear <= 1981; // 旧耐震基準 (1981年/昭和56年以前)
      }
      const maxAge = Number(buildingAge);
      if (!isNaN(maxAge)) {
        return (currentYear - bYear) <= maxAge;
      }
      return true;
    });
  }

  // Lấy dữ liệu biến động 5 năm (Trend Data)
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 pb-20">
      {/* Header Container chuẩn B2B */}
      <div className="bg-white dark:bg-[#151B22] border-b border-slate-200/90 dark:border-slate-800/90 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors mb-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>ホームへ戻る</span>
              </Link>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
                <span>
                  {city ? `${pref}${displayCity} ${type}の` : ''}不動産取引価格検索 (実勢相場)
                </span>
              </h1>
            </div>
            <TradeSocialShare 
               title={city ? `${pref}${displayCity} ${type}の不動産取引価格相場 & 地価推移 | Keibai Finder` : "不動産取引価格検索 (相場) | Keibai Finder"} 
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Cột trái: Bộ lọc & Bảng danh sách kết quả */}
          <div className="xl:col-span-8 flex flex-col gap-5">
            {/* Bộ lọc 6 tiêu chí chuẩn B2B */}
            <TradeAdvancedFilter
              initialPref={pref}
              initialCity={city}
              initialType={type}
              initialMinPrice={minPrice}
              initialMaxPrice={maxPrice}
              initialMaxWalk={maxWalk}
              initialBuildingAge={buildingAge}
            />
            
            {/* Thẻ đối chiếu tương quan Đấu Giá Keibai (Market vs Auction Synergy Card) */}
            <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B4F8A] text-white">
                      <Gavel className="w-3 h-3" />
                      <span>裁判所 競売・公売 落札データ連携</span>
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {city ? `${pref}${displayCity}の落札相場乖離率` : '裁判所の過去落札水準と照合'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {city 
                      ? `国土交通省の実勢流通相場（一般市場価格）に対し、このエリア（${pref}${displayCity}）の裁判所落札基準価額は通常約20〜40%安の水準となります。過去の開札結果と突き合わせることで適正入札ラインを逆算できます。`
                      : '全国の地方裁判所および公売の開札結果データベースから、基準価額との乖離倍率や入札者数（競合数）を照合・算定できます。'}
                  </p>
                </div>
                <Link
                  href={`/auction-results${city ? `?q=${encodeURIComponent(pref + city)}` : ''}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-semibold rounded-md bg-[#1B4F8A] hover:bg-[#143D6C] active:bg-[#0F2D52] text-white transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <span>{city ? `${pref}${city}の落札結果` : '全国落札データベースへ'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bảng dữ liệu giao dịch mật độ cao (High Density Table) */}
            {city && !cityCode ? (
              <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800/90 p-12 text-center text-xs text-slate-500">
                市区町村コードを特定できませんでした。都道府県と市区町村名が正しいかご確認ください。（例: 東京都新宿区、富山県富山市）
              </div>
            ) : !city ? (
              <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800/90 p-12 text-center text-xs text-slate-500">
                上記の検索フォームから都道府県と市区町村を選択して検索してください。
              </div>
            ) : (
              <TradeTableHighDensity
                transactions={filteredTransactions}
                totalCount={filteredTransactions.length}
                currentPage={currentPage}
                perPage={20}
              />
            )}
          </div>

          {/* Cột phải: Biểu đồ phân tích & Chỉ số vĩ mô */}
          <div className="xl:col-span-4">
             <div className="xl:sticky top-20 space-y-5">
                <TradeCharts
                  transactions={filteredTransactions}
                  trendData={trendData}
                  propertyType={type}
                  city={displayCity}
                  pref={pref}
                />
                
                {/* Thẻ Chiến Lược Định Giá BĐS Đấu Giá */}
                <div className="bg-white dark:bg-[#151B22] rounded-lg p-4 border border-slate-200/90 dark:border-slate-800/90 space-y-2.5 text-xs shadow-xs">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    <span>実勢価格と競売入札の算定アプローチ</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    国土交通省の取引相場（一般流通価格）を上限ベンチマークとし、修繕費用や法定制限リスクを控除した上で、裁判所の過去落札倍率（相場より割安な落札水準）と突き合わせることで安全域の高い入札額を割り出せます。
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/auction-results${city ? `?q=${encodeURIComponent(pref + city)}` : ''}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      <span>落札倍率データベースで相場乖離率を確認</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="text-right">
                  <a 
                    href="https://www.reinfolib.mlit.go.jp/landPrices/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>出典：国土交通省 不動産情報ライブラリ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
