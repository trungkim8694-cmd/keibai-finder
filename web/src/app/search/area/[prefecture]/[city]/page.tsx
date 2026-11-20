import React from 'react';
import { prisma } from '@/lib/prisma';
import { getProperties, getAreaZeroInventoryData } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Building2 } from 'lucide-react';

export const revalidate = 3600; // Cache these pages for 1 hour

function safeDecodeURIComponent(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ prefecture: string; city: string }>;
  searchParams?: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { prefecture, city } = await params;
  const sParams = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(sParams?.page || '1', 10));
  const decodedPref = safeDecodeURIComponent(prefecture);
  const decodedCity = safeDecodeURIComponent(city);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';
  const pageSuffix = currentPage > 1 ? `?page=${currentPage}` : '';
  const canonicalUrl = `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(decodedCity)}${pageSuffix}`;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Kiểm tra số lượng ACTIVE, ARCHIVED/SOLD và ACTIVE cùng tỉnh để bảo vệ SEO indexing
  const [activeProperties, endedCount, prefActiveCount] = await Promise.all([
    prisma.property.findMany({
      where: {
        prefecture: decodedPref,
        city: { contains: decodedCity },
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
    }),
    prisma.property.count({
      where: {
        prefecture: decodedPref,
        city: { contains: decodedCity },
        status: { in: ['SOLD', 'ARCHIVED'] },
      },
    }),
    prisma.property.count({
      where: {
        prefecture: decodedPref,
        status: 'ACTIVE',
        OR: [
          { bid_end_date: { gte: now } },
          { bid_end_date: null }
        ],
      },
    }),
  ]);

  const count = activeProperties.length;
  const minPriceNum = activeProperties[0]?.starting_price ? Number(activeProperties[0].starting_price) : 0;
  const minPriceMan = minPriceNum > 0 ? Math.round(minPriceNum / 10000) : 0;

  // Thin Content Guard: Chỉ noindex khi khu vực hoàn toàn KHÔNG có lịch sử giao dịch và tỉnh lân cận cũng không có
  if (count === 0) {
    const hasHistoryOrRegional = endedCount > 0 || prefActiveCount > 0;
    if (!hasHistoryOrRegional) {
      return {
        title: `${decodedPref}${decodedCity}の競売物件・公売物件一覧`,
        description: `${decodedPref}${decodedCity}の不動産競売・公売情報。現在募集中の物件状況を随時更新中。`,
        robots: {
          index: false,
          follow: true,
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    // Có lịch sử đấu giá hoặc có bất động sản cùng tỉnh: GIỮ NGUYÊN INDEX ĐỂ BẢO VỆ TOP 1 GOOGLE RANKINGS
    const title = `【${currentYear}年最新】${decodedPref}${decodedCity}の競売物件・公売物件一覧（次回入札待ち・過去落札相場公開中）`;
    const description = `${decodedPref}${decodedCity}の不動産競売・公売情報。現在新しい入札公示を待機中です。過去の落札価格実績（${endedCount}件）や${decodedPref}内の近隣注目物件、実勢取引相場データを無料公開中。`;

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
        images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: `${decodedPref}${decodedCity}の競売物件` }],
      },
      twitter: {
        card: 'summary_large_image',
        images: ['/keibaikoubai.webp'],
      },
    };
  }

  // Dynamic CTR-Magnet Title (khi có ACTIVE properties)
  const priceSnippet = minPriceMan > 0 ? `・最安${minPriceMan.toLocaleString('ja-JP')}万円〜` : '';
  const pageSnippet = currentPage > 1 ? `（${currentPage}ページ目）` : '';
  const title = `【${currentYear}年最新｜${count}件${priceSnippet}】${decodedPref}${decodedCity}の競売物件・公売物件一覧${pageSnippet}`;
  const description = `${decodedPref}${decodedCity}の不動産競売・公売情報を${count}件掲載中。相場より割安な戸建て・マンション・土地の入札価格、AI査定、過去の落札相場をリアルタイム公開。`;

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
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: `${decodedPref}${decodedCity}の競売物件` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
  };
}

export default async function AreaSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ prefecture: string; city: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { prefecture, city } = await params;
  const sParams = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(sParams?.page || '1', 10));
  const decodedPref = safeDecodeURIComponent(prefecture);
  const decodedCity = safeDecodeURIComponent(city);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';
  const pageSize = 50;

  // Fetch properties and total count for crawlable pagination + facts for unique SEO value
  const now = new Date();
  const [response, totalCount, cityStats, recentResults, neighborCities] = await Promise.all([
    getProperties({
      prefecture: decodedPref,
      keyword: decodedCity,
      limit: pageSize,
      page: currentPage,
    }),
    prisma.property.count({
      where: {
        prefecture: decodedPref,
        city: { contains: decodedCity },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [{ bid_end_date: { gte: now } }, { bid_end_date: null }],
      },
    }),
    prisma.property.groupBy({
      by: ['property_type'],
      where: {
        prefecture: decodedPref,
        city: { contains: decodedCity },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [{ bid_end_date: { gte: now } }, { bid_end_date: null }],
      },
      _count: { _all: true },
    }),
    prisma.auctionResult.findMany({
      where: {
        prefecture: decodedPref,
        address: { contains: decodedCity },
      },
      orderBy: { completionDate: 'desc' },
      take: 5,
      select: {
        caseNumber: true,
        address: true,
        basePrice: true,
        winningPrice: true,
        bidderCount: true,
        completionDate: true,
      },
    }),
    prisma.property.groupBy({
      by: ['city'],
      where: {
        prefecture: decodedPref,
        city: { not: null, notIn: [decodedCity, ''] },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [{ bid_end_date: { gte: now } }, { bid_end_date: null }],
      },
      _count: { _all: true },
      take: 12,
    }),
  ]);

  const properties = Array.isArray(response) ? response : [];
  const totalPages = Math.ceil(totalCount / pageSize);

  // Compute lowest starting price for display
  const minPriceNum = properties.reduce((acc, p) => {
    const pPrice = p.starting_price ? Number(p.starting_price) : 0;
    if (pPrice <= 0) return acc;
    return acc === 0 ? pPrice : Math.min(acc, pPrice);
  }, 0);
  const minPriceMan = minPriceNum > 0 ? Math.round(minPriceNum / 10000) : 0;

  // If 0 active properties, fetch zero-inventory fallback data (recent ended + nearby active in prefecture)
  let zeroData = { endedProperties: [] as any[], nearbyActiveProperties: [] as any[] };
  if (properties.length === 0) {
    zeroData = await getAreaZeroInventoryData({
      prefecture: decodedPref,
      city: decodedCity,
    });
  }

  // Schema.org ItemList + BreadcrumbList
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
        'name': `${decodedPref}`,
        'item': `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': `${decodedCity}`,
        'item': `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(decodedCity)}`,
      },
    ],
  };

  const jsonLdItemList = properties.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${decodedPref}${decodedCity}の競売物件・公売物件一覧`,
    'numberOfItems': properties.length,
    'itemListElement': properties.slice(0, 10).map((prop: any, idx: number) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'url': `${baseUrl}/property/${prop.sale_unit_id}`,
      'name': prop.address || `${decodedPref}${decodedCity}の競売物件`,
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
          <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> ホームへ戻る
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white">
            📍 {decodedPref} {decodedCity}の競売物件・公売物件
          </h1>
          <p className="text-sm text-zinc-500 mt-1">該当物件: {totalCount} 件{totalPages > 1 ? `（${currentPage}/${totalPages}ページ）` : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {properties.length === 0 ? (
          <div className="space-y-8">
            {/* Status notice */}
            <div className="p-6 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
                    現在、{decodedPref} {decodedCity}で入札受付中の物件はありません（次回入札待ち・公示待機中）
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/80 mt-1.5 leading-relaxed">
                    裁判所および行政機関（税務署等）による新しい入札公示があり次第、本ページに自動反映されます。過去に落札・終了した相場データや、{decodedPref}内の近隣注目物件をご確認ください。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link
                      href={`/trade-find?pref=${encodeURIComponent(decodedPref)}&city=${encodeURIComponent(decodedCity)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors shadow-sm"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      国土交通省の実勢取引相場を見る
                    </Link>
                    <Link
                      href={`/search/area/${encodeURIComponent(decodedPref)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <Building2 className="w-3.5 h-3.5 text-rose-600" />
                      {decodedPref}の全物件一覧を見る
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Past Ended / Sold Properties in this City */}
            {zeroData.endedProperties.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>{decodedPref}{decodedCity}の過去の競売・公売実績（落札・終了データ）</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    過去に公示された参考物件です。売却基準価額や地域相場感の分析にご活用いただけます。
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {zeroData.endedProperties.map((property: any) => (
                    <PropertyCard key={property.sale_unit_id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {/* Section: Active properties in the same prefecture */}
            {zeroData.nearbyActiveProperties.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>📍</span>
                    <span>{decodedPref}内の現在入札可能な注目物件（近隣エリア）</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {decodedPref}で現在入札受付中の最新物件情報です。
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {zeroData.nearbyActiveProperties.map((property: any) => (
                    <PropertyCard key={property.sale_unit_id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {zeroData.endedProperties.length === 0 && zeroData.nearbyActiveProperties.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-4xl mb-4">🏠</p>
                <p className="font-medium text-lg mb-2">現在、このエリアに募集中の物件はありません</p>
                <p className="text-zinc-500 text-sm">別の市区町村で検索するか、後日再度ご確認ください。</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property: any) => (
                <PropertyCard key={property.sale_unit_id} property={property} />
              ))}
            </div>

            {/* Crawlable Static Pagination for Googlebot & Users */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const href = `/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(decodedCity)}${p === 1 ? '' : `?page=${p}`}`;
                  const isCurrent = p === currentPage;
                  return (
                    <Link
                      key={p}
                      href={href}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                        isCurrent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* City Quantitative Market Fact Table */}
        <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>{decodedPref}{decodedCity}の競売・公売市場サマリー（{now.getFullYear()}年最新）</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">現在募集物件</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{totalCount} 件</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">最安売却基準価額</span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {minPriceMan > 0 ? `${minPriceMan.toLocaleString('ja-JP')}万円〜` : '公示確認中'}
              </span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">戸建て募集</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {cityStats.find((s: any) => s.property_type === '戸建て')?._count._all || 0} 件
              </span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">マンション募集</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {cityStats.find((s: any) => s.property_type === 'マンション')?._count._all || 0} 件
              </span>
            </div>
          </div>

          {/* Past Auction Results in this City */}
          {recentResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                🏛️ {decodedPref}{decodedCity}における直近の落札実績データ
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400">
                      <th className="py-2 px-3">事件番号</th>
                      <th className="py-2 px-3">所在地</th>
                      <th className="py-2 px-3 text-right">基準価額</th>
                      <th className="py-2 px-3 text-right">落札価額</th>
                      <th className="py-2 px-3 text-right">入札数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentResults.map((res: any, idx: number) => {
                      const baseMan = res.basePrice ? Math.round(Number(res.basePrice) / 10000) : 0;
                      const winMan = res.winningPrice ? Math.round(Number(res.winningPrice) / 10000) : 0;
                      return (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 font-mono text-zinc-700 dark:text-zinc-300">{res.caseNumber}</td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">{res.address || `${decodedPref}${decodedCity}`}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-zinc-500">{baseMan > 0 ? `${baseMan.toLocaleString()}万円` : '-'}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">{winMan > 0 ? `${winMan.toLocaleString()}万円` : '-'}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{res.bidderCount ? `${res.bidderCount}名` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Neighboring Cities Silo Link Mesh */}
          {neighborCities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                📍 {decodedPref}内の近隣市区町村の競売物件を探す
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {neighborCities.map((nc: any) => (
                  <Link
                    key={nc.city}
                    href={`/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(nc.city)}`}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#1B4F8A] hover:text-white transition-colors"
                  >
                    <span>{nc.city}</span>
                    <span className="ml-1 text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">({nc._count._all})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
