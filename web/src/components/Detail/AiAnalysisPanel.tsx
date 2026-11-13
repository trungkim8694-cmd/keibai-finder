'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Building2, 
  HelpCircle, 
  ArrowDownRight, 
  Sparkles, 
  CheckCircle2, 
  Scale,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { StructuredAiAnalysis } from '@/types';

interface AiAnalysisPanelProps {
  analysis: StructuredAiAnalysis;
  saleUnitId: string;
  sourceProvider?: string | null;
  pdfUrl?: string | null;
}

export function AiAnalysisPanel({ 
  analysis, 
  saleUnitId, 
  sourceProvider,
  pdfUrl 
}: AiAnalysisPanelProps) {
  const isKoubai = sourceProvider === 'NTA';
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Trigger On-Demand AI scan
  const handleTriggerDeepScan = async () => {
    setIsScanning(true);
    setScanMessage(isKoubai ? '公売公告PDFをAI解析中...' : '3点セットPDFをAI解析中...');
    try {
      const res = await fetch(`/api/property/${saleUnitId}/ai-scan`, { method: 'POST' });
      if (res.ok) {
        setScanMessage('解析が完了しました。ページを再読込します...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setScanMessage('現在解析キューが混み合っています。しばらくしてから再度お試しください。');
        setTimeout(() => setScanMessage(null), 4000);
      }
    } catch {
      setScanMessage('解析リクエストを送信しました。バックグラウンドで処理されます。');
      setTimeout(() => setScanMessage(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  const levelBadges = {
    A: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      tag: 'Level A'
    },
    B: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-[#1B4F8A] dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      tag: 'Level B'
    },
    C: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      tag: 'Level C'
    },
    D: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      tag: 'Level D'
    }
  };

  const badge = levelBadges[analysis.complexityLevel] || levelBadges.A;

  return (
    <section id="ai-risk-analysis-panel" className="w-full bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-none mb-6">
      
      {/* 1. Header */}
      <div className="px-5 py-4 bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/40 text-[#1B4F8A] dark:text-blue-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{isKoubai ? 'AI 公売財産明細・重要事項チェック' : 'AI 3点セット・重要事項チェックシート'}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-200/70 dark:bg-zinc-700 text-slate-600 dark:text-slate-300">
                {analysis.sourceType === 'DEEP_PDF_AI' ? 'PDF全文解析済' : '公示データ構造化抽出'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isKoubai 
                ? '国税庁公売公告・物件明細等の公的情報をAIが整理・分析した客観サマリーです。' 
                : '裁判所公開の3点セット（物件明細書・現況調査報告書・評価書）を基にした要約です。'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTriggerDeepScan}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60"
            title="最新の3点セットPDFを再スキャンします"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? '解析実行中...' : 'AI深掘り再解析'}</span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="px-5 py-2.5 bg-blue-50 dark:bg-blue-950/80 border-b border-blue-100 dark:border-blue-900 text-xs text-[#1B4F8A] dark:text-blue-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* 2. Executive Summary Banner */}
      <div className="p-5 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start md:items-center gap-3.5">
            <div className={`px-3 py-2 rounded border ${badge.bg} ${badge.border} flex flex-col items-center justify-center shrink-0`}>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">調査難易度</span>
              <span className={`text-base font-bold tracking-tight ${badge.text} tabular-nums`}>
                {badge.tag}
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${badge.text}`}>
                  {analysis.levelLabel}
                </span>
                <span className="text-[11px] text-slate-400">|</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  法的・占有状況の複雑性指標
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                {analysis.summaryText}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. The 4 Pillar Metrics Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Assumed Rights */}
          <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ① 買受人の引受権利
                </span>
                <span className="text-[10px] text-slate-400">{isKoubai ? '公売公告・明細' : '物件明細書'}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {analysis.metrics.assumedRights.value}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center gap-1.5 text-[11px]">
              {analysis.metrics.assumedRights.status === 'CLEAR' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">担保権等抹消見込み</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">特約・賃借権要確認</span>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Occupancy & Eviction */}
          <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ② 占有状況・明渡し
                </span>
                <span className="text-[10px] text-slate-400">{isKoubai ? '使用状況・現況' : '現況調査報告書'}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {analysis.metrics.occupancy.value}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="line-clamp-1" title={analysis.metrics.occupancy.evictionNote}>
                {analysis.metrics.occupancy.evictionNote}
              </span>
            </div>
          </div>

          {/* Card 3: Arrears */}
          <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ③ 滞納管理費等の承継
                </span>
                <span className="text-[10px] text-slate-400">{isKoubai ? '公売特記事項' : '評価書/調査報告'}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug tabular-nums">
                {analysis.metrics.arrears.formatted}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{analysis.metrics.arrears.amountYen > 0 ? '落札者が支払義務を負います' : '追加債務負担なし'}</span>
            </div>
          </div>

          {/* Card 4: Land & Building Rights */}
          <div className="p-3.5 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ④ 権利形態・建物現況
                </span>
                <span className="text-[10px] text-slate-400">{isKoubai ? '登記簿・現況表示' : '評価書'}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {analysis.metrics.landAndBuilding.rightType}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="line-clamp-1">{analysis.metrics.landAndBuilding.buildingIssues}</span>
            </div>
          </div>

        </div>

        {/* 4. ROI Sync Banner */}
        <div className="mt-4 p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#1B4F8A] dark:text-blue-300 font-bold text-[10px]">
              ¥
            </span>
            <div className="text-slate-700 dark:text-slate-300">
              <span className="font-bold text-[#1B4F8A] dark:text-blue-300">想定初期追加費用（収支計算連動）: </span>
              <span className="tabular-nums font-semibold">
                承継滞納額 {analysis.estimatedHiddenCosts.arrearsMan}万円 ＋ 明渡し想定 {analysis.estimatedHiddenCosts.evictionCostMan}万円 ＋ 初期修繕 {analysis.estimatedHiddenCosts.repairCostMan}万円
              </span>
            </div>
          </div>
          <a
            href="#roi-calculator-section"
            onClick={(e) => {
              e.preventDefault();
              const targets = document.querySelectorAll('#roi-calculator-section');
              const target = Array.from(targets).find(el => (el as HTMLElement).offsetParent !== null) || targets[0];
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-1 text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline shrink-0 text-xs"
          >
            <span>実質利回りシミュレーターで確認</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 5. Key Points Bulletin */}
        {analysis.keyPoints && analysis.keyPoints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>公示資料からの抽出注意事項</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {analysis.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#1B4F8A] dark:text-blue-400 font-bold shrink-0">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. Agency Lead CTA for Complex cases */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              現地確認・占有者明渡し交渉・入札手続きに不安がある場合、管轄エリアの宅建業者・不動産会社をご確認いただけます。
            </p>
          </div>
          <a
            href="#property-agencies-section"
            onClick={(e) => {
              e.preventDefault();
              const targets = document.querySelectorAll('#property-agencies-section');
              const target = Array.from(targets).find(el => (el as HTMLElement).offsetParent !== null) || targets[0];
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded font-medium text-xs transition-colors shrink-0 shadow-2xs"
          >
            <span>周辺の不動産会社を見る</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* 7. Legal Disclaimer Footer (Japan Compliance) */}
      <div className="px-5 py-3 bg-slate-50/60 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
        ※ 免責事項: 本チェックシートは裁判所または国税庁が公示する公開資料（3点セット等）をAIおよびアルゴリズムにより構造化抽出した参考情報です。法的助言・鑑定評価を構成するものではなく、記載事項の完全性を保証するものではありません。入札にあたっては必ず原本資料の確認および専門家への相談を行ってください。
      </div>

    </section>
  );
}
