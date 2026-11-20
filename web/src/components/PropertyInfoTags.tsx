'use client';

import React, { useState, useEffect } from 'react';
import { type SharedProperty, getPropertyTypeColor } from '../types';
import { CourtContactLink } from './CourtContactLink';
import { AsyncStationInfo } from './AsyncStationInfo';
import { formatBidPeriod } from '../utils/dateFormatter';
import { resolveAccuratePropertyType, extractDualAreasAndYear } from '@/lib/propertyDataNormalizer';

interface InfoTagsProps {
  property: SharedProperty;
  displayArea?: string | null;
  children?: React.ReactNode;
  showCourtTag?: boolean;
  variant?: 'card' | 'detail-header';
}

export function PropertyInfoTags({ 
  property, 
  displayArea, 
  children, 
  showCourtTag = false,
  variant = 'card' 
}: InfoTagsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDetailHeader = variant === 'detail-header';
  const isKoubai = property.source_provider === 'NTA';

  // Accurate Type Resolution
  const accurateType = resolveAccuratePropertyType(property);
  const color = getPropertyTypeColor(accurateType);

  // Dual Areas & Structure Specs
  const dualSpecs = extractDualAreasAndYear(property);

  // Auction Round & Price Drop logic
  const roundNum = property.auctionRound;
  const priceDropYen = (property as any).priceDropYen ? Number((property as any).priceDropYen) : 0;
  const priceDropMan = priceDropYen > 0 ? Math.round(priceDropYen / 10000) : 0;
  const isExplicitRound = roundNum !== undefined && roundNum !== null && roundNum > 0;
  // For NTA, do not blindly stamp (初) unless explicitly provided
  const showRoundBadge = !isKoubai || (isExplicitRound && roundNum > 1);
  const roundText = (roundNum || 1) === 1 ? '(初)' : `(${roundNum}回目)`;
  const roundColor = (roundNum || 1) === 1 
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:text-emerald-400' 
    : 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 font-bold';

  // If in Detail Header variant, render rich spec badges without duplicate station & schedule
  if (isDetailHeader) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {/* 1. Property Type Badge */}
        <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded shrink-0 ${color.bg} ${color.text} ${color.border} inline-flex items-center leading-none dark:bg-opacity-20`}>
          {accurateType}
        </span>

        {/* 2. Land Area Badge */}
        {dualSpecs.landAreaSqm && (
          <span className="text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            土地 {Math.round(dualSpecs.landAreaSqm).toLocaleString('ja-JP')}m²
          </span>
        )}

        {/* 3. Building Total Floor Area Badge */}
        {dualSpecs.buildingAreaSqm && (
          <span className="text-[11px] font-medium border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 px-2 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            延床 {Math.round(dualSpecs.buildingAreaSqm).toLocaleString('ja-JP')}m²
          </span>
        )}

        {/* Fallback Single Area if dual not available */}
        {!dualSpecs.landAreaSqm && !dualSpecs.buildingAreaSqm && displayArea && displayArea !== '0m²' && (
          <span className="text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            {displayArea}
          </span>
        )}

        {/* 4. Structure Badge (e.g., RC造, 7階建) */}
        {dualSpecs.structure && (
          <span className="text-[11px] font-normal border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded shrink-0 inline-flex items-center leading-none">
            {dualSpecs.structure.length > 25 ? dualSpecs.structure.substring(0, 25) + '...' : dualSpecs.structure}
          </span>
        )}

        {/* 5. Build Year Badge */}
        {dualSpecs.buildYearWestern && (
          <span className="text-[11px] font-normal border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            {dualSpecs.buildYearJapanese ? `${dualSpecs.buildYearJapanese}（${dualSpecs.buildYearWestern}年築）` : `${dualSpecs.buildYearWestern}年築`}
          </span>
        )}

        {/* 6. Auction Round Badge (or children) */}
        {children || (showRoundBadge && (
          <span className={`text-[11px] font-medium border px-1.5 py-0.5 rounded shrink-0 inline-flex items-center justify-center ${roundColor} dark:bg-opacity-20 leading-none`}>
            {roundText}
          </span>
        ))}

        {/* 7. View Count */}
        <span className="text-[11px] font-normal border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded shrink-0 inline-flex items-center gap-1 leading-none ml-auto tabular-nums">
          <span>閲覧</span>
          <span>{(property.views || 0).toLocaleString()}</span>
        </span>
      </div>
    );
  }

  // --- CARD VARIANT (For Map/List Property Cards) ---
  const formattedArea = displayArea;
  let formattedSchedule = property.auctionSchedule || (property as any).extractedSchedule;
  if (!formattedSchedule && ((property as any).bid_start_date || (property as any).bid_end_date)) {
    formattedSchedule = formatBidPeriod((property as any).bid_start_date, (property as any).bid_end_date);
  }

  // Progress computation
  let progressWidth = '0%';
  let progressColor = 'bg-emerald-500';
  const endDateStr = (property as any).bid_end_date;
  if (endDateStr) {
    const now = new Date().getTime();
    const end = new Date(endDateStr).getTime();
    const created_at = (property as any).created_at;
    const start = created_at ? new Date(created_at).getTime() : end - (45 * 24 * 60 * 60 * 1000);
    
    const percent = Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
    progressWidth = mounted ? `${percent}%` : '0%';
    
    const nowObj = new Date();
    nowObj.setHours(0, 0, 0, 0);
    const endObj = new Date(end);
    endObj.setHours(0, 0, 0, 0);
    const diffDays = Math.round((endObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) progressColor = 'bg-zinc-500';
    else if (diffDays <= 2) progressColor = 'bg-red-500 animate-pulse';
    else if (diffDays <= 5) progressColor = 'bg-amber-500';
  }

  // Station label
  const stationName = property.nearest_station;
  const walkTime = (property as any).walk_time_to_station;
  const lineName = (property as any).line_name;
  let staticStationLabel = null;
  if (stationName) {
    staticStationLabel = (lineName ? `${lineName} / ` : '') + (walkTime ? `${stationName} 徒歩${walkTime}分` : stationName);
  }

  return (
    <div className="flex flex-col gap-1 w-full pb-1">
      {/* Line 1: Type, Area, Round, Views */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded shrink-0 ${color.bg} ${color.text} ${color.border} inline-block dark:bg-opacity-20 leading-none`}>
          {accurateType}
        </span>
        {property.status === 'SOLD' && (
          <span className="text-[10px] font-bold border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none">
            落札済
          </span>
        )}
        {property.status === 'ARCHIVED' && (
          <span className="text-[10px] font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none">
            期間終了
          </span>
        )}
        {formattedArea && formattedArea !== '0m²' && (
          <span className="text-[10px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            {formattedArea}
          </span>
        )}
        {children || (showRoundBadge && (
          <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded shrink-0 inline-flex items-center justify-center ${roundColor} dark:bg-opacity-20 leading-none tabular-nums`}>
            {roundText}
          </span>
        ))}
        {priceDropMan > 0 && (
          <span className="text-[10px] font-bold border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none tabular-nums">
            ↓{priceDropMan.toLocaleString('ja-JP')}万円値下げ
          </span>
        )}
        <span className="text-[10px] font-normal border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-1 leading-none ml-auto tabular-nums">
          <span>閲覧</span>
          <span>{(property.views || 0).toLocaleString()}</span>
        </span>
      </div>

      {/* Line 2: Schedule & CourtTag */}
      {(formattedSchedule || showCourtTag) && (
        <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
          {formattedSchedule && (
            <span className="relative text-[10px] font-medium border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none overflow-hidden tabular-nums">
              <span className="relative z-10 flex items-center">
                <span>{formattedSchedule}</span>
              </span>
              <span className={`absolute bottom-0 left-0 h-[2px] ${progressColor} transition-all duration-1000 z-0`} style={{ width: progressWidth }} />
            </span>
          )}
          {showCourtTag && isKoubai ? (
            <span className="text-[10px] font-medium border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none">
              <CourtContactLink
                courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : 'NTA 税務署'}
                contactUrl={property.contact_url || property.source_url}
                theme="red"
                className="text-[10px] font-medium"
              />
            </span>
          ) : showCourtTag && property.court_name && property.court_name !== 'Unknown' ? (
            <span className="text-[10px] font-medium border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center leading-none">
              <CourtContactLink
                courtName={property.court_name}
                contactUrl={(property as any).contact_url}
                className="text-[10px] font-medium text-[#1B4F8A] dark:text-blue-400"
              />
            </span>
          ) : null}
        </div>
      )}

      {/* Line 3: Station */}
      {(staticStationLabel || (property.lat && property.lng)) && (
        <div className="flex flex-row items-center w-full mt-0.5 min-w-0">
          <span className="text-[10px] font-normal border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-1 leading-none w-full max-w-max overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0 font-medium">駅:</span>
            <span className="truncate min-w-0">
               {staticStationLabel ? staticStationLabel : <AsyncStationInfo lat={property.lat} lng={property.lng} sale_unit_id={property.sale_unit_id} hideIfNoStation={true} />}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
