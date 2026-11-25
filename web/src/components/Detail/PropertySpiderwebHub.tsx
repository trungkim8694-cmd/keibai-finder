import React from 'react';
import Link from 'next/link';
import { MapPin, Building2, Train, TrendingUp, ShieldCheck, ChevronRight, Flame, Sparkles } from 'lucide-react';

interface PropertySpiderwebHubProps {
  prefecture?: string | null;
  city?: string | null;
  propertyType?: string | null;
  nearestStations?: Array<{ name_ja: string; line_name?: string | null }>;
  startingPrice?: number | bigint | null;
  sourceProvider?: string | null;
  roiPercent?: number | null;
  status?: string | null;
}

export function PropertySpiderwebHub({
  prefecture,
  city,
  propertyType = '戸建て',
  nearestStations = [],
  startingPrice,
  sourceProvider,
  roiPercent,
  status
}: PropertySpiderwebHubProps) {
  if (!prefecture) return null;

  const type = propertyType || '戸建て';
  const prefEncoded = encodeURIComponent(prefecture);
  const cityEncoded = city ? encodeURIComponent(city) : '';

  // Extract unique railway lines & stations
  const lines = Array.from(new Set(nearestStations.map(s => s.line_name).filter(Boolean))) as string[];
  const stations = Array.from(new Set(nearestStations.map(s => s.name_ja).filter(Boolean)));

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs mt-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#1B4F8A] rounded-xs"></span>
          関連する条件・エリアから探す (関連物件・相場情報)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {prefecture}{city ? city : ''}周辺の競売・公売物件、沿線情報、過去の落札結果相場へアクセスできます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        {/* Column 1: Area & Prefecture Silo */}
        <div className="space-y-2.5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>地域・エリアから探す</span>
          </h3>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            {city && (
              <li>
                <Link
                  href={`/search/area/${prefEncoded}/${cityEncoded}`}
                  className="hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>{prefecture}{city}の競売物件一覧</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                href={`/search/area/${prefEncoded}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の競売・公売物件一覧</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/map?prefecture=${prefEncoded}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の物件を地図で探す</span>
              </Link>
            </li>
            <li>
              <Link
                href="/search/area"
                className="hover:text-blue-700 hover:underline flex items-center gap-1 text-slate-500"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>全国の都道府県一覧</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Property Types in this Prefecture */}
        <div className="space-y-2.5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{prefecture}の種別から探す</span>
          </h3>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              <Link
                href={`/map?prefecture=${prefEncoded}&types[]=%E6%88%B8%E5%BB%BA%E3%81%A6`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の一戸建て競売物件</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/map?prefecture=${prefEncoded}&types[]=%E3%83%9E%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%B3`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}のマンション競売物件</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/map?prefecture=${prefEncoded}&types[]=%E5%9C%9F%E5%9C%B0`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の土地・宅地競売物件</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/map?prefecture=${prefEncoded}&minGap=30`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1 font-medium text-blue-700 dark:text-blue-400"
              >
                <ChevronRight className="w-3 h-3 text-blue-500" />
                <span>{prefecture}の市場比30%超 割安物件</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Railway Lines & Stations */}
        <div className="space-y-2.5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <Train className="w-3.5 h-3.5 text-blue-600" />
            <span>沿線・駅から探す</span>
          </h3>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            {lines.slice(0, 2).map(line => (
              <li key={line}>
                <Link
                  href={`/search/station/${encodeURIComponent(line)}`}
                  className="hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>{line}沿線の物件一覧</span>
                </Link>
              </li>
            ))}
            {nearestStations.slice(0, 2).map((st, idx) => {
              const stationHref = st.line_name
                ? `/search/station/${encodeURIComponent(st.line_name)}/${encodeURIComponent(st.name_ja)}`
                : `/map?keyword=${encodeURIComponent(st.name_ja)}`;
              return (
                <li key={`${st.name_ja}-${idx}`}>
                  <Link
                    href={stationHref}
                    className="hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>{st.name_ja}駅 周辺の競売物件</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/search/station"
                className="hover:text-blue-700 hover:underline flex items-center gap-1 text-slate-500"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>路線・駅から探すトップ</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Market Valuation & Auction Results */}
        <div className="space-y-2.5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>相場データ・関連ツール</span>
          </h3>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              <Link
                href={`/auction-results?prefecture=${prefEncoded}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の過去落札相場結果</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/trade-find?pref=${prefEncoded}${cityEncoded ? `&city=${cityEncoded}` : ''}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}{city ? city : ''}の不動産実勢取引相場 (MLIT)</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/area-map/${prefEncoded}${cityEncoded ? `/${cityEncoded}` : ''}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}{city ? city : ''}のエリア分析マップ (災害・用途地域)</span>
              </Link>
            </li>
            <li>
              <Link
                href="/auction/schedule"
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>裁判所 開札スケジュールカレンダー</span>
              </Link>
            </li>
            <li>
              <Link
                href="/blogs"
                className="hover:text-blue-700 hover:underline flex items-center gap-1 text-slate-500"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>競売入札ガイド・3点セットの読み方</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* --- HIGH-DEMAND INDUSTRY SEARCH INTENT MATRIX (TOP 10 KEYWORDS) --- */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            注目の検索キーワード・投資テーマから探す
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* #1 3点セット 読み方 */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors"
          >
            <span>📄 3点セット 読み方 初心者ガイド</span>
          </Link>

          {/* #2 占有者 立ち退き 費用 期間 */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors"
          >
            <span>⚖️ 占有者 立ち退き 費用 期間の目安</span>
          </Link>

          {/* #3 東京 競売 物件 格安 */}
          <Link
            href="/map?prefecture=%E6%9D%B1%E4%BA%AC%E9%83%BD&maxPrice=1000"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#1B4F8A] dark:text-blue-300 text-[11px] font-medium transition-colors"
          >
            <span>🏙️ 東京 競売 物件 格安 (1,000万円以下)</span>
          </Link>

          {/* #4 期間入札 流れ 裁判所 */}
          <Link
            href="/auction/schedule"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors"
          >
            <span>📅 期間入札 流れ 裁判所スケジュール</span>
          </Link>

          {/* #5 ボロ戸建て 競売 利回り20% */}
          <Link
            href="/map?types[]=%E6%88%B8%E5%BB%BA%E3%81%A6&minGap=30"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium transition-colors"
          >
            <span>💰 ボロ戸建て 競売 利回り20%狙い物件</span>
          </Link>

          {/* #6 国税庁 公売 物件 検索 */}
          <Link
            href="/map?provider=NTA"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px] font-medium transition-colors"
          >
            <span>🏛️ 国税庁 公売 物件 検索 (全国)</span>
          </Link>

          {/* #7 空き家再生 競売 リノベーション */}
          <Link
            href="/map?minGap=40"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-[11px] font-medium transition-colors"
          >
            <span>🔨 空き家・古民家 競売リノベーション再生</span>
          </Link>

          {/* #8 埼玉 戸建て 競売 500万以下 */}
          <Link
            href="/map?prefecture=%E5%9F%BC%E7%8E%89%E7%9C%8C&types[]=%E6%88%B8%E5%BB%BA%E3%81%A6&maxPrice=500"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium transition-colors"
          >
            <span>🏡 埼玉 戸建て 競売 500万以下</span>
          </Link>

          {/* #9 特別売却 競売 先着順 コツ */}
          <Link
            href="/auction/schedule"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-[11px] font-medium transition-colors"
          >
            <span>⚡ 特別売却 競売 先着順 コツと日程</span>
          </Link>

          {/* #10 千葉 空き家 競売 再生 */}
          <Link
            href="/map?prefecture=%E5%8D%83%E8%91%89%E7%9C%8C&types[]=%E6%88%B8%E5%BB%BA%E3%81%A6"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[11px] font-medium transition-colors"
          >
            <span>🏠 千葉 空き家 競売 再生・戸建て</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

