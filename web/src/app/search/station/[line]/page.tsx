import React from 'react';
import { getRailLinesAndStations } from '@/actions/propertyActions';
import Link from 'next/link';
import { Metadata } from 'next';
import { TramFront, ArrowLeft, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 86400; // Cache for 24 hours

export async function generateMetadata({ params }: { params: { line: string } }): Promise<Metadata> {
  const { line } = await params;
  const decodedLine = decodeURIComponent(line);
  
  return {
    title: `${decodedLine}の駅から競売物件を探す | Keibai-Koubai Finder`,
    description: `${decodedLine}沿線の不動産競売・公売物件を駅ごとに検索。通勤・通学に便利な駅近物件を相場より安く見つけることができます。`,
  };
}

export default async function LineStationsPage({ params }: { params: { line: string } }) {
  const { line } = await params;
  const decodedLine = decodeURIComponent(line);
  
  const allLines = await getRailLinesAndStations();
  const lineData = allLines.find(l => l.line === decodedLine);
  
  if (!lineData) {
    notFound();
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/search/station" className="inline-flex items-center text-sm text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> 路線一覧へ戻る
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <TramFront className="w-6 h-6 text-emerald-600" />
            {decodedLine}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            対象駅: <span className="font-bold text-zinc-800 dark:text-zinc-200">{lineData.stations.length}</span> 駅・総物件数: <span className="font-bold text-zinc-800 dark:text-zinc-200">{lineData.count}</span> 件
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
             <MapPin className="w-5 h-5 text-emerald-600" />
             駅を選択してください
          </h2>
          <div className="flex flex-wrap gap-2">
            {lineData.stations.map((station) => (
              <Link 
                href={`/search/station/${encodeURIComponent(decodedLine)}/${encodeURIComponent(station.name)}`} 
                key={station.name}
                className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-zinc-200 hover:border-emerald-300 dark:border-zinc-700 dark:hover:border-emerald-700 text-sm py-2 px-4 rounded-lg transition-all flex items-center gap-2 group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{station.name}駅</span>
                <span className="text-xs bg-white dark:bg-zinc-900 text-zinc-400 group-hover:text-emerald-500 px-1.5 rounded">{station.count}件</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
