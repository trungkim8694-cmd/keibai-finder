'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Flame, 
  Bot, 
  ShieldCheck, 
  AlertCircle,
  Play
} from 'lucide-react';
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

export default function SeoAgentClient({ topics, stats, recentArticles: initialArticles }: Props) {
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
          dryRun: isDryRun
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '記事の自動生成に失敗しました');
      }

      setLastResult(data.result);

      // Nếu không phải dry run, cập nhật danh sách bài viết gần đây
      if (!isDryRun && data.result?.article) {
        const newArt = {
          id: data.result.article.id || `art-${Date.now()}`,
          slug: data.result.article.slug,
          title_ja: data.result.article.title,
          category: data.result.article.category,
          publishDate: data.result.article.publishedAt,
          tags: data.result.article.tags || [],
          characterCount: data.result.article.characterCount || 0
        };
        setArticles(prev => [newArt, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || '予期せぬエラーが発生しました');
    } finally {
      setIsGenerating(false);
      setSelectedTopicId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Control Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                自律型 SEO Agent エンジン
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                定期クロン待機中 (週次/月次)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              AI 記事自動生成・SEO Agent 管理
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Google/Yahoo!検索の急上昇キーワードを自動選定し、公的取引データ・3点セットの留意事項・内部リンクを網羅した2,500文字以上のB2B実務ガイドを完全自律生成します。
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={e => setIsDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>テスト生成 (Dry Run)</span>
            </label>

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AIが記事を執筆中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>今すぐAI記事を自動生成・公開</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notification & Article summary */}
        {lastResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {lastResult.action === 'DRY_RUN' ? 'テスト生成が正常に完了しました（DB未保存）' : '新しいAI記事を生成し、正常に公開しました！'}
                </span>
              </p>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                所要時間: {lastResult.durationMs}ms ({lastResult.seoIntelligence?.generationSource})
              </span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {lastResult.article?.title}
              </p>
              <p className="text-[11px] text-zinc-500">
                URL: <span className="font-mono text-blue-600 dark:text-blue-400">{lastResult.article?.url}</span> ｜ 文字数: <strong>{lastResult.article?.characterCount?.toLocaleString()}文字</strong> ｜ キーワード: <strong>{lastResult.seoIntelligence?.primaryKeyword}</strong> (月間 {lastResult.seoIntelligence?.monthlySearchVolume?.toLocaleString()}回)
              </p>
            </div>
            {lastResult.action !== 'DRY_RUN' && (
              <div className="pt-1">
                <Link
                  href={lastResult.article?.url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>公開された記事をブラウザで確認する</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">公開済み記事総数</p>
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {articles.length} <span className="text-xs font-normal text-zinc-500">本</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">追跡中月間検索需要</p>
          <p className="text-xl sm:text-2xl font-black text-[#1B4F8A] dark:text-blue-400 mt-1 tabular-nums">
            {stats.totalMonthlyVolume.toLocaleString()} <span className="text-xs font-normal text-zinc-500">回/月</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">急上昇トピック比率</p>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            +{stats.avgGrowthRate}% <span className="text-xs font-normal text-zinc-500">平均伸長</span>
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">自動生成エンジン稼働状況</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <Bot className="w-4 h-4" />
            <span>自律合成 + LLM対応</span>
          </p>
        </div>
      </div>

      {/* 3. Recommended Topics Queue */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>AI 推薦トピック キュー（未執筆・優先生成候補）</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            検索ボリュームと前月比急上昇率に基づき、SEO集客インパクトの高い順にソートされています。「生成」ボタンで特定テーマの即時執筆が可能です。
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 font-semibold">主要キーワード</th>
                <th className="px-4 py-3 font-semibold">カテゴリ</th>
                <th className="px-4 py-3 font-semibold text-right">月間検索数</th>
                <th className="px-4 py-3 font-semibold text-right">急上昇率</th>
                <th className="px-4 py-3 font-semibold">ターゲット読者</th>
                <th className="px-4 py-3 font-semibold text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {topics.slice(0, 10).map((topic) => (
                <tr key={topic.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {topic.keyword}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {topic.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                    {topic.monthlySearchVolume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    +{topic.growthMoM}%
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                    {topic.targetAudience}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleGenerate(topic.id)}
                      disabled={isGenerating}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition-colors disabled:opacity-50"
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>最近公開された記事一覧 (DailyDigest DB)</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            システムに登録されているブログ・市場レポートです。各記事をクリックしてライブ画面の表示を確認できます。
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 font-semibold w-1/2">記事タイトル</th>
                <th className="px-4 py-3 font-semibold">区分</th>
                <th className="px-4 py-3 font-semibold">文字数</th>
                <th className="px-4 py-3 font-semibold">公開日時</th>
                <th className="px-4 py-3 font-semibold text-right">リンク</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {art.title_ja}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-md">
                      {art.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      art.category === 'CAUTION' 
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : art.category === 'MARKET_REPORT'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {art.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {art.characterCount ? `${art.characterCount.toLocaleString()}文字` : '-'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(art.publishDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={art.category === 'MARKET_REPORT' ? `/insights/${art.slug}` : `/blogs/${art.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      <span>表示</span>
                      <ExternalLink className="w-3 h-3" />
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
