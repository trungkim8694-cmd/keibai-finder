import React from 'react';
import { getProperties } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Train } from 'lucide-react';

export const revalidate = 3600; // Cache these pages for 1 hour

export async function generateMetadata({ params }: { params: { line: string, station: string } }): Promise<Metadata> {
  const { line, station } = await params;
  const decodedLine = decodeURIComponent(line);
  const decodedStation = decodeURIComponent(station);
  
  return {
    title: `【2026年最新】${decodedLine}沿線・${decodedStation}駅近くの競売物件・公売物件`,
    description: `${decodedLine}沿線の${decodedStation}駅周辺にある不動産競売・公売情報。駅徒歩圏内の戸建てやマンションなど、相場より安い物件が見つかります。`,
  };
}

export default async function StationSearchPage({ params }: { params: { line: string, station: string } }) {
  const { line, station } = await params;
  const decodedLine = decodeURIComponent(line);
  const decodedStation = decodeURIComponent(station);

  // Fetch properties filtered by line and station
  const properties = await getProperties({
    lineName: decodedLine,
    stationName: decodedStation,
    limit: 50
  });

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/search/station/${encodeURIComponent(decodedLine)}`} className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> 路線へ戻る
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Train className="w-6 h-6 text-indigo-600" /> 
            {decodedLine} / {decodedStation}駅周辺の競売物件
          </h1>
          <p className="text-sm text-zinc-500 mt-1">該当物件: {properties?.length || 0} 件</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {properties.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-4xl mb-4">🚉</p>
            <p className="font-medium text-lg mb-2">現在、この駅周辺に募集中の物件はありません</p>
            <p className="text-zinc-500 text-sm">別の沿線・駅で検索するか、後日再度ご確認ください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.sale_unit_id} property={property as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
