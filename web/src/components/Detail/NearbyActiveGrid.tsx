import React from 'react';
import Link from 'next/link';
import { MapPin, Building2, Train, TrendingUp, ChevronRight, ExternalLink } from 'lucide-react';
import { cleanAddress } from '@/lib/utils';

interface NearbyActiveGridProps {
  properties: any[];
  currentPrefecture?: string | null;
  currentCity?: string | null;
}

export function NearbyActiveGrid({
  properties = [],
  currentPrefecture,
  currentCity
}: NearbyActiveGridProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#1B4F8A] rounded-xs"></span>
            近隣の競売・公売物件 (入札受付中)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentPrefecture}{currentCity ? currentCity : ''}周辺で現在公開されている物件一覧です。
          </p>
        </div>
        {currentPrefecture && (
          <Link
            href={`/map?prefecture=${encodeURIComponent(currentPrefecture)}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>{currentPrefecture}の物件をすべて見る</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.slice(0, 6).map((item) => {
          const priceNum = item.starting_price ? Number(item.starting_price) : 0;
          const priceMan = priceNum > 0 ? Math.round(priceNum / 10000).toLocaleString('ja-JP') : null;
          const isKoubai = item.source_provider === 'NTA';
          const imageUrl = Array.isArray(item.images) && item.images.length > 0 
            ? item.images[0] 
            : item.thumbnailUrl;

          const addressText = item.prefecture && item.city
            ? cleanAddress(item.address, item.prefecture, item.city)
            : item.address || '所在地情報あり';

          return (
            <Link
              key={item.sale_unit_id}
              href={`/property/${item.sale_unit_id}`}
              className="group block bg-slate-50/60 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-all overflow-hidden p-3 shadow-2xs"
            >
              {/* Image & Provider Tag */}
              <div className="relative w-full h-32 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2.5">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={addressText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    画像準備中
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs text-white ${isKoubai ? 'bg-red-700' : 'bg-[#1B4F8A]'}`}>
                    {isKoubai ? '公売' : '競売'}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shadow-2xs bg-slate-900/80 text-white">
                    {item.property_type || '物件'}
                  </span>
                </div>
              </div>

              {/* Title & Info */}
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-700 transition-colors mb-1.5">
                {addressText}
              </h3>

              <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  基準価額:
                </div>
                <div className="text-sm font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                  {priceMan ? `${priceMan}万円` : '価格未定'}
                </div>
              </div>

              {item.nearest_station && (
                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <Train className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.nearest_station}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

