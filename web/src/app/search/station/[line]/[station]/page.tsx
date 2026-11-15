import React from 'react';
import { prisma } from '@/lib/prisma';
import { getProperties } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Train } from 'lucide-react';

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/search/station/${encodeURIComponent(decodedLine)}/${encodeURIComponent(decodedStation)}`;

  const now = new Date();
  const currentYear = now.getFullYear();

  const properties = await prisma.property.findMany({
    where: {
      line_name: { contains: decodedLine },
      nearest_station: { contains: decodedStation },
      status: 'ACTIVE',
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
  });

  const count = properties.length;
  const minPriceNum = properties[0]?.starting_price ? Number(properties[0].starting_price) : 0;
  const minPriceMan = minPriceNum > 0 ? Math.round(minPriceNum / 10000) : 0;

  // Thin Content Guard
  if (count === 0) {
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';

  // Fetch properties filtered by line and station
  const properties = await getProperties({
    lineName: decodedLine,
    stationName: decodedStation,
    limit: 50
  });

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
    </>
  );
}
