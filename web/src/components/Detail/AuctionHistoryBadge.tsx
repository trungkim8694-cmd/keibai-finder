'use client';

import React, { useState } from 'react';
import { History, TrendingDown, X, Info } from 'lucide-react';
import { ExpandedHistoryItem, RelistSummary } from '@/lib/propertyDataNormalizer';

interface AuctionHistoryBadgeProps {
  history: ExpandedHistoryItem[];
  relistSummary?: RelistSummary | null;
  variant?: 'compact' | 'hero';
}

export function AuctionHistoryBadge({
  history,
  relistSummary,
  variant = 'compact'
}: AuctionHistoryBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length === 0) return null;

  const totalRounds = relistSummary?.totalRounds || history.length;
  const biddingMethod = relistSummary?.biddingMethod || history[history.length - 1]?.method || '期間入札';

  // Compute price drop if relistSummary not explicitly passed
  const currentIdx = history.findIndex(h => h.isCurrent);
  const current = history[currentIdx >= 0 ? currentIdx : history.length - 1];
  let prevPriceYen = relistSummary?.previousPriceYen ?? null;
  if (prevPriceYen === null && current) {
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i].price > current.price) {
        prevPriceYen = history[i].price;
        break;
      }
    }
  }

  const priceDropYen = relistSummary?.priceDropYen ?? (prevPriceYen && current && prevPriceYen > current.price ? prevPriceYen - current.price : 0);
  const priceDropPercent = relistSummary?.priceDropPercent ?? (prevPriceYen && prevPriceYen > 0 ? Math.round((priceDropYen / prevPriceYen) * 1000) / 10 : 0);
  const cumulativeDropYen = relistSummary?.cumulativeDropYen ?? (history[0]?.price > (current?.price || 0) ? history[0].price - (current?.price || 0) : 0);
  const cumulativeDropPercent = relistSummary?.cumulativeDropPercent ?? (history[0]?.price > 0 ? Math.round((cumulativeDropYen / history[0].price) * 1000) / 10 : 0);
  const initialPriceYen = relistSummary?.initialPriceYen ?? history[0]?.price ?? null;

  const isDrop = priceDropYen > 0;
  const dropMan = Math.round(priceDropYen / 10000);
  const cumulativeDropMan = Math.round(cumulativeDropYen / 10000);
  const initialPriceMan = initialPriceYen ? Math.round(initialPriceYen / 10000) : 0;

  // Compact variant only renders when totalRounds > 1
  if (variant === 'compact' && totalRounds <= 1) return null;

  const renderModal = () => {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60">
            <div>
              <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>過去の出品・価格推移履歴</span>
              </h3>
              {relistSummary?.caseNumberJa && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  事件番号: {relistSummary.caseNumberJa}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/70 dark:hover:bg-zinc-700 text-slate-500 transition-colors cursor-pointer"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cumulative Price Drop Summary Banner */}
          {cumulativeDropMan > 0 && initialPriceMan > 0 && (
            <div className="px-5 py-3 bg-rose-50/80 dark:bg-rose-950/30 border-b border-rose-200/70 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                <span>初回基準価額:</span>
                <span className="line-through text-slate-500 tabular-nums">{initialPriceMan.toLocaleString('ja-JP')}万円</span>
                <span>→</span>
                <span className="font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                  今回 {Math.round((current?.price || 0) / 10000).toLocaleString('ja-JP')}万円
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px] tabular-nums">
                <TrendingDown className="w-3 h-3" />
                累計 {cumulativeDropMan.toLocaleString('ja-JP')}万円 値下げ (-{cumulativeDropPercent}%)
              </span>
            </div>
          )}

          {/* History Table */}
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50/80 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">出品回数</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">売却方法</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">売却基準価額</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">結果 / 期間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {history.map((h, i) => {
                  const stepDropMan = h.dropFromPrevYen > 0 ? Math.round(h.dropFromPrevYen / 10000) : 0;
                  const priceMan = Math.round(h.price / 10000);
                  const isTokubetsu = h.method.includes('特別売却');

                  return (
                    <tr
                      key={i}
                      className={h.isCurrent ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'bg-white dark:bg-zinc-900'}
                    >
                      <td className={`px-4 py-3 whitespace-nowrap tabular-nums ${h.isCurrent ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-300 font-medium'}`}>
                        {h.round}回目 {h.isCurrent && <span className="text-[10px] ml-0.5 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">今回</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isTokubetsu
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                          {h.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        <div className="flex flex-col">
                          <span className={h.isCurrent ? 'font-bold text-slate-900 dark:text-white text-sm' : 'font-medium text-slate-500 dark:text-zinc-400 line-through'}>
                            {priceMan.toLocaleString('ja-JP')}万円
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({h.price.toLocaleString('ja-JP')}円)
                          </span>
                        </div>
                        {stepDropMan > 0 && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-1.5 py-0.2 rounded">
                            ↓ {stepDropMan.toLocaleString('ja-JP')}万円 値下げ
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs ${h.isCurrent ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {h.result}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Investor Due Diligence Footer Note */}
          {totalRounds >= 2 && (
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/70 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed border-t border-slate-200 dark:border-zinc-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                過去に不売（入札なし）となり再出品された物件です。売却基準価額が引き下げられており割安感がある一方、現地状況・接道条件・占有関係等を「3点セット」で十分にご確認ください。
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- HERO VARIANT (For CourtValuation Box - Competitor Style & Beyond) ---
  if (variant === 'hero') {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {/* 1. Bidding Method Pill (期間入札 / 特別売却) */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-zinc-700">
            {biddingMethod}
          </span>

          {/* 2. Offering Round Count: (5回目の出品) */}
          {totalRounds > 1 ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-dotted underline-offset-4 cursor-pointer transition-colors"
              title="クリックして過去の出品・価格推移履歴を表示"
            >
              <span>（{totalRounds}回目の出品）</span>
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              （初回出品）
            </span>
          )}

          {/* 3. Prominent Red Price Drop Pill: [372万円 値下げ] */}
          {isDrop && dropMan > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-400 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shadow-2xs active:scale-95 tabular-nums"
              title="前回出品時の売却基準価額からの値下げ額（クリックで履歴詳細）"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{dropMan.toLocaleString('ja-JP')}万円 値下げ</span>
              {priceDropPercent > 0 && (
                <span className="text-[10px] opacity-90">(-{priceDropPercent}%)</span>
              )}
            </button>
          )}

          {/* 4. Case Number Badge if extracted */}
          {relistSummary?.caseNumberJa && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-auto font-mono">
              事件番号: {relistSummary.caseNumberJa}
            </span>
          )}
        </div>
        {renderModal()}
      </>
    );
  }

  // --- COMPACT VARIANT (For PropertyInfoTags Header) ---
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-bold border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded shrink-0 inline-flex items-center gap-1 leading-none hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer shadow-2xs active:scale-95 tabular-nums"
        title="過去の出品履歴・値下げ推移を表示"
      >
        <span>🔄 {totalRounds}回目の出品</span>
        {isDrop && dropMan > 0 && (
          <span className="pl-1 border-l border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            {dropMan.toLocaleString('ja-JP')}万円値下げ
          </span>
        )}
      </button>
      {renderModal()}
    </>
  );
}
