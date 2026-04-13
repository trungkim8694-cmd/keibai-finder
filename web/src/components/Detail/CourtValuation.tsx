'use client';

import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { formatDateJapan } from '@/utils/dateFormatter';
import { MapPin, Train, Calendar, Clock } from 'lucide-react';

dayjs.extend(utc);

interface CourtValuationProps {
  formattedStartPrice: string;
  endDate?: Date | null;
  startDate?: Date | null;
  nearestStations?: any[];
}

export function CourtValuation({  
  formattedStartPrice, 
  endDate,
  startDate,
  nearestStations
}: CourtValuationProps) {
  
  // Calculate Progress Percent for expiration
  let progressPercent = 0;
  let isExpired = false;
  let diffDays = 0;
  if (endDate) {
      const now = new Date().getTime();
      const end = dayjs.utc(endDate).valueOf();
      
      const start = startDate ? dayjs.utc(startDate).valueOf() : end - (45 * 24 * 60 * 60 * 1000); // fallback ~45 days
      const total = end - start;
      const elapsed = now - start;
      progressPercent = Math.min(Math.max((elapsed / total) * 100, 0), 100);
      
      const endDay = dayjs.utc(endDate).startOf('day').valueOf();
      const nowDay = dayjs().startOf('day').valueOf();
      diffDays = Math.ceil((endDay - nowDay) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) isExpired = true;
  }
  const isUrgent = diffDays <= 5 && diffDays >= 0;
  const isCritical = diffDays <= 2 && diffDays >= 0;
  
  let progressColor = 'bg-emerald-500 dark:bg-emerald-400';
  if (isExpired) progressColor = 'bg-zinc-500 dark:bg-zinc-600';
  else if (isCritical) progressColor = 'bg-red-500 dark:bg-red-500 animate-pulse';
  else if (isUrgent) progressColor = 'bg-amber-500 dark:bg-amber-400';

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-6">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          
          {/* Price Section */}
          <div className="flex-1">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
              売却基準価額 <span className="lowercase text-xs font-medium opacity-70">（裁判所評価額）</span>
            </h2>
            <div className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formattedStartPrice}
            </div>
            
            {/* Stations */}
            {nearestStations && nearestStations.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                 {nearestStations.slice(0, 2).map((station, idx) => {
                    const isFar = station.distanceKm > 5;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                        {isFar ? <MapPin className="w-4 h-4 text-zinc-400" /> : <Train className="w-4 h-4 text-blue-500" />}
                        <span>
                          {station.line_name && station.line_name !== 'Unknown Railway' ? `${station.line_name} / ` : ''}
                          {station.name_ja} 徒歩{station.walkTimeMin}分
                          <span className="ml-1 opacity-60 font-medium">({station.distanceKm.toFixed(1)} km)</span>
                        </span>
                      </div>
                    );
                 })}
              </div>
            )}
          </div>

          {/* Bid Deadline Section */}
          {endDate && (
             <div className="md:w-72 shrink-0 bg-zinc-50/50 dark:bg-zinc-800/30 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      入札締切
                   </div>
                   <div className={`text-sm font-black ${isExpired ? 'text-zinc-500' : (isCritical ? 'text-red-500' : (isUrgent ? 'text-amber-500' : 'text-emerald-500'))}`}>
                     {isExpired ? '入札終了' : `あと${diffDays}日`}
                   </div>
                </div>
                
                <div className="text-xl font-black text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                   {formatDateJapan(endDate)}
                </div>

                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                   <div className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} style={{ width: `${progressPercent}%` }} />
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
