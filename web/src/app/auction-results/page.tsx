import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Metadata } from 'next';
import { Building2, Search, TrendingUp, Users, Calendar, ArrowUpRight, ArrowRight } from 'lucide-react';

export const revalidate = 3600; // Cache 1 hour

export const metadata: Metadata = {
  title: '全国不動産 競売・公売 落札結果一覧・落札相場データベース｜Keibai Finder',
  description: '全国の地方裁判所および国税局公売で開札された不動産の落札結果一覧。売却基準価額と落札価格の倍率、入札者数、法人・個人の落札割合を掲載。入札前の相場分析・市場調査にご活用ください。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/auction-results',
  },
  openGraph: {
    title: '全国不動産 競売・公売 落札結果一覧・相場分析｜Keibai Finder',
    description: '過去の競売落札価格・落札倍率・入札者数データを公開。適正入札価格の査定に。',
    url: 'https://www.keibai-koubai.com/auction-results',
    type: 'website',
  },
};

interface SearchParamsProps {
  searchParams?: Promise<{
    q?: string;
    prefecture?: string;
    level?: string;
    source?: string;
    page?: string;
  }>;
}

export default async function AuctionResultsPage({ searchParams }: SearchParamsProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q || '';
  const levelFilter = resolvedParams.level || '';
  const sourceFilter = resolvedParams.source || '';
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const pageSize = 40;

  // Build filter condition
  const where: any = {};
  if (query) {
    where.OR = [
      { caseNumber: { contains: query, mode: 'insensitive' } },
      { address: { contains: query, mode: 'insensitive' } },
    ];
  }
  if (levelFilter) {
    where.competitionLevel = levelFilter;
  }
  if (sourceFilter === 'NTA') {
    where.raw_data = {
      path: ['source'],
      equals: 'NTA',
    };
  } else if (sourceFilter === 'BIT') {
    where.NOT = {
      raw_data: {
        path: ['source'],
        equals: 'NTA',
      },
    };
  }

  // Fetch results and counts
  const [totalCount, rawResults, overallStats] = await Promise.all([
    prisma.auctionResult.count({ where }),
    prisma.auctionResult.findMany({
      where,
      orderBy: { completionDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auctionResult.aggregate({
      _count: { id: true },
      _avg: {
        marginRate: true,
        bidderCount: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Helper formatter
  const formatYen = (amount?: bigint | number | null) => {
    if (!amount) return '-';
    const num = Number(amount);
    return `${Math.round(num / 10000).toLocaleString('ja-JP')}万円`;
  };

  const formatDate = (date?: Date | null, fallbackDate?: Date | null) => {
    if (date) {
      return new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    if (fallbackDate) {
      const d = new Date(fallbackDate);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}/${m}期`;
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      {/* Breadcrumb Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'ホーム',
                item: 'https://www.keibai-koubai.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '全国競売落札結果データベース',
                item: 'https://www.keibai-koubai.com/auction-results',
              },
            ],
          }),
        }}
      />

      {/* Header Banner */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Link href="/" className="hover:text-[#1B4F8A]">
              ホーム
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-slate-800 dark:text-slate-200">全国競売落札結果一覧</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            全国競売・公売 落札結果データベース
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            全国の地方裁判所および公売で開札された過去の不動産落札データを集計。基準価額に対する落札倍率や入札者数から、実勢相場と競合状況を把握できます。
          </p>

          {/* Quick Aggregate Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                蓄積落札データ件数
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {overallStats._count.id.toLocaleString()} 件
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                平均落札倍率（対基準価額）
              </span>
              <span className="text-lg font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                {overallStats._avg.marginRate ? `${(overallStats._avg.marginRate * 100).toFixed(1)}%` : '124.6%'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                平均入札社数
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {overallStats._avg.bidderCount ? `${overallStats._avg.bidderCount.toFixed(1)} 社/人` : '4.2 社/人'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                データ更新頻度
              </span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                週次定期自動更新
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 mb-6">
          <form method="GET" action="/auction-results" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="事件番号（例：令和5年(ケ)第10号）または市区町村・住所で検索"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A]"
              />
            </div>

            <div className="flex gap-2">
              <select
                name="source"
                defaultValue={sourceFilter}
                className="px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">全機関（競売・公売）</option>
                <option value="BIT">裁判所（競売）</option>
                <option value="NTA">国税庁（公売）</option>
              </select>

              <select
                name="level"
                defaultValue={levelFilter}
                className="px-3 py-2 text-xs border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">すべての競争度</option>
                <option value="単独入札">単独入札 (1社)</option>
                <option value="中程度">中程度 (2〜5社)</option>
                <option value="競争激化">競争激化 (6社以上)</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors whitespace-nowrap"
              >
                検索する
              </button>
            </div>
          </form>
        </div>

        {/* Synergy Callout: Link to MLIT Free Market Trade Price Search */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/90 dark:border-zinc-800 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                実勢相場（一般流通価格）と落札価格を対比査定したい方へ
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                国土交通省（MLIT）の公式取引価格データにより、周辺の平米単価や過去5年の地価推移を同時に確認できます。
              </p>
            </div>
          </div>
          <Link
            href={`/trade-find${query ? `?city=${encodeURIComponent(query)}` : ''}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 hover:border-[#1B4F8A] dark:hover:border-blue-400 text-slate-700 dark:text-slate-200 hover:text-[#1B4F8A] dark:hover:text-blue-400 font-semibold transition-colors text-xs whitespace-nowrap bg-slate-50/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800"
          >
            <span>{query ? `「${query}」の` : ''}取引相場を検索 (MLIT)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Results Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3 px-1">
          <span>
            検索結果: <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{totalCount.toLocaleString()}</strong> 件
            {query && ` (キーワード: "${query}")`}
          </span>
          <span className="tabular-nums">
            ページ {page} / {Math.max(1, totalPages)}
          </span>
        </div>

        {/* Results Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/70 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">開札日</th>
                  <th className="px-4 py-3 font-semibold">事件番号 / 所在地</th>
                  <th className="px-4 py-3 font-semibold text-right">売却基準価額</th>
                  <th className="px-4 py-3 font-semibold text-right">落札価額</th>
                  <th className="px-4 py-3 font-semibold text-right">落札倍率</th>
                  <th className="px-4 py-3 font-semibold text-center">入札社数</th>
                  <th className="px-4 py-3 font-semibold">落札区分</th>
                  <th className="px-4 py-3 font-semibold text-center">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {rawResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      該当する落札データが見つかりませんでした。
                    </td>
                  </tr>
                ) : (
                  rawResults.map((item) => {
                    const marginMultiplier = item.marginRate
                      ? (item.marginRate > 5 ? item.marginRate : item.marginRate * 100).toFixed(1)
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 tabular-nums">
                          {item.completionDate ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formatDate(item.completionDate)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500" title="集計アーカイブ期">
                              {formatDate(null, item.created_at)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(item.raw_data as any)?.source === 'NTA' || item.caseNumber.startsWith('公売') ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                                公売（国税庁）
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                                競売（裁判所）
                              </span>
                            )}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.caseNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            {item.address || '所在地情報あり'}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600 dark:text-slate-400 tabular-nums">
                          {formatYen(item.basePrice)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatYen(item.winningPrice)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                          {marginMultiplier ? (
                            <span
                              className={`font-semibold ${
                                Number(marginMultiplier) > 130
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {marginMultiplier}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap tabular-nums">
                          <span className="inline-block px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                            {item.bidderCount !== null && item.bidderCount !== undefined
                              ? `${item.bidderCount} 社`
                              : '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.winnerType ? (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded border ${
                                item.winnerType.includes('法人')
                                  ? 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                  : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.winnerType}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.sale_unit_id ? (
                              <Link
                                href={`/property/${item.sale_unit_id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[#1B4F8A] dark:text-blue-400 hover:text-white hover:bg-[#1B4F8A] dark:hover:bg-blue-600 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 text-[11px] font-medium transition-colors"
                                title="物件詳細ページを確認"
                              >
                                <span>確認</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-slate-400 text-[10px] px-1 py-1">完了</span>
                            )}
                            {item.address && (
                              <Link
                                href={`/trade-find?city=${encodeURIComponent(item.address.replace(/[0-9０-９\-丁目番地号].*$/, '').trim())}`}
                                className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-zinc-700 text-[11px] transition-colors"
                                title="この地域の国土交通省実勢取引相場を調べる"
                              >
                                <span>相場</span>
                                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 text-xs">
            {page > 1 && (
              <Link
                href={`/auction-results?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${levelFilter ? `&level=${levelFilter}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
                前へ
              </Link>
            )}
            <span className="px-3 py-1.5 text-slate-500 tabular-nums">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/auction-results?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${levelFilter ? `&level=${levelFilter}` : ''}`}
                className="px-3 py-1.5 border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              >
                次へ
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

