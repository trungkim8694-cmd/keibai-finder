import React from 'react';
import { getProperties, getCityStats } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600; // Cache these pages for 1 hour

export async function generateMetadata({ params }: { params: { prefecture: string } }): Promise<Metadata> {
  const { prefecture } = await params;
  const decodedPref = decodeURIComponent(prefecture);
  
  return {
    title: `【2026年最新】${decodedPref}の競売物件・公売物件一覧`,
    description: `${decodedPref}の不動産競売・公売情報を一覧表示。相場より安い戸建てやマンションが見つかります。AI査定で落札価格の参考に。エリアから検索して最適な物件を見つけましょう。`,
  };
}

export default async function PrefectureSearchPage({ params }: { params: { prefecture: string } }) {
  const { prefecture } = await params;
  const decodedPref = decodeURIComponent(prefecture);

  // Fetch properties filtered by prefecture
  const [properties, cityStats] = await Promise.all([
    getProperties({
      prefecture: decodedPref,
      limit: 50
    }),
    getCityStats(decodedPref)
  ]);

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/trade/find" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> マップ検索へ戻る
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white">
            📍 {decodedPref}の競売物件・公売物件
          </h1>
          <p className="text-sm text-zinc-500 mt-1">該当物件: {properties?.length || 0} 件</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {properties.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-4xl mb-4">🏠</p>
            <p className="font-medium text-lg mb-2">現在、このエリアに募集中の物件はありません</p>
            <p className="text-zinc-500 text-sm">別の都道府県で検索するか、後日再度ご確認ください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.sale_unit_id} property={property as any} />
            ))}
          </div>
        )}

        {/* SEO Content Block */}
        <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold mb-3">{decodedPref}の競売物件・公売物件相場と特徴</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
            {decodedPref}の競売・公売市場では、戸建てやマンションから土地まで、幅広い不動産が市場価格（相場）よりも安く取引される傾向にあります。裁判所が管轄する競売（けいばい）と、行政機関が管轄する公売（こうばい）の両方の物件情報を当サイト「Keibai Finder」で一括で検索・比較することが可能です。
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            特に{decodedPref}で不動産投資を検討されている方や、マイホームを安く手に入れたい方にとって、競売物件は魅力的な選択肢となります。物件の詳細ページでは、AIによる価格査定や過去の落札履歴データを活用して、適切な入札価格の目安を確認できます。初めての方でも安心して参加できるよう、事前に専門家への相談をおすすめします。
          </p>
        </div>

        {/* City Directory Silo */}
        {cityStats.length > 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              🏘️ {decodedPref}の市区町村から探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {cityStats.map((cityData) => (
                <Link 
                  href={`/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(cityData.city)}`} 
                  key={cityData.city}
                  className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-zinc-200 hover:border-rose-300 dark:border-zinc-700 dark:hover:border-rose-700 text-sm py-2 px-4 rounded-lg transition-all flex items-center gap-2 group"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-700 dark:group-hover:text-rose-300">{cityData.city}</span>
                  <span className="text-xs bg-white dark:bg-zinc-900 text-zinc-400 group-hover:text-rose-500 px-1.5 rounded">{cityData.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
