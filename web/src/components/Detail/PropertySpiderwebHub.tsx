import React from 'react';
import Link from 'next/link';
import { MapPin, Building2, Train, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react';

interface PropertySpiderwebHubProps {
  prefecture?: string | null;
  city?: string | null;
  propertyType?: string | null;
  nearestStations?: Array<{ name_ja: string; line_name?: string | null }>;
}

export function PropertySpiderwebHub({
  prefecture,
  city,
  propertyType = '戸建て',
  nearestStations = []
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
                  href={`/map?line=${encodeURIComponent(line)}`}
                  className="hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>{line}沿線の物件一覧</span>
                </Link>
              </li>
            ))}
            {stations.slice(0, 2).map(st => (
              <li key={st}>
                <Link
                  href={`/map?keyword=${encodeURIComponent(st)}`}
                  className="hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>{st}駅 周辺の競売物件</span>
                </Link>
              </li>
            ))}
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
                href={`/trade-find?prefecture=${prefEncoded}`}
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{prefecture}の不動産実取引相場 (MLIT)</span>
              </Link>
            </li>
            <li>
              <Link
                href="/area-map"
                className="hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>エリア分析マップ (災害・用途地域)</span>
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
    </section>
  );
}

