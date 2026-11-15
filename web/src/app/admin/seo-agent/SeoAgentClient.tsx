'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { KeibaiTrendKeyword, TrendSummaryStats } from '@/lib/keibaiTrendEngine';

interface Props {
  topics: KeibaiTrendKeyword[];
  stats: TrendSummaryStats;
  recentArticles: Array<{
    id: string;
    slug: string;
    title_ja: string;
    category: string;
    publishDate: string;
    tags: string[];
    characterCount: number;
  }>;
}

export default function SeoAgentClient({
  topics,
  stats,
  recentArticles: initialArticles,
}: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (topicId?: string) => {
    setIsGenerating(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await fetch('/api/cron/generate-seo-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywordId: topicId || selectedTopicId || undefined,
          dryRun: isDryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '記事の自動生成に失敗しました');
      }

      setLastResult(data.result);

      if (!isDryRun && data.result?.article) {
        const newArt = {
          id: data.result.article.id || `art-${Date.now()}`,
          slug: data.result.article.slug,
          title_ja: data.result.article.title,
          category: data.result.article.category,
          publishDate: data.result.article.publishedAt,
          tags: data.result.article.tags || [],
          characterCount: data.result.article.characterCount || 0,
        };
        setArticles((prev) => [newArt, ...prev]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsGenerating(false);
      setSelectedTopicId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Control Panel */}
      <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <CpuChipIcon className="w-3.5 h-3.5" />
                <span>自律型 SEO Agent エンジン</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>定期クロン待機中 (週次/月次)</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI 記事自動生成・SEO Agent 管理
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Google/Yahoo!検索の急上昇キーワードを自動選定し、公的取引データ・3点セットの留意事項・内部リンクを網羅した2,500文字以上のB2B実務ガイドを自動生成します。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <label className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A]"
              />
              <span>テスト生成 (Dry Run)</span>
            </label>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F8A] hover:bg-[#163F6F] text-white font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>AIが記事を執筆中...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  <span>今すぐAI記事を自動生成・公開</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lastResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircleIcon className="w-4 h-4 shrink-0" />
                <span>
                  {lastResult.action === 'DRY_RUN'
                    ? 'テスト生成が正常に完了しました（DB未保存）'
                    : '新しいAI記事を生成し、正常に公開しました'}
                </span>
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                所要時間: {lastResult.durationMs}ms ({lastResult.seoIntelligence?.generationSource})
              </span>
            </div>
            <div className="bg-white dark:bg-[#151B22] p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {lastResult.article?.title}
              </p>
              <p className="text-[11px] text-slate-500 break-all">
                URL:{' '}
                <span className="font-mono text-[#1B4F8A] dark:text-blue-400">
                  {lastResult.article?.url}
                </span>{' '}
                ｜ 文字数:{' '}
                <strong className="tabular-nums">
                  {lastResult.article?.characterCount?.toLocaleString()}文字
                </strong>{' '}
                ｜ キーワード: <strong>{lastResult.seoIntelligence?.primaryKeyword}</strong>{' '}
                (月間 {lastResult.seoIntelligence?.monthlySearchVolume?.toLocaleString()}回)
              </p>
            </div>
            {lastResult.action !== 'DRY_RUN' && (
              <div className="pt-1">
                <Link
                  href={lastResult.article?.url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                >
                  <span>公開された記事をブラウザで確認する</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            公開済み記事総数
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {articles.length}{' '}
            <span className="text-xs font-normal text-slate-500">本</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            追跡中月間検索需要
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400 mt-1 tabular-nums">
            {stats.totalMonthlyVolume.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">回/月</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            急上昇トピック比率
          </p>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            +{stats.avgGrowthRate}%{' '}
            <span className="text-xs font-normal text-slate-500">平均伸長</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            自動生成エンジン状況
          </p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <CpuChipIcon className="w-4 h-4 shrink-0" />
            <span>自律合成 + LLM対応</span>
          </p>
        </div>
      </div>

      {/* 3. Recommended Topics Queue */}
      <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <span>推薦トピック キュー（未執筆・優先生成候補）</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            検索ボリュームと前月比急上昇率に基づき、SEO集客インパクトの高い順にソートされています。
          </p>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {topics.slice(0, 10).map((topic) => (
            <div
              key={topic.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {topic.keyword}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  {topic.categoryLabel}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono tabular-nums">
                <span className="text-slate-600 dark:text-slate-300">
                  月間: {topic.monthlySearchVolume.toLocaleString()}
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  +{topic.growthMoM}%
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                対象: {topic.targetAudience}
              </div>
              <button
                type="button"
                onClick={() => handleGenerate(topic.id)}
                disabled={isGenerating}
                className="w-full min-h-[40px] rounded-lg bg-[#1B4F8A]/10 hover:bg-[#1B4F8A]/20 text-[#1B4F8A] dark:bg-blue-950/50 dark:text-blue-300 font-bold text-xs transition-colors disabled:opacity-50"
              >
                このテーマで生成
              </button>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 font-semibold">主要キーワード</th>
                <th className="px-4 py-3 font-semibold">カテゴリ</th>
                <th className="px-4 py-3 font-semibold text-right">月間検索数</th>
                <th className="px-4 py-3 font-semibold text-right">急上昇率</th>
                <th className="px-4 py-3 font-semibold">ターゲット読者</th>
                <th className="px-4 py-3 font-semibold text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topics.slice(0, 10).map((topic) => (
                <tr
                  key={topic.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {topic.keyword}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {topic.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {topic.monthlySearchVolume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                    +{topic.growthMoM}%
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {topic.targetAudience}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleGenerate(topic.id)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg bg-[#1B4F8A]/10 hover:bg-[#1B4F8A]/20 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#1B4F8A] dark:text-blue-300 font-bold text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      このテーマで生成
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recently Published Articles History */}
      <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
            <span>最近公開された記事一覧 (DailyDigest DB)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            システムに登録されているブログ・市場レポートです。各記事をクリックしてライブ画面の表示を確認できます。
          </p>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {articles.map((art) => (
            <div
              key={art.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                  {art.title_ja}
                </p>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    art.category === 'CAUTION'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : art.category === 'MARKET_REPORT'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  {art.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                <span>
                  {art.characterCount ? `${art.characterCount.toLocaleString()}文字` : '-'}
                </span>
                <span>
                  {new Date(art.publishDate).toLocaleDateString('ja-JP', {
                    timeZone: 'Asia/Tokyo',
                  })}
                </span>
              </div>
              <Link
                href={
                  art.category === 'MARKET_REPORT'
                    ? `/insights/${art.slug}`
                    : `/blogs/${art.slug}`
                }
                target="_blank"
                className="min-h-[40px] w-full rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center gap-1 text-xs font-bold text-[#1B4F8A] dark:text-blue-400"
              >
                <span>記事を表示</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 font-semibold w-1/2">記事タイトル</th>
                <th className="px-4 py-3 font-semibold">区分</th>
                <th className="px-4 py-3 font-semibold">文字数</th>
                <th className="px-4 py-3 font-semibold">公開日時</th>
                <th className="px-4 py-3 font-semibold text-right">リンク</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {articles.map((art) => (
                <tr
                  key={art.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {art.title_ja}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                      {art.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        art.category === 'CAUTION'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : art.category === 'MARKET_REPORT'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {art.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    {art.characterCount
                      ? `${art.characterCount.toLocaleString()}文字`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                    {new Date(art.publishDate).toLocaleDateString('ja-JP', {
                      timeZone: 'Asia/Tokyo',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={
                        art.category === 'MARKET_REPORT'
                          ? `/insights/${art.slug}`
                          : `/blogs/${art.slug}`
                      }
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold"
                    >
                      <span>表示</span>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
