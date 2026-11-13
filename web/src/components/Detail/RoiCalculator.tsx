'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface RoiCalculatorProps {
  basePrice: number; // in Yen
  propertyArea?: number | null; // in m2
  propertyType?: string;
  prefecture?: string;
  initialArrearsMan?: number;
  initialEvictionMan?: number;
  initialRepairMan?: number;
  isAiSynced?: boolean;
}

export function RoiCalculator({
  basePrice,
  propertyArea,
  propertyType = '戸建て',
  prefecture = '東京都',
  initialArrearsMan = 0,
  initialEvictionMan,
  initialRepairMan,
  isAiSynced = false,
}: RoiCalculatorProps) {
  // 1. Initial defaults
  const validBasePrice = basePrice && basePrice > 0 ? basePrice : 10000000;
  
  // Bid price multiplier (default: 110% of base price)
  const [bidMultiplier, setBidMultiplier] = useState<number>(110);
  const targetBidPrice = Math.round((validBasePrice * bidMultiplier) / 100);

  // Arrears fee (滞納管理費・修繕積立金) in 万円
  const [arrearsFeeMan, setArrearsFeeMan] = useState<number>(initialArrearsMan);

  // Legal/Scrivener fee: ~12 万円
  const [scrivenerFeeMan, setScrivenerFeeMan] = useState<number>(12);
  
  // Eviction / negotiation fee: initial or ~30 万円
  const defaultEviction = initialEvictionMan !== undefined ? initialEvictionMan : 30;
  const [evictionFeeMan, setEvictionFeeMan] = useState<number>(defaultEviction);

  // Renovation cost: initial or scaled by area
  const defaultReno = initialRepairMan !== undefined 
    ? initialRepairMan 
    : (propertyArea ? Math.min(Math.max(Math.round((propertyArea * 1.5) / 10) * 10, 50), 300) : 100);
  const [renovationCostMan, setRenovationCostMan] = useState<number>(defaultReno);

  // Sync if initial props change
  useEffect(() => {
    if (initialArrearsMan !== undefined) setArrearsFeeMan(initialArrearsMan);
  }, [initialArrearsMan]);

  useEffect(() => {
    if (initialEvictionMan !== undefined) setEvictionFeeMan(initialEvictionMan);
  }, [initialEvictionMan]);

  useEffect(() => {
    if (initialRepairMan !== undefined) setRenovationCostMan(initialRepairMan);
  }, [initialRepairMan]);

  // Expected monthly rent (in 10,000 Yen / 万円)
  // Sensibly calibrated to standard Japanese market cap rates (6.5% - 9%) to prevent land-area blowout
  const isKanto = ['東京都', '神奈川県', '埼玉県', '千葉県'].includes(prefecture);
  const baseYieldCap = isKanto ? 0.07 : 0.085;
  const priceBasedRent = Math.round((validBasePrice * baseYieldCap) / 12 / 10000);

  const rentPerSqm = isKanto ? 2000 : 1300;
  // Cap single unit rentable area to 120m2 to prevent huge land areas (e.g. 846m2) from blowing out yields
  const effectiveRentArea = propertyType === 'マンション'
    ? Math.min(propertyArea || 60, 150)
    : Math.min(propertyArea || 80, 120);
  const areaBasedRent = Math.round((effectiveRentArea * rentPerSqm) / 10000);

  const defaultMonthlyRent = Math.max(
    priceBasedRent > 0
      ? Math.min(Math.max(areaBasedRent, Math.round(priceBasedRent * 0.8)), Math.round(priceBasedRent * 1.3))
      : Math.max(areaBasedRent, 6),
    5
  );

  const [monthlyRentMan, setMonthlyRentMan] = useState<number>(defaultMonthlyRent);
  const [annualExpenseRatio, setAnnualExpenseRatio] = useState<number>(15); // 15% operating expense
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  // 2. Computations
  const calculations = useMemo(() => {
    // Registration tax (登録免許税) roughly ~2% of bid price
    const registrationTaxYen = Math.round(targetBidPrice * 0.02);
    const registrationTaxMan = Math.round(registrationTaxYen / 10000);

    // Other acquisition fees in Man-yen (Now includes Arrears)
    const otherExpensesMan = arrearsFeeMan + scrivenerFeeMan + evictionFeeMan + renovationCostMan;
    
    // Total acquisition cost in Man-yen
    const bidPriceMan = Math.round(targetBidPrice / 10000);
    const totalCostMan = bidPriceMan + registrationTaxMan + otherExpensesMan;

    // Rental revenue
    const annualRentRevenueMan = monthlyRentMan * 12;
    
    // Operating expenses (taxes, property management, maintenance ~15%)
    const annualOperatingCostMan = Math.round((annualRentRevenueMan * annualExpenseRatio) / 100);
    const netAnnualIncomeMan = annualRentRevenueMan - annualOperatingCostMan;

    // Yields
    const grossYield = totalCostMan > 0 ? (annualRentRevenueMan / totalCostMan) * 100 : 0;
    const netYield = totalCostMan > 0 ? (netAnnualIncomeMan / totalCostMan) * 100 : 0;

    return {
      bidPriceMan,
      registrationTaxMan,
      arrearsFeeMan,
      otherExpensesMan,
      totalCostMan,
      annualRentRevenueMan,
      netAnnualIncomeMan,
      grossYield: grossYield.toFixed(2),
      netYield: netYield.toFixed(2),
    };
  }, [
    targetBidPrice,
    arrearsFeeMan,
    scrivenerFeeMan,
    evictionFeeMan,
    renovationCostMan,
    monthlyRentMan,
    annualExpenseRatio,
  ]);

  return (
    <section id="roi-calculator-section" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-5 shadow-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            収支・実質利回りシミュレーター
          </h2>
        </div>
        {isAiSynced ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1B4F8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40">
            <Sparkles className="w-3 h-3" />
            AI試算値反映済
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            取得原価・NOI試算
          </span>
        )}
      </div>

      {/* Main Yield Metric Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-700/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">実質利回り (NOI)</p>
          <p className="text-xl font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums mt-0.5">
            {calculations.netYield}%
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">滞納・諸経費・修繕控除後</p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-700/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">表面利回り</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
            {calculations.grossYield}%
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">年間賃料 ÷ 取得総額</p>
        </div>
      </div>

      {/* Bid Price Slider */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            想定入札額 ({bidMultiplier}%)
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {calculations.bidPriceMan.toLocaleString('ja-JP')} 万円
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={160}
          step={5}
          value={bidMultiplier}
          onChange={(e) => setBidMultiplier(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#1B4F8A]"
        />
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
          <span>基準価額 (100%)</span>
          <span>130%</span>
          <span>160%</span>
        </div>
      </div>

      {/* Expected Rent Input */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          想定月額賃料
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={200}
            value={monthlyRentMan}
            onChange={(e) => setMonthlyRentMan(Math.max(1, Number(e.target.value)))}
            className="w-20 px-2 py-1 text-right text-xs font-semibold tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A]"
          />
          <span className="text-slate-500 dark:text-slate-400">万円/月</span>
        </div>
      </div>

      {/* Cost Breakdown Summary */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-200/60 dark:border-zinc-800 text-xs space-y-2">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>想定落札価格</span>
          <span className="tabular-nums">{calculations.bidPriceMan.toLocaleString('ja-JP')} 万円</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>登録免許税 (約2%)</span>
          <span className="tabular-nums">{calculations.registrationTaxMan.toLocaleString('ja-JP')} 万円</span>
        </div>
        {arrearsFeeMan > 0 && (
          <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
            <span>承継滞納管理費等 (AI抽出)</span>
            <span className="tabular-nums">+{arrearsFeeMan.toLocaleString('ja-JP')} 万円</span>
          </div>
        )}
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>付随費用（司法書士・明渡・修繕）</span>
          <span className="tabular-nums">{(scrivenerFeeMan + evictionFeeMan + renovationCostMan).toLocaleString('ja-JP')} 万円</span>
        </div>
        <div className="border-t border-slate-200 dark:border-zinc-700 pt-1.5 flex justify-between font-bold text-slate-900 dark:text-slate-100">
          <span>総取得概算費用</span>
          <span className="text-[#1B4F8A] dark:text-blue-400 tabular-nums">
            {calculations.totalCostMan.toLocaleString('ja-JP')} 万円
          </span>
        </div>
      </div>

      {/* Toggle Advanced Expense Breakdown */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1"
        >
          <span>付随費用の内訳を詳細調整</span>
          {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isAdvancedOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">承継滞納管理費等</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={arrearsFeeMan}
                  onChange={(e) => setArrearsFeeMan(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right text-xs tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">万円</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">司法書士報酬</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={scrivenerFeeMan}
                  onChange={(e) => setScrivenerFeeMan(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right text-xs tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">万円</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">立ち退き・明渡し予備費</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={evictionFeeMan}
                  onChange={(e) => setEvictionFeeMan(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right text-xs tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">万円</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">原状回復・リフォーム費用</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={renovationCostMan}
                  onChange={(e) => setRenovationCostMan(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right text-xs tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">万円</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">年間経費率（固定資産税等）</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={annualExpenseRatio}
                  onChange={(e) => setAnnualExpenseRatio(Number(e.target.value))}
                  className="w-16 px-1.5 py-0.5 text-right text-xs tabular-nums border border-slate-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
        ※本試算は概算目安です。競売・公売では物件の権利関係や現況により追加費用が発生する場合があります。
      </p>
    </section>
  );
}
