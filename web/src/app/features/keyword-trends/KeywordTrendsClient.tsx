'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  TrendingUp, 
  Flame, 
  ArrowUpRight, 
  HelpCircle, 
  CheckCircle2, 
  Bot, 
  FileText, 
  ExternalLink,
  X,
  Filter,
  BarChart2,
  Layers,
  ShieldAlert,
  Gavel
} from 'lucide-react';
import { KeibaiTrendKeyword, TrendCategory, TrendLevel, TrendSummaryStats } from '@/lib/keibaiTrendEngine';

interface Props {
  initialKeywords: KeibaiTrendKeyword[];
  stats: TrendSummaryStats;
}

const CATEGORIES: { key: TrendCategory | 'ALL'; label: string; icon: any }[] = [
  { key: 'ALL', label: 'すべて', icon: Layers },
  { key: 'AREA_DEAL', label: '地域・エリア別', icon: TrendingUp },
  { key: 'HIGH_YIELD_TYPE', label: '物件種別・高利回り', icon: BarChart2 },
  { key: 'RISK_AND_LEGAL', label: '3点セット・法務リスク', icon: ShieldAlert },
  { key: 'BIDDING_PROCEDURE', label: '入札手続き・攻略', icon: Gavel },
  { key: 'KOUBAI_TAX', label: '国税庁・公売', icon: FileText },
];

export default function KeywordTrendsClient({ initialKeywords, stats }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<TrendLevel | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'growth' | 'volume' | 'difficulty'>('growth');
  const [activeModalKeyword, setActiveModalKeyword] = useState<KeibaiTrendKeyword | null>(null);

  // Lọc dữ liệu thời gian thực
  const filteredKeywords = useMemo(() => {
    let result = [...initialKeywords];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(k => 
        k.keyword.toLowerCase().includes(q) ||
        k.targetAudience.toLowerCase().includes(q) ||
        (k.prefecture && k.prefecture.includes(searchTerm.trim())) ||
        k.keyQuestions.some(item => item.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter(k => k.category === selectedCategory);
    }

    if (selectedLevel !== 'ALL') {
      result = result.filter(k => k.trendLevel === selectedLevel);
    }

    result.sort((a, b) => {
      if (sortBy === 'volume') return b.monthlySearchVolume - a.monthlySearchVolume;
      if (sortBy === 'difficulty') return a.difficulty - b.difficulty;
      return b.growthMoM - a.growthMoM;
    });

    return result;
  }, [initialKeywords, searchTerm, selectedCategory, selectedLevel, sortBy]);

  const getTrendBadge = (level: TrendLevel, growth: number) => {
    if (level === 'BREAKING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 tabular-nums">
          <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>急上昇 +{growth}%</span>
        </span>
      );
    }
    if (level === 'HOT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 tabular-nums">
          <TrendingUp className="w-3 h-3 text-amber-600" />
          <span>注目 +{growth}%</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
        <span>安定 +{growth}%</span>
      </span>
    );
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'TRANSACTIONAL':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-sky-300 border border-blue-200/60">入札・購入意図</span>;
      case 'COMMERCIAL':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60">投資・検討意図</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">情報・学習意図</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="b2b-card bg-white dark:bg-[#151B22] p-4 rounded-lg border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">月間検索総需要</div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.totalMonthlyVolume.toLocaleString('ja-JP')} <span className="text-xs font-normal text-slate-500">回/月</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            業界平均比 +{stats.avgGrowthRate}% 成長中
          </div>
        </div>

        <div className="b2b-card bg-white dark:bg-[#151B22] p-4 rounded-lg border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">急上昇キーワード</div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-rose-500" />
            {stats.breakingKeywordsCount} <span className="text-xs font-normal text-slate-500">語</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            前月比 +40%以上の需要急増
          </div>
        </div>

        <div className="b2b-card bg-white dark:bg-[#151B22] p-4 rounded-lg border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">追跡キーワード総数</div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.totalTrackedKeywords} <span className="text-xs font-normal text-slate-500">語</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            全国47都道府県・5主要領域
          </div>
        </div>

        <div className="b2b-card bg-white dark:bg-[#151B22] p-4 rounded-lg border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">最大急伸カテゴリー</div>
          <div className="text-sm font-bold text-[#1B4F8A] dark:text-sky-300 truncate mt-1">
            {stats.topGrowthCategory}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            AI Agent 自動連携対象
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Filter Toolbar */}
      <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-4 space-y-3 shadow-2xs">
        
        {/* Search Input & Sort Options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="キーワード・地域・質問内容で検索（例: ボロ戸建て, 3点セット, 埼玉）"
              className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="検索条件をクリア"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">並び替え:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-initial h-9 px-3 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="growth">急上昇順（成長率）</option>
              <option value="volume">月間検索数（多い順）</option>
              <option value="difficulty">競合難易度（低い順）</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e: any) => setSelectedLevel(e.target.value)}
              className="flex-1 sm:flex-initial h-9 px-3 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">全ステータス</option>
              <option value="BREAKING">急上昇のみ</option>
              <option value="HOT">注目のみ</option>
              <option value="STABLE">安定需要のみ</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-[#1B4F8A] text-white'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. High-Density Trends Table */}
      <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg overflow-hidden shadow-2xs">
        
        {/* Table Header Count */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              検索需要トレンド一覧
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
              {filteredKeywords.length} 件
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>💡 各行の「AI構成案」からAgent向けプロンプトを確認可能</span>
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/75 dark:bg-[#0D1117]/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">キーワード / 主な検索意図</th>
                <th className="py-2.5 px-3 font-semibold w-36">カテゴリー</th>
                <th className="py-2.5 px-3 font-semibold w-32 text-right">月間検索数</th>
                <th className="py-2.5 px-3 font-semibold w-32">成長トレンド</th>
                <th className="py-2.5 px-3 font-semibold w-28 text-center">関連競売物件</th>
                <th className="py-2.5 px-3.5 font-semibold text-right w-44">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredKeywords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.keyword}
                      </span>
                      {getIntentBadge(item.intent)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md line-clamp-1">
                      ターゲット: {item.targetAudience}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.categoryLabel}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 text-sm">
                      {item.monthlySearchVolume.toLocaleString('ja-JP')}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">回/月</div>
                  </td>

                  <td className="py-3 px-3">
                    {getTrendBadge(item.trendLevel, item.growthMoM)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {typeof item.matchingAssetCount === 'number' && item.matchingAssetCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[#1B4F8A] dark:text-sky-400 text-xs tabular-nums">
                        {item.matchingAssetCount} 件
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">掲載中</span>
                    )}
                  </td>

                  <td className="py-3 px-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalKeyword(item)}
                      className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-sky-400" />
                      <span>AI構成案</span>
                    </button>

                    <Link
                      href={item.targetUrl}
                      className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded text-xs font-semibold bg-[#1B4F8A] hover:bg-[#143D6C] text-white transition-colors"
                    >
                      <span>物件確認</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
          {filteredKeywords.map((item) => (
            <div key={item.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {item.keyword}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getIntentBadge(item.intent)}
                    <span className="text-[11px] text-slate-400">{item.categoryLabel}</span>
                  </div>
                </div>
                {getTrendBadge(item.trendLevel, item.growthMoM)}
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <div className="text-slate-500">
                  月間検索数: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{item.monthlySearchVolume.toLocaleString()}回</strong>
                </div>
                {typeof item.matchingAssetCount === 'number' && item.matchingAssetCount > 0 && (
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                    対象案件: {item.matchingAssetCount}件
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModalKeyword(item)}
                  className="flex-1 inline-flex items-center justify-center gap-1 min-h-[40px] px-3 py-2 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1B4F8A]" />
                  <span>AI構成案</span>
                </button>
                <Link
                  href={item.targetUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1 min-h-[40px] px-3 py-2 rounded text-xs font-semibold bg-[#1B4F8A] text-white"
                >
                  <span>物件を見る</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AI Agent Topic Modal */}
      {activeModalKeyword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 mb-1.5">
                  <Bot className="w-3 h-3" /> AI Agent SEO 連携インサイト
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {activeModalKeyword.keyword}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalKeyword(null)}
                className="min-w-[40px] min-h-[40px] rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="モーダルを閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">月間検索数</span>
                <span className="font-bold text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeModalKeyword.monthlySearchVolume.toLocaleString()} 回
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">月間伸長率</span>
                <span className="font-bold text-sm font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  +{activeModalKeyword.growthMoM}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">推定CPC相場</span>
                <span className="font-bold text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  約 {activeModalKeyword.cpcYen} 円
                </span>
              </div>
            </div>

            {/* Key Questions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400" />
                ユーザーが最も知りたがっている3つの疑問（検索意図）
              </h4>
              <ul className="space-y-1.5">
                {activeModalKeyword.keyQuestions.map((q, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-[#1B4F8A] font-mono shrink-0">Q{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Agent System Prompt - Anti-AI styling */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400" />
                AI Content Writer Agent への推奨指示（System Prompt）
              </h4>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 font-mono text-xs leading-relaxed border border-slate-200 dark:border-slate-800 select-all">
                {activeModalKeyword.agentPrompt}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <Link
                href={`/blogs?q=${encodeURIComponent(activeModalKeyword.keyword)}`}
                className="text-xs text-slate-500 hover:text-[#1B4F8A] dark:hover:text-sky-400 underline text-center sm:text-left py-1"
              >
                関連コラム一覧を見る
              </Link>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalKeyword(null)}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-center"
                >
                  閉じる
                </button>
                <Link
                  href={activeModalKeyword.targetUrl}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-md bg-[#1B4F8A] hover:bg-[#143D6C] text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>該当物件を即時検索</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
