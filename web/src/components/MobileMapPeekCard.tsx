'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronRight, TrendingDown, Train, ExternalLink, Calendar, MapPin, Navigation } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import { getSourceProviderMeta } from '../lib/sourceProviderConfig';
import { cleanAddress } from '../lib/utils';
import { getPropertyTypeColor, type SharedProperty } from '../types';

interface MobileMapPeekCardProps {
  property: SharedProperty | null;
  onClose: () => void;
}

export default function MobileMapPeekCard({ property, onClose }: MobileMapPeekCardProps) {
  const [imgError, setImgError] = useState(false);
  const touchStartY = useRef<number | null>(null);

  if (!property) return null;

  const providerMeta = getSourceProviderMeta(property.source_provider);
  const typeColors = getPropertyTypeColor(property.property_type);

  let formattedPrice = '未定';
  if (property.starting_price && Number(property.starting_price) > 0) {
    formattedPrice = `${(Number(property.starting_price) / 10000).toLocaleString('ja-JP')}万円`;
  }

  const rawAddress = cleanAddress(property.address || property.court_name || '');
  const displayAddress = rawAddress.length > 30 ? rawAddress.slice(0, 30) + '…' : rawAddress;

  const images = Array.isArray(property.images) ? property.images : [];
  const imageSrc = imgError || (!property.thumbnailUrl && images.length === 0)
    ? '/no-image.png'
    : (property.thumbnailUrl || images[0]);

  const investmentGap = typeof property.mlit_investment_gap === 'number'
    ? Math.round(property.mlit_investment_gap)
    : null;

  // Swipe Down to Dismiss Gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        onClose();
      }
      touchStartY.current = null;
    }
  };

  return (
    <div 
      className="lg:hidden fixed bottom-3 inset-x-3 z-50 max-w-md mx-auto animate-in fade-in-0 slide-in-from-bottom-5 duration-200 ease-out"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 dark:border-zinc-800 p-3 pt-2 relative overflow-hidden">
        
        {/* Swipe Handle Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 opacity-80" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-colors z-10"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        <Link href={`/property/${property.sale_unit_id}`} className="flex gap-3 group">
          {/* Thumbnail */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
            <Image
              fill
              src={imageSrc}
              alt={property.sale_unit_id}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
              sizes="120px"
              unoptimized={true}
            />
            <div className="absolute bottom-1 left-1 flex flex-col gap-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColors.bg} ${typeColors.text} border ${typeColors.border} backdrop-blur-xs`}>
                {property.property_type || '物件'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div className="pr-6">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${providerMeta.badgeClass}`}>
                  {providerMeta.label}
                </span>
                {property.court_name && (
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    {property.court_name}
                  </span>
                )}
              </div>

              <h4 className="text-[12px] font-bold text-slate-800 dark:text-zinc-100 line-clamp-1 leading-snug">
                {displayAddress}
              </h4>

              {property.nearest_station && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  <Train className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{property.nearest_station}</span>
                </div>
              )}

              {property.auctionSchedule && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{property.auctionSchedule}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">売却基準価額</span>
                <span className="text-base font-extrabold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
                  {formattedPrice}
                </span>
              </div>

              {investmentGap !== null && investmentGap < 0 && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  <TrendingDown className="w-3 h-3" />
                  <span>相場比 {investmentGap}%安値</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Action Toolbar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
          <Link
            href={`/property/${property.sale_unit_id}`}
            className="flex-1 h-11 rounded-xl bg-[#1B4F8A] hover:bg-[#153e6d] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>物件詳細を見る</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          
          {property.lat && property.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="h-11 px-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-[11px] flex items-center gap-1 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
              title="Google Mapsでナビ"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>マップ</span>
            </a>
          )}

          <div className="shrink-0 scale-95">
            <FavoriteButton id={property.sale_unit_id} />
          </div>
        </div>

      </div>
    </div>
  );
}
