'use client';

import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { formatDateJapan } from '@/utils/dateFormatter';
import { MapPin, Train, Clock, Scale } from 'lucide-react';
import { StructuredAiAnalysis } from '@/types';
import { ValuationSummary, RelistSummary } from '@/lib/propertyDataNormalizer';
import { AuctionHistoryBadge } from '@/components/Detail/AuctionHistoryBadge';

dayjs.extend(utc);

interface CourtValuationProps {
  formattedStartPrice: string;
  endDate?: Date | null;
  startDate?: Date | null;
  nearestStations?: any[];
  analysis?: StructuredAiAnalysis | null;
  sourceProvider?: string | null;
  valuationSummary?: ValuationSummary | null;
  relistSummary?: RelistSummary | null;
}

export function CourtValuation({  
  formattedStartPrice, 
  endDate,
  startDate,
  nearestStations,
  analysis,
  sourceProvider,
  valuationSummary,
  relistSummary
}: CourtValuationProps) {
  const isKoubai = sourceProvider === 'NTA';

  // Calculate Progress Percent for expiration
  let progressPercent = 0;
  let isExpired = false;
  let diffDays = 0;
  if (endDate) {
    const now = new Date().getTime();
    const end = dayjs.utc(endDate).valueOf();
    
    let start = startDate ? dayjs.utc(startDate).valueOf() : end - (45 * 24 * 60 * 60 * 1000); 
    
    // Sanity check
    if (start >= end || (now < start && end - now < 30 * 24 * 60 * 60 * 1000)) {
      start = end - (30 * 24 * 60 * 60 * 1000);
    }
    
    const total = end - Math.min(start, now - 1000);
    const elapsed = now - start;
    progressPercent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    
    const endDay = dayjs.utc(endDate).startOf('day');
    const nowDay = dayjs().utc().startOf('day');
    diffDays = endDay.diff(nowDay, 'day');
    
    if (diffDays <= -1) isExpired = true;
  }
  const isUrgent = diffDays <= 5 && diffDays >= 0;
  const isCritical = diffDays <= 2 && diffDays >= 0;
  
  let progressColor = 'bg-emerald-500 dark:bg-emerald-400';
  if (isExpired) progressColor = 'bg-zinc-500 dark:bg-zinc-600';
  else if (isCritical) progressColor = 'bg-red-500 dark:bg-red-500 animate-pulse';
  else if (isUrgent) progressColor = 'bg-amber-500 dark:bg-amber-400';

  const priceLabel = valuationSummary?.priceLabel || (isKoubai ? '見積価額' : '売却基準価額');
  const priceSubLabel = valuationSummary?.priceSubLabel || (isKoubai ? '国税庁公売基準額' : '裁判所評価額');

  // Format Deposit & Minimum Price
  const depositMan = valuationSummary?.depositYen 
    ? Math.round(valuationSummary.depositYen / 10000) 
    : null;
    
  const minBidMan = valuationSummary?.minimumBidPriceYen 
    ? Math.round(valuationSummary.minimumBidPriceYen / 10000) 
    : null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-none overflow-hidden mt-6">
      <div className="p-5 md:p-6">
        {/* Top Relist & Price Drop Strip: e.g. 期間入札 (5回目の出品) [372万円 値下げ] */}
        {relistSummary && relistSummary.history && relistSummary.history.length > 0 && (
          <div className="pb-3 mb-3.5 border-b border-slate-100 dark:border-zinc-800">
            <AuctionHistoryBadge
              history={relistSummary.history}
              relistSummary={relistSummary}
              variant="hero"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          {/* Price & Legal Benchmarks Section */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
              <span className={`w-1 h-3.5 rounded-xs ${isKoubai ? 'bg-red-600' : 'bg-[#1B4F8A]'}`}></span>
              <span>{priceLabel}</span>
              <span className="text-[11px] font-normal text-slate-400">（{priceSubLabel}）</span>
            </h2>

            <div className="flex flex-wrap items-baseline gap-3">
              <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                {formattedStartPrice}
              </div>

              {/* Sub-metrics Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {!isKoubai && minBidMan && minBidMan > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800 tabular-nums" title="売却基準価額から20%減額された最低入札可能価格">
                    <span className="font-medium text-slate-500 dark:text-slate-400">買受可能価額:</span>
                    <span>{minBidMan.toLocaleString('ja-JP')}万円</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">(-20%)</span>
                  </span>
                )}

                {depositMan && depositMan > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 tabular-nums" title="入札時に事前に裁判所または国税庁へ納付する保証金">
                    <span className="text-slate-500 dark:text-slate-400">{isKoubai ? '公売保証金:' : '買受申出保証額:'}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{depositMan.toLocaleString('ja-JP')}万円</span>
                  </span>
                )}

                {isKoubai && valuationSummary?.saleDivisionNo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 tabular-nums">
                    <span>区分番号:</span>
                    <span className="font-bold">{valuationSummary.saleDivisionNo}</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Stations */}
            {nearestStations && nearestStations.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                {nearestStations.slice(0, 2).map((station, idx) => {
                  const isFar = station.distanceKm > 5;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded border border-slate-200/80 dark:border-zinc-700/60 tabular-nums">
                      {isFar ? <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <Train className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 shrink-0" />}
                      <span>
                        {station.line_name && station.line_name !== 'Unknown Railway' ? `${station.line_name} / ` : ''}
                        {station.name_ja} 徒歩{station.walkTimeMin}分
                        <span className="ml-1 text-slate-400 font-normal">（直線 {station.distanceKm.toFixed(1)}km）</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bid Deadline & Schedule Section */}
          {endDate && (
            <div className="w-full md:w-80 shrink-0 bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-lg border border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>入札締切</span>
                </div>
                <div className={`text-xs font-bold tabular-nums ${isExpired ? 'text-slate-400' : (isCritical ? 'text-red-600' : (isUrgent ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'))}`}>
                  {isExpired ? '入札終了' : `あと${diffDays}日`}
                </div>
              </div>
              
              <div className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2 tabular-nums">
                {formatDateJapan(endDate)}
              </div>

              {/* Bid Start & Open Dates if available */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 space-y-0.5 border-t border-slate-200/60 dark:border-zinc-700/60 pt-2 tabular-nums">
                {startDate && (
                  <div className="flex justify-between">
                    <span>入札開始:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDateJapan(startDate)}</span>
                  </div>
                )}
                {valuationSummary?.openDate && (
                  <div className="flex justify-between">
                    <span>開札期日:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{valuationSummary.openDate}</span>
                  </div>
                )}
              </div>

              <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Executive Summary Strip */}
      {analysis && (
        <div className="bg-slate-50/90 dark:bg-zinc-800/60 border-t border-slate-200/80 dark:border-zinc-800 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Scale className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">AI法務概要:</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:text-blue-300 dark:bg-blue-950/60">
                Lv.{analysis.complexityLevel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 shrink-0">
              <span className="text-slate-400">引受権利:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {analysis.metrics.assumedRights.status === 'CLEAR' ? '特記なし' : '要原本確認'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 shrink-0">
              <span className="text-slate-400">占有:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {analysis.metrics.occupancy.value}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 shrink-0">
              <span className="text-slate-400">滞納管理費:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {analysis.metrics.arrears.formatted}
              </span>
            </div>
          </div>

          <a
            href="#ai-risk-analysis-panel"
            onClick={(e) => {
              e.preventDefault();
              const targets = document.querySelectorAll('#ai-risk-analysis-panel');
              const target = Array.from(targets).find(el => (el as HTMLElement).offsetParent !== null) || targets[0];
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-1 text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline shrink-0 text-xs self-end sm:self-auto"
          >
            <span>{isKoubai ? '公売財産詳細診断 ↓' : '3点セット詳細診断 ↓'}</span>
          </a>
        </div>
      )}
    </div>
  );
}
