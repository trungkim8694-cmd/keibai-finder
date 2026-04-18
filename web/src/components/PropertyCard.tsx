'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type SharedProperty } from '../types';
import { PropertyInfoTags } from './PropertyInfoTags';
import FavoriteButton from './FavoriteButton';
import { extractAuctionEndDate } from '../lib/utils';
import { formatDateJapan } from '../utils/dateFormatter';
import { CourtContactLink } from './CourtContactLink';
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
  onMouseLeave
}: { 
  property: SharedProperty;
  isHovered?: boolean;
  isActive?: boolean;
  distanceFromTarget?: number;
  layout?: 'horizontal' | 'vertical';
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isHovered]);
  let formattedPrice = '未定';
  if (property.starting_price) {
    formattedPrice = `${(Number(property.starting_price) / 10000).toLocaleString('ja-JP')}万円`;
  }
  
  // REAL AI YIELD (from ai_analysis)
  const isSupportedType = ['戸建て', 'マンション'].includes(property.property_type);
  const aiYield = property.ai_analysis?.ja?.roi_analysis?.yield_percent;
  const showAiYield = isSupportedType && aiYield !== undefined && aiYield > 0;

  // contact_url is pre-extracted by the server action from BIT Summary section
  const courtContactUrl: string | null = (property as any).contact_url || null;
  
  // NTA Countdown Logic
  let ntaCountdownUI = null;
  if (property.source_provider === 'NTA') {
    const rawData = (property as any).raw_display_data;
    const endDate = (property as any).endDate || extractAuctionEndDate(rawData);
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
        <div className="mb-3 lg:mb-2 flex flex-col gap-0.5 mt-auto">
           <div className="flex items-center gap-1.5 text-[13px] lg:text-[11px]">
             <span className="text-zinc-500 dark:text-zinc-400 font-medium">入札締切:</span>
             <span className="font-bold text-zinc-800 dark:text-zinc-200">{formattedDate}</span>
             <span className={`text-[12px] lg:text-[11px] ${statusColor}`}>{statusText}</span>
           </div>
        </div>
      );
    }
  }
  
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => {
        console.log('Hovering on ID:', property.sale_unit_id);
        if (onMouseEnter) onMouseEnter();
      }}
      onMouseLeave={onMouseLeave}
      className={`block bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 mb-4 mt-2 group relative flex ${layout === 'horizontal' ? 'flex-col sm:flex-row' : 'flex-col'} hover:z-10 cursor-pointer ${
        isActive
          ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
          : isHovered 
            ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30' 
            : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      {/* Remove the absolute Link overlay so the whole card is just a click target handling onClick without navigating away */}
      {/* Thumbnail */}
      <div className={`relative w-full ${layout === 'horizontal' ? 'sm:w-1/3 lg:w-1/4 h-32 sm:h-auto' : 'h-32'} shrink-0 bg-zinc-100 dark:bg-zinc-800 pointer-events-none`}>
        <Image
          src={property.thumbnailUrl || (property.images && property.images.length > 0 ? property.images[0] : '/no-image.png')}
          alt="物件の写真"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Is New Badge (< 24h) */}
        {(property as any).created_at && (Date.now() - new Date((property as any).created_at).getTime() < 24 * 60 * 60 * 1000) && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20 shadow-lg overflow-hidden">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] sm:text-[9px] font-bold tracking-widest text-white relative">
              <span className="relative z-10">NEW</span>
              <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></span>
            </span>
          </div>
        )}

        {/* Top badges (like Favorites, Tags) & Distance */}
        <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1 pointer-events-auto">
          <FavoriteButton id={property.sale_unit_id} />
          
          {property.source_provider === 'NTA' && (
             <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                <span>🏛️ NTA</span>
             </div>
          )}

          {/* Dynamic Distance Indicator */}
          {distanceFromTarget !== undefined && distanceFromTarget > 0 && distanceFromTarget < 9999 ? (
             <div className="bg-[#1D4ED8]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-fade-in">
                <span>📍</span> +{distanceFromTarget.toFixed(1)}km
             </div>
          ) : null}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 lg:p-2.5 flex-1 flex flex-col justify-between z-10 bg-white dark:bg-zinc-900 rounded-r-xl">
        
        <div className="mb-2 lg:mb-1 flex justify-between items-start gap-2">
          <div className="min-w-0">
            <span className="text-[11px] lg:text-[10px] font-medium block truncate">
              {property.source_provider === 'NTA' ? (
                <CourtContactLink 
                  courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : 'NTA 税務署'} 
                  contactUrl={property.contact_url || property.source_url} 
                  theme="red"
                />
              ) : (
                <CourtContactLink courtName={property.court_name} contactUrl={courtContactUrl} />
              )}
            </span>
          </div>

          {property.mlit_investment_gap !== null && property.mlit_investment_gap !== undefined && property.mlit_investment_gap > 0 && (
            <span className="shrink-0 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 shadow-sm whitespace-nowrap transition-transform hover:scale-105">
              <span className="text-[10px] sm:text-[11px]">📈</span> 投資ギャップ +{property.mlit_investment_gap.toFixed(1)}%
            </span>
          )}
        </div>
        
        <h3 className="text-[11px] lg:text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2 lg:mb-1 line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
          {!property.address || property.address === 'Unknown' ? '住所不明' : property.address}
        </h3>
         <div className="mb-4 lg:mb-3">
           <PropertyInfoTags property={property} displayArea={(property as any).area ? `${Math.round((property as any).area).toLocaleString('en-US')}m²` : null} />
         </div>
        

        
        {ntaCountdownUI}
        
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 lg:pt-2 mt-auto flex items-end justify-between pr-1 gap-1">
          <div className="shrink-0 overflow-hidden">
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">売却基準価額</p>
            <p className="font-bold text-[12px] lg:text-[11px] tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">{formattedPrice}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }} 
              className="group/btn bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-all duration-300 text-[10px] font-bold py-1 px-1.5 rounded-lg flex items-center gap-0.5 shadow-sm border border-emerald-100"
              title="地図で位置を見る"
            >
               <span>🎯</span>
               <span>地図</span>
            </button>
            <a 
              href={`/property/${property.sale_unit_id}`} 
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} 
              className="group/btn bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-all duration-300 text-[10px] font-bold py-1 px-1.5 rounded-lg flex items-center gap-0.5 shadow-sm border border-blue-100"
            >
               <span>詳細</span>
               <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
