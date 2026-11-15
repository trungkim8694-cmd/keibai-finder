"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface Station {
  name: string;
  count: number;
}

interface LineData {
  line: string;
  count: number;
  prefectures: string[];
  stations: Station[];
}

interface Region {
  name: string;
  prefs: string[];
}

interface LineSearchFilterProps {
  lineData: LineData[];
  regions: Region[];
}

export default function LineSearchFilter({ lineData, regions }: LineSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter lines based on search query
  const filteredLines = lineData.filter(lineItem => 
    lineItem.line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Input Container */}
      <div className="mb-8 relative max-w-2xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="路線名で検索 (例: 山手線、中央線...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xs focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] text-zinc-900 dark:text-zinc-100 transition-all outline-none min-h-[44px] text-sm"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            「{searchQuery}」の検索結果: <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">{filteredLines.length}</span>路線
          </p>
        )}
      </div>

      {/* Regions Container */}
      <div className="space-y-6 sm:space-y-8">
        {filteredLines.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-3xl sm:text-4xl mb-4">🔍</p>
            <p className="font-medium text-base sm:text-lg mb-2 text-zinc-800 dark:text-zinc-200">該当する路線が見つかりませんでした</p>
            <p className="text-zinc-500 text-xs sm:text-sm">別のキーワードでお試しください。</p>
          </div>
        ) : (
          regions.map(region => {
            // Find if any pref in this region has matching lines
            const regionHasLines = region.prefs.some(pref => 
              filteredLines.some(lineItem => lineItem.prefectures.includes(pref))
            );
            
            if (!regionHasLines) return null;

            return (
              <div key={region.name} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center border-b border-zinc-100 dark:border-zinc-800 pb-3 text-[#1B4F8A] dark:text-blue-400">
                  {region.name}エリアの路線
                </h2>
                
                <div className="space-y-6 sm:space-y-8">
                  {region.prefs.map(pref => {
                    const linesInPref = filteredLines.filter(lineItem => lineItem.prefectures.includes(pref));
                    if (linesInPref.length === 0) return null;

                    return (
                      <div key={pref}>
                        <h3 className="text-sm sm:text-base font-bold mb-3 border-l-4 border-[#1B4F8A] dark:border-blue-500 pl-3 text-slate-800 dark:text-slate-200">
                          {pref}の路線
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                          {linesInPref.map(lineItem => (
                            <Link 
                              href={`/search/station/${encodeURIComponent(lineItem.line)}`} 
                              key={`${pref}-${lineItem.line}`}
                              className="min-h-[44px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-blue-50/70 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:border-blue-700 rounded-lg p-3 transition-colors group flex flex-col justify-center"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-medium text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 line-clamp-1">
                                  {lineItem.line}
                                </h4>
                                <span className="bg-white dark:bg-zinc-900 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap font-mono tabular-nums">
                                  {lineItem.count.toLocaleString()}件
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-1 font-mono tabular-nums">
                                {lineItem.stations.length} 駅登録
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
