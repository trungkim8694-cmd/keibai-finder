'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Coins, TrendingUp, ShieldAlert, CheckCircle, Scale, Loader2, ExternalLink } from 'lucide-react';
import { type AiAnalysisData, type AnalysisPayload } from '@/types';

type Langcode = 'ja' | 'en' | 'vi';

export function AiAnalysisPanel({ 
  data, 
  aiStatus, 
  propertyType,
  prefecture,
  city
}: { 
  data?: AiAnalysisData | any, 
  aiStatus?: string, 
  propertyType?: string,
  prefecture?: string,
  city?: string
}) {
  const [lang, setLang] = useState<Langcode>('ja');

  const searchKeyword = encodeURIComponent(`${city || prefecture || ''} ${propertyType || ''}`);
  const mlitUrl = `https://www.reinfolib.mlit.go.jp/landPrices/`;

  // Normalize inputs to prevent whitespace/encoding issues
  const normalizedStatus = (aiStatus || '').trim().toUpperCase();
  const normalizedType = (propertyType || '').trim();
  const SUPPORTED_TYPES = ['戸建て', 'マンション'];

  // Helpers for text in different languages
  const labels = {
    ja: {
      title: '🤖 AI 総合分析レポート',
      riskTitle: '発見されたリスク',
      noRisks: '特記すべきリスクなし',
      costTitle: '追加費用予測',
      arrears: '滞納管理費等',
      eviction: '立ち退き費用',
      repair: '修繕費用',
      totalCost: '追加費用合計',
      priceTitle: 'AI 落札予想価格',
      reasoning: 'AIの根拠',
      roiTitle: '投資対効果',
      yield: '利回り',
      profit: '想定利益差額',
      disclaimer: '本データは裁判所の資料を基にAIで作成・集計されたものです。正確な情報については必ず原本（3点セット等）をご確認ください。',
      pendingMsg: 'AIがPDF資料を解析中です... しばらくお待ちください。',
      skippedMsg: 'この物件は戸建て・マンションではないため、AI解析の対象外です。',
      updatingMsg: '機能アップデート中...',
    },
    en: {
      title: '🤖 AI Comprehensive Report',
      riskTitle: 'Risks Found',
      noRisks: 'No major risks detected',
      costTitle: 'Estimated Costs',
      arrears: 'Arrears',
      eviction: 'Eviction Cost',
      repair: 'Repair Estimate',
      totalCost: 'Total Added Costs',
      priceTitle: 'Winning Price Estimate',
      reasoning: 'AI Reasoning',
      roiTitle: 'Return on Investment',
      yield: 'Yield',
      profit: 'Estimated Profit',
      disclaimer: 'AI-Generated Analysis. Please verify with official documents.',
      pendingMsg: 'AI is currently analyzing the PDF documents... Please wait.',
      skippedMsg: 'This property type is not supported for AI analysis.',
      updatingMsg: 'Feature coming soon...',
    },
    vi: {
      title: '🤖 Báo Cáo Phân Tích AI',
      riskTitle: 'Rủi ro phát hiện',
      noRisks: 'Không phát hiện rủi ro lớn',
      costTitle: 'Dự toán chi phí tiềm ẩn',
      arrears: 'Nợ khoản phí',
      eviction: 'Phí cưỡng chế',
      repair: 'Phí tân trang',
      totalCost: 'Tổng chi phí thêm',
      priceTitle: 'Giá trúng thầu dự đoán',
      reasoning: 'Lý giải của AI',
      roiTitle: 'Phân tích Đầu tư',
      yield: 'Lợi suất',
      profit: 'Lãi gộp dự tính',
      disclaimer: 'Dữ liệu phân tích bằng AI. Vui lòng kiểm tra lại tài liệu gốc.',
      pendingMsg: 'AI đang phân tích tài liệu PDF... Vui lòng chờ trong giây lát.',
      skippedMsg: 'Tài sản này không thuộc phạm vi phân tích của AI.',
      updatingMsg: 'Chức năng đang được cập nhật...',
    }
  };

  const l = labels[lang];

  // 1. PENDING_AI State – must come FIRST, highest priority
  if (normalizedStatus === 'PENDING_AI') {
    return (
      <section className="mb-0 mt-8 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-900/30 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-purple-100 dark:border-purple-900/40 bg-zinc-50 dark:bg-zinc-800/20">
           <h2 className="font-bold text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            {l.title}
          </h2>
        </div>
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-purple-700 dark:text-purple-300 font-semibold animate-pulse">{l.pendingMsg}</p>
        </div>
      </section>
    );
  }

  // 2. SKIPPED_AI: asset type not supported OR no data
  const isExcludedType = !SUPPORTED_TYPES.includes(normalizedType);
  if (normalizedStatus === 'SKIPPED_AI' || isExcludedType || !data || (!data.ja && !data.en && !data.vi)) {
    return (
      <section className="mb-0 mt-8 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm opacity-80 cursor-not-allowed">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50">
           <h2 className="font-bold text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2 grayscale">
            <Sparkles className="w-5 h-5" />
            {l.title}
          </h2>
        </div>
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
             <AlertTriangle className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{l.skippedMsg}</p>
        </div>
      </section>
    );
  }

  // 3. COMPLETED_AI State
  const content: AnalysisPayload = data[lang] || data['ja'] || {};
  const { risk_analysis, estimated_costs, winning_price_analysis, roi_analysis } = content;

  // Helpers
  const formatYen = (val?: number) => {
    if (typeof val !== 'number') return '¥0';
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);
  };
  
  const getRiskColorClass = (tag: string) => {
    const lTag = tag.toLowerCase();
    if (lTag.includes('心理的瑕疵') || lTag.includes('án mạng') || lTag.includes('境界未定') || lTag.includes('lụt') || lTag.includes('flood') || lTag.includes('death')) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
    }
    if (lTag.includes('滞納') || lTag.includes('nợ') || lTag.includes('arrears')) {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  };

  const totalCost = (estimated_costs?.arrears || 0) + (estimated_costs?.eviction_cost || 0) + (estimated_costs?.repair_estimate || 0);
  const isHighYield = roi_analysis?.yield_percent && roi_analysis.yield_percent > 10;

  return (
    <section className="mb-0 mt-8 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm relative">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/40 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm">
        <h2 className="font-bold text-lg md:text-xl text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          {l.title}
        </h2>
        
        {/* Language Switcher */}
        <div className="mt-3 sm:mt-0 flex p-1 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-lg shadow-inner">
          {(['ja', 'en', 'vi'] as Langcode[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all ${
                lang === code
                  ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {code === 'ja' && '🇯🇵 JA'}
              {code === 'en' && '🇺🇸 EN'}
              {code === 'vi' && '🇻🇳 VI'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Card 1: Risk Analysis */}
        <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-5 border border-purple-100 dark:border-purple-800/30 flex flex-col shadow-sm">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            {l.riskTitle}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {risk_analysis?.issues && risk_analysis.issues.length > 0 ? (
              risk_analysis.issues.map((tag: string, idx: number) => (
                <span key={idx} className={`px-3 py-1 text-sm font-medium border rounded-full ${getRiskColorClass(tag)}`}>
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-800/30">
                 <CheckCircle className="w-4 h-4" /> {l.noRisks}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Estimated Costs */}
        <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-5 border border-purple-100 dark:border-purple-800/30 flex flex-col shadow-sm">
           <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Coins className="w-4 h-4 text-amber-500" />
            {l.costTitle}
          </h3>
          <ul className="space-y-3 mt-1 flex-1">
             <li className="flex justify-between items-center text-sm">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{l.arrears}</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatYen(estimated_costs?.arrears)}</span>
             </li>
             <li className="flex justify-between items-center text-sm">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{l.eviction}</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatYen(estimated_costs?.eviction_cost)}</span>
             </li>
             <li className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{l.repair}</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatYen(estimated_costs?.repair_estimate)}</span>
             </li>
             <li className="flex justify-between items-center pt-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{l.totalCost}</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-lg">{formatYen(totalCost)}</span>
             </li>
          </ul>
        </div>

      </div>

      {/* Disclaimer and Actions Section */}
      <div className="px-6 py-4 bg-indigo-500/5 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/30 flex flex-col sm:flex-row justify-between items-center gap-3">
         <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium sm:max-w-md">
           {l.disclaimer}
         </p>
         
         <a 
           href={mlitUrl} 
           target="_blank" 
           rel="noreferrer" 
           className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline whitespace-nowrap"
         >
           周辺の取引相場 ↗
         </a>
      </div>
      
    </section>
  );
}
