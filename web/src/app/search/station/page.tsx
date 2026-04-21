import React from 'react';
import { getRailLinesAndStations } from '@/actions/propertyActions';
import Link from 'next/link';
import { Metadata } from 'next';
import { TramFront } from 'lucide-react';

export const revalidate = 86400; // Cache for 24 hours (1 day)

export const metadata: Metadata = {
  title: '路線・駅から競売物件を探す | Keibai-Koubai Finder',
  description: '全国の路線・駅から不動産競売・公売物件を検索。駅近のマンションや戸建てなど、利便性の高い物件を相場より安く見つけることができます。',
};

export default async function StationIndexPage() {
  const lineData = await getRailLinesAndStations();
  
  const totalLines = lineData.length;
  // Calculate total stations
  const totalStations = lineData.reduce((acc, curr) => acc + curr.stations.length, 0);

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <TramFront className="w-6 h-6 text-emerald-600" />
            路線・駅から探す
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            現在、<span className="font-bold text-zinc-800 dark:text-zinc-200">{totalLines}</span>の路線と
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalStations}</span>の駅周辺で物件が募集されています。
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lineData.map((lineItem) => (
            <Link 
              href={`/search/station/${encodeURIComponent(lineItem.line)}`} 
              key={lineItem.line}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <h2 className="font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {lineItem.line}
                </h2>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {lineItem.count} 物件
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-3 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                登録駅: {lineItem.stations.length} 駅
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
