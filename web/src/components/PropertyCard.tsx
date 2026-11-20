'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { type SharedProperty } from '../types';
import { PropertyInfoTags } from './PropertyInfoTags';
import FavoriteButton from './FavoriteButton';
import { extractAuctionEndDate, extractTotalArea, cleanAddress } from '../lib/utils';
import { formatDateJapan } from '../utils/dateFormatter';
import { CourtContactLink } from './CourtContactLink';
import { resolvePropertyAiAnalysis } from '../lib/aiRiskExtractor';
import { getSourceProviderMeta, isPublicAuctionProvider, getPriceLabel } from '../lib/sourceProviderConfig';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export default function PropertyCard({ 
  property,
  isHovered,
  isActive,
  distanceFromTarget,
  layout = 'horizontal',
  onClick,
  onMouseEnter,
  onMouseLeave,
  onPreview
}: { 
  property: SharedProperty;
  isHovered?: boolean;
  isActive?: boolean;
  distanceFromTarget?: number;
  layout?: 'horizontal' | 'vertical';
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPreview?: (property: SharedProperty) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isHovered]);

  // Intelligent thumbnail resolution: prefer permanent storage (R2, Supabase)
  const resolveInitialThumb = () => {
    const images = property.images || [];
    const permanent = images.find(img => img && (img.includes('r2.dev') || img.includes('supabase.co')));
    if (permanent) return permanent;
    if (property.thumbnailUrl) return property.thumbnailUrl;
    if (images.length > 0) return images[0];
    return '/no-image.png';
  };

  const [imgSrc, setImgSrc] = useState<string>(resolveInitialThumb);
  const [triedFallback, setTriedFallback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImgSrc(resolveInitialThumb());
    setTriedFallback(false);
  }, [property.thumbnailUrl, property.images]);

  const handleImageError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      // Try to find an alternate image in images that is not the current failed imgSrc and not a dead BIT link
      const alt = (property.images || []).find(img => img && img !== imgSrc && !img.includes('bit.courts.go.jp') && !img.includes('bit.sikkou.jp'));
      if (alt) {
        setImgSrc(alt);
        return;
      }
    }
    setImgSrc('/no-image.png');
  };

  let formattedPrice = '未定';
  if (property.starting_price) {
    formattedPrice = `${(Number(property.starting_price) / 10000).toLocaleString('ja-JP')}万円`;
  }
  


  // contact_url is pre-extracted by the server action from BIT Summary section
  const courtContactUrl: string | null = (property as any).contact_url || null;
  
  // Public Auction (NTA / KSI / MOF) Countdown Logic
  const providerMeta = getSourceProviderMeta(property.source_provider);
  let ntaCountdownUI = null;
  if (isPublicAuctionProvider(property.source_provider)) {
    const rawData = (property as any).raw_display_data;
    const endDate = (property as any).bid_end_date || (property as any).endDate || extractAuctionEndDate(rawData);
    if (endDate) {
      const nowMs = dayjs().valueOf();
      const endMs = dayjs.utc(endDate).valueOf();
      
      const nowDay = dayjs().startOf('day').valueOf();
      const endDay = dayjs.utc(endDate).startOf('day').valueOf();
      
      const diffDays = Math.ceil((endDay - nowDay) / (1000 * 60 * 60 * 24));
      const diffMs = endMs - nowMs;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      let statusText = '';
      let statusColor = '';
      
      if (diffMs < 0) {
        statusText = '(終了)'; // Expired
        statusColor = 'text-red-500';
      } else if (diffHours < 24) {
        statusText = `(あと${diffHours}時間)`;
        statusColor = 'text-red-500 font-bold';
      } else {
        statusText = `(あと${diffDays}日)`;
        statusColor = 'text-emerald-600 font-bold';
      }
      
      const formattedDate = formatDateJapan(endDate);
      
      ntaCountdownUI = (
        <div className="mb-3 lg:mb-2 flex flex-col gap-0.5">
           <div className="flex items-center gap-1.5 text-[13px] lg:text-[11px]">
             <span className="text-zinc-500 dark:text-zinc-400 font-medium">入札締切:</span>
             <span className="font-bold text-zinc-800 dark:text-zinc-200">{formattedDate}</span>
             {mounted && <span className={`text-[12px] lg:text-[11px] ${statusColor}`}>{statusText}</span>}
           </div>
        </div>
      );
    }
  }
  
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`block bg-white dark:bg-[#151B22] border rounded-lg overflow-hidden transition-all duration-200 mb-3 group relative flex ${layout === 'horizontal' ? 'flex-col sm:flex-row' : 'flex-col'} cursor-pointer ${
        isActive
          ? 'border-[#1B4F8A] dark:border-[#2B6CB0] ring-1 ring-[#1B4F8A] bg-slate-50/70 dark:bg-slate-900/60 shadow-sm'
          : isHovered 
            ? 'border-[#1B4F8A]/80 dark:border-[#2B6CB0]/80 shadow-sm' 
            : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      {/* Remove the absolute Link overlay so the whole card is just a click target handling onClick without navigating away */}
      {/* Thumbnail */}
      <div className={`relative w-full ${layout === 'horizontal' ? 'sm:w-1/3 lg:w-1/4 h-32 sm:h-auto' : 'h-32'} shrink-0 bg-zinc-100 dark:bg-zinc-800 pointer-events-none`}>
        <Image
          src={imgSrc}
          alt="物件の写真"
          fill
          unoptimized
          onError={handleImageError}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Is New Badge (< 24h) */}
        {mounted && (property as any).created_at && (Date.now() - new Date((property as any).created_at).getTime() < 24 * 60 * 60 * 1000) && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60">
              新着
            </span>
          </div>
        )}

        {/* Top badges (like Favorites, Tags) & Distance */}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1 pointer-events-auto">
          <FavoriteButton id={property.sale_unit_id} />
          
          {property.source_provider && property.source_provider !== 'BIT' && (
             <div className={`${providerMeta.badgeClass} text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm`}>
                {providerMeta.badgeText}
             </div>
          )}

          {/* Dynamic Distance Indicator */}
          {distanceFromTarget !== undefined && distanceFromTarget > 0 && distanceFromTarget < 9999 ? (
             <div className="bg-[#1B4F8A] text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm tabular-nums">
                +{distanceFromTarget.toFixed(1)}km
             </div>
          ) : null}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 lg:p-2.5 flex-1 flex flex-col justify-between z-10 bg-white dark:bg-zinc-900 rounded-r-xl min-w-0">
        
        <div className="mb-2 lg:mb-1 flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-[11px] lg:text-[10px] font-medium block truncate">
              {isPublicAuctionProvider(property.source_provider) ? (
                <CourtContactLink 
                  courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : (property.court_name || providerMeta.authorityFallback)} 
                  contactUrl={property.contact_url || property.source_url} 
                  theme={providerMeta.linkTheme}
                />
              ) : (
                <CourtContactLink courtName={property.court_name} contactUrl={courtContactUrl} />
              )}
            </span>
          </div>

          {property.mlit_investment_gap !== null && property.mlit_investment_gap !== undefined && property.mlit_investment_gap > 0 && (
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/60 tabular-nums">
              市場比 {property.mlit_investment_gap.toFixed(0)}% 割安
            </span>
          )}
        </div>
        
        <h3 className="text-[12px] lg:text-[11px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5 line-clamp-2 leading-snug group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
          {cleanAddress(property.address, property.prefecture, property.city)}
        </h3>
         <div className="mb-4 lg:mb-3">
           {(() => {
             const dbArea = (property as any).area && (property as any).area > 0 ? (property as any).area : null;
             const parsedArea = dbArea || extractTotalArea(property.raw_display_data);
             const displayArea = parsedArea ? `${Math.round(parsedArea).toLocaleString('en-US')}m²` : null;
             
             return <PropertyInfoTags property={property} displayArea={displayArea} />;
           })()}
         </div>
        

        
        {/* AI Complexity Quick Badge */}
        {(() => {
          const ai = resolvePropertyAiAnalysis(property);
          const hasArrears = ai.metrics.arrears.amountYen > 0;
          const isCaution = ai.complexityLevel === 'C' || ai.complexityLevel === 'D';

          return (
            <div className="mb-2 flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums ${
                isCaution
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60'
                  : hasArrears
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-zinc-700/60'
              }`}>
                調査難易度 {ai.complexityLevel}
              </span>

              {hasArrears && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 tabular-nums">
                  滞納約{Math.round(ai.metrics.arrears.amountYen / 10000)}万
                </span>
              )}
            </div>
          );
        })()}

        {ntaCountdownUI}
        
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-auto flex items-end justify-between pr-1 gap-1">
          <div className="shrink-0 overflow-hidden">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {getPriceLabel(property.source_provider)}
            </p>
            <p className="font-bold text-[13px] lg:text-[12px] tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">{formattedPrice}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }} 
              className="px-2 py-1 text-[11px] font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded transition-colors"
              title="地図で位置を見る"
            >
               地図
            </button>
            {onPreview ? (
              <>
                {/* Mobile: Trượt mở Bottom Sheet không bung tab mới */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(property);
                  }}
                  className="md:hidden px-2.5 py-1 text-[11px] font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors inline-flex items-center gap-0.5"
                >
                  詳細
                </button>
                {/* Desktop: Giữ nguyên mở tab mới để phục vụ Tab Hoarding */}
                <a 
                  href={`/property/${property.sale_unit_id}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()} 
                  className="hidden md:inline-flex px-2.5 py-1 text-[11px] font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors"
                >
                  詳細
                </a>
              </>
            ) : (
              <a 
                href={`/property/${property.sale_unit_id}`} 
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} 
                className="px-2.5 py-1 text-[11px] font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors"
              >
                詳細
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
