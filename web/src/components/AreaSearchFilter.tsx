"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface Region {
  name: string;
  prefs: string[];
}

interface AreaSearchFilterProps {
  areaStats: Record<string, number>;
  regions: Region[];
}

export default function AreaSearchFilter({ areaStats, regions }: AreaSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Input Container */}
      <div className="mb-8 relative max-w-2xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="都道府県名で検索 (例: 東京都、大阪府...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xs focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] text-zinc-900 dark:text-zinc-100 transition-all outline-none min-h-[44px] text-sm"
          />
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {regions.map(region => {
          // Filter prefectures based on search query
          const filteredPrefs = region.prefs.filter(pref => 
            pref.includes(searchQuery)
          );
          
          if (filteredPrefs.length === 0) return null;

          return (
            <div key={region.name} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-xs">
              <h2 className="text-base sm:text-lg font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-between">
                <span>{region.name}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {filteredPrefs.length} 都道府県
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {filteredPrefs.map(pref => {
                  const count = areaStats[pref] || 0;
                  return (
                    <Link 
                      key={pref}
                      href={`/search/area/${encodeURIComponent(pref)}`}
                      className="min-h-[44px] flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 px-3 py-2 border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-lg transition-colors group"
                    >
                      <span className="font-medium text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {pref}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 font-mono tabular-nums">
                        {count.toLocaleString()}件
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {regions.every(region => region.prefs.filter(pref => pref.includes(searchQuery)).length === 0) && (
          <div className="text-center py-16 sm:py-20 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-3xl sm:text-4xl mb-4">🔍</p>
            <p className="font-medium text-base sm:text-lg mb-2 text-zinc-800 dark:text-zinc-200">該当する都道府県が見つかりませんでした</p>
            <p className="text-zinc-500 text-xs sm:text-sm">別のキーワードでお試しください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
