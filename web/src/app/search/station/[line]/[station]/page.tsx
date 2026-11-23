import React from 'react';
import { prisma } from '@/lib/prisma';
import { getProperties, getStationZeroInventoryData } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Train, Building2 } from 'lucide-react';

export const revalidate = 3600; // Cache these pages for 1 hour

function safeDecodeURIComponent(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ line: string, station: string }> }): Promise<Metadata> {
  const { line, station } = await params;
  const decodedLine = safeDecodeURIComponent(line);
  const decodedStation = safeDecodeURIComponent(station);
  const baseUrl = 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/search/station/${encodeURIComponent(decodedLine)}/${encodeURIComponent(decodedStation)}`;

  const now = new Date();
  const currentYear = now.getFullYear();

  const [properties, historyCount, lineActiveCount] = await Promise.all([
    prisma.property.findMany({
      where: {
        line_name: { contains: decodedLine },
        nearest_station: { contains: decodedStation },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [
          { bid_end_date: { gte: now } },
          { bid_end_date: null }
        ],
      },
      select: {
        starting_price: true,
      },
      orderBy: {
        starting_price: { sort: 'asc', nulls: 'last' },
      },
      take: 50,
    }),
    prisma.property.count({
      where: {
        line_name: { contains: decodedLine },
        nearest_station: { contains: decodedStation },
      },
    }),
    prisma.property.count({
      where: {
        line_name: { contains: decodedLine },
        status: 'ACTIVE',
        OR: [
          { bid_end_date: { gte: now } },
          { bid_end_date: null }
        ],
      },
    }),
  ]);

  const count = properties.length;
  const minPriceNum = properties[0]?.starting_price ? Number(properties[0].starting_price) : 0;
  const minPriceMan = minPriceNum > 0 ? Math.round(minPriceNum / 10000) : 0;

  // Thin Content Guard
  if (count === 0) {
    const hasHistoryOrLine = historyCount > 0 || lineActiveCount > 0;
    if (!hasHistoryOrLine) {
      return {
        title: `${decodedLine}・${decodedStation}駅周辺の競売物件・公売物件一覧`,
        description: `${decodedLine}沿線・${decodedStation}駅周辺の不動産競売・公売情報。駅徒歩圏内の物件状況を随時更新中。`,
        robots: {
          index: false,
          follow: true,
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    const title = `【${currentYear}年最新】${decodedLine}・${decodedStation}駅周辺の競売物件・公売物件一覧（次回入札待ち・過去相場公開）`;
    const description = `${decodedLine}沿線・${decodedStation}駅周辺の不動産競売・公売情報。現在新しい入札公示を待機中です。過去の落札価格実績や${decodedLine}沿線の近隣注目物件を無料公開中。`;
    return {
      title,
      description,
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title}｜Keibai Finder`,
        description,
        url: canonicalUrl,
        siteName: 'Keibai Finder',
        locale: 'ja_JP',
        type: 'website',
        images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: `${decodedLine}・${decodedStation}駅周辺の競売物件` }],
      },
      twitter: {
        card: 'summary_large_image',
        images: ['/keibaikoubai.webp'],
      },
    };
  }

  // Dynamic CTR-Magnet Title
  const priceSnippet = minPriceMan > 0 ? `・最安${minPriceMan.toLocaleString('ja-JP')}万円〜` : '';
  const title = `【${currentYear}年最新｜${count}件${priceSnippet}】${decodedLine}・${decodedStation}駅近くの競売物件・公売物件一覧`;
  const description = `${decodedLine}沿線の${decodedStation}駅周辺にある不動産競売・公売情報を${count}件掲載。駅徒歩圏内の戸建てやマンションなど、相場より安い割安物件が見つかります。`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title}｜Keibai Finder`,
      description,
      url: canonicalUrl,
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: `${decodedLine}・${decodedStation}駅周辺の競売物件` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
  };
}

export default async function StationSearchPage({ params }: { params: Promise<{ line: string, station: string }> }) {
  const { line, station } = await params;
  const decodedLine = safeDecodeURIComponent(line);
  const decodedStation = safeDecodeURIComponent(station);
  const baseUrl = 'https://www.keibai-koubai.com';

  // Fetch properties filtered by line and station + neighbor stations along the same line
  const now = new Date();
  const [properties, lineStations] = await Promise.all([
    getProperties({
      lineName: decodedLine,
      stationName: decodedStation,
      limit: 50
    }),
    prisma.property.groupBy({
      by: ['nearest_station'],
      where: {
        line_name: { contains: decodedLine },
        nearest_station: { not: null, notIn: [decodedStation, ''] },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [{ bid_end_date: { gte: now } }, { bid_end_date: null }],
      },
      _count: { _all: true },
      orderBy: { _count: { nearest_station: 'desc' } },
      take: 12,
    }),
  ]);

  let zeroData = { endedProperties: [] as any[], lineActiveProperties: [] as any[] };
  if (!properties || properties.length === 0) {
    zeroData = await getStationZeroInventoryData({
      lineName: decodedLine,
      stationName: decodedStation,
    });
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'ホーム',
        'item': `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': `${decodedLine}`,
        'item': `${baseUrl}/search/station/${encodeURIComponent(decodedLine)}`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': `${decodedStation}駅`,
        'item': `${baseUrl}/search/station/${encodeURIComponent(decodedLine)}/${encodeURIComponent(decodedStation)}`,
      },
    ],
  };

  const jsonLdItemList = properties && properties.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${decodedLine} ${decodedStation}駅周辺の競売物件`,
    'numberOfItems': properties.length,
    'itemListElement': properties.slice(0, 10).map((prop: any, idx: number) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'url': `${baseUrl}/property/${prop.sale_unit_id}`,
      'name': prop.address || `${decodedStation}駅周辺の競売物件`,
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb).replace(/</g, '\\u003c') }}
      />
      {jsonLdItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList).replace(/</g, '\\u003c') }}
        />
      )}
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
        {!properties || properties.length === 0 ? (
          <div className="space-y-8">
            {/* Status notice */}
            <div className="p-6 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚉</span>
                <div>
                  <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    現在、{decodedLine} {decodedStation}駅周辺で入札受付中の物件はありません（次回公示待ち）
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/80 mt-1.5 leading-relaxed">
                    新しい入札公示があり次第、本ページに自動反映されます。過去に終了した落札相場データや、{decodedLine}沿線の近隣注目物件をご確認ください。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      href={`/search/station/${encodeURIComponent(decodedLine)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {decodedLine}の全駅一覧を見る
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Past Ended / Sold Properties for this Station */}
            {zeroData.endedProperties.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>{decodedStation}駅周辺の過去の競売・公売実績（落札・終了データ）</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    過去に公示された参考物件です。売却基準価額や駅近相場感の分析にご活用いただけます。
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {zeroData.endedProperties.map((property: any) => (
                    <PropertyCard key={property.sale_unit_id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {/* Section: Active properties along the same train line */}
            {zeroData.lineActiveProperties.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>📍</span>
                    <span>{decodedLine}沿線の現在入札可能な注目物件</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    同路線沿線で現在入札受付中の最新物件情報です。
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {zeroData.lineActiveProperties.map((property: any) => (
                    <PropertyCard key={property.sale_unit_id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {zeroData.endedProperties.length === 0 && zeroData.lineActiveProperties.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl mb-4">🚉</p>
                <p className="font-medium text-lg mb-2">現在、この駅周辺に募集中の物件はありません</p>
                <p className="text-zinc-500 text-sm">別の沿線・駅で検索するか、後日再度ご確認ください。</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.sale_unit_id} property={property as any} />
              ))}
            </div>

            {lineStations.length > 0 && (
              <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                  <Train className="w-4 h-4 text-indigo-600" />
                  <span>{decodedLine}沿線の他の駅周辺の競売物件を探す</span>
                </h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {lineStations.map((ls: any) => (
                    <Link
                      key={ls.nearest_station}
                      href={`/search/station/${encodeURIComponent(decodedLine)}/${encodeURIComponent(ls.nearest_station)}`}
                      className="inline-flex items-center text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#1B4F8A] hover:text-white transition-colors"
                    >
                      <span>{ls.nearest_station}駅</span>
                      <span className="ml-1 text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">({ls._count._all})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
