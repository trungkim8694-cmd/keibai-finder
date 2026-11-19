'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ExternalLink, MapPin, Train, Calendar, Maximize2, Compass, Tag, Building2 } from 'lucide-react';
import type { SharedProperty } from '@/types';
import { cleanAddress } from '@/lib/utils';
import { getPropertyTypeColor } from '@/types';
import { getSourceProviderMeta, isPublicAuctionProvider } from '@/lib/sourceProviderConfig';
import FavoriteButton from '@/components/FavoriteButton';

interface PropertyQuickDrawerProps {
  property: SharedProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStreetView?: (data: { lat: number; lng: number; title: string; address: string }) => void;
}

export default function PropertyQuickDrawer({
  property,
  isOpen,
  onClose,
  onOpenStreetView,
}: PropertyQuickDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Thumbnail handling
  const resolveInitialThumb = () => {
    if (!property) return '/no-image.png';
    const images = property.images || [];
    const permanent = images.find(img => img && (img.includes('r2.dev') || img.includes('supabase.co')));
    if (permanent) return permanent;
    if (property.thumbnailUrl) return property.thumbnailUrl;
    if (images.length > 0) return images[0];
    return '/no-image.png';
  };

  const [imgSrc, setImgSrc] = useState<string>('/no-image.png');
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    if (property) {
      setImgSrc(resolveInitialThumb());
      setTriedFallback(false);
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleImageError = () => {
    if (!triedFallback && property) {
      setTriedFallback(true);
      const alt = (property.images || []).find(
        img => img && img !== imgSrc && !img.includes('bit.courts.go.jp') && !img.includes('bit.sikkou.jp')
      );
      if (alt) {
        setImgSrc(alt);
        return;
      }
    }
    setImgSrc('/no-image.png');
  };

  const formattedPrice = property.starting_price
    ? `${(Number(property.starting_price) / 10000).toLocaleString('ja-JP')}万円`
    : '未定';

  const typeColor = getPropertyTypeColor(property.property_type);
  const providerMeta = getSourceProviderMeta(property.source_provider);
  const isPublic = isPublicAuctionProvider(property.source_provider);
  const displayAddress = cleanAddress(property.address, property.prefecture, property.city);

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container: Responsive Bottom-Sheet on Mobile, Slide-Over on Desktop */}
      <div 
        className="relative z-10 w-full md:max-w-md lg:max-w-lg bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-[88dvh] md:h-full mt-auto md:mt-0 rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 transition-transform animate-in slide-in-from-bottom md:slide-in-from-right duration-250 ease-out overflow-hidden"
      >
        {/* Mobile Swipe Bar Indicator */}
        <div className="md:hidden w-full pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 pr-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${providerMeta.badgeClass}`}>
              {isPublic ? providerMeta.badgeText : '競売物件'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
              {property.property_type || '不動産'}
            </span>
            {property.court_name && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[140px]">
                {property.court_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <FavoriteButton id={property.sale_unit_id} compact />
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="閉じる (Esc)"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Main Photo Gallery Preview */}
          <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 group shadow-inner">
            <Image
              src={imgSrc}
              alt={displayAddress}
              fill
              unoptimized
              onError={handleImageError}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                <span>1 / {property.images.length} 枚</span>
              </div>
            )}
            {/* Quick 360 Street View Trigger */}
            {property.lat && property.lng && onOpenStreetView && (
              <button
                type="button"
                onClick={() => onOpenStreetView({
                  lat: property.lat,
                  lng: property.lng,
                  title: `売却基準価額: ${formattedPrice}`,
                  address: displayAddress
                })}
                className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-medium border border-amber-300/80 bg-amber-500/90 hover:bg-amber-600 text-white rounded-lg shadow-md transition-colors inline-flex items-center gap-1 backdrop-blur-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>360° 現地</span>
              </button>
            )}
          </div>

          {/* Pricing Highlight Card */}
          <div className="p-3.5 bg-gradient-to-br from-blue-50/80 via-white to-slate-50/60 dark:from-blue-950/20 dark:via-zinc-900 dark:to-zinc-900 border border-blue-200/80 dark:border-blue-900/50 rounded-xl shadow-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                売却基準価額 (最低入札価格の目安)
              </span>
              {property.roiPercent && property.roiPercent > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                  想定利回り {property.roiPercent}%
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B4F8A] dark:text-blue-400 font-mono tabular-nums">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Key Information Specs */}
          <div className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
            {/* Address */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-400 block mb-0.5">物件所在地</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words leading-relaxed">
                  {displayAddress}
                </span>
              </div>
            </div>

            {/* Auction Schedule */}
            {property.auctionSchedule && (
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-400 block mb-0.5">入札期間 / タイムライン</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {property.auctionSchedule}
                  </span>
                </div>
              </div>
            )}

            {/* Area & Nearest Station */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] mb-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>面積・規模</span>
                </div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {property.totalArea ? `${property.totalArea} ㎡` : '公図・調査書参照'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] mb-0.5">
                  <Train className="w-3.5 h-3.5" />
                  <span>最寄り駅</span>
                </div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {property.nearest_station || '最寄り駅調査中'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Fixed Footer Actions */}
        <div className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center gap-2">
          <Link
            href={`/property/${property.sale_unit_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/10 transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <span>詳細ページを開く (別タブ)</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
