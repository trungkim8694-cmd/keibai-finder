"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  Layers,
  ChevronRight,
  ArrowUpDown,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Award,
  BarChart3,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export interface PrefectureData {
  name: string;
  region: string;
  count: number;
  avgBase: number; // 万円
  avgWin: number; // 万円
  medianWin: number; // 万円
  multipleRate: number; // %
  avgBidders: number;
}

export interface CompetitionStat {
  range: string;
  count: number;
  avgMultiple: number;
}

interface MarketChartsProps {
  prefecturesData: PrefectureData[];
  competitionData: CompetitionStat[];
}

const REGIONS = [
  '全国',
  '関東',
  '近畿',
  '中部',
  '東北・北海道',
  '中国・四国',
  '九州・沖縄',
];

export default function MarketCharts({
  prefecturesData,
  competitionData,
}: MarketChartsProps) {
  // Theme colors
  const KACHI_IRO = '#1B4F8A'; // 勝ち色 (Samurai Indigo)
  const KACHI_DARK = '#143D6C';
  const HANADA_IRO = '#0284C7'; // 縹色 (Sky)
  const KOHAKU_IRO = '#D97706'; // 琥珀色 (Warm Amber)
  const EMERALD_IRO = '#059669'; // 萌黄 (Emerald)

  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedRegion, setSelectedRegion] = useState<string>('全国');
  const [selectedPrefName, setSelectedPrefName] = useState<string>('東京都');
  const [priceSortMode, setPriceSortMode] = useState<'high' | 'low' | 'all'>('high');
  const [chartActiveTab, setChartActiveTab] = useState<'price' | 'multiple' | 'competition'>('price');
  
  // Table search & sort state
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableSortKey, setTableSortKey] = useState<keyof PrefectureData>('avgWin');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);

  // Filter prefectures by selected region
  const regionFilteredPrefectures = useMemo(() => {
    if (selectedRegion === '全国') return prefecturesData;
    return prefecturesData.filter((p) => p.region === selectedRegion);
  }, [prefecturesData, selectedRegion]);

  // Selected Prefecture detail
  const selectedPref = useMemo(() => {
    return (
      prefecturesData.find((p) => p.name === selectedPrefName) ||
      prefecturesData[0]
    );
  }, [prefecturesData, selectedPrefName]);

  // Rank in Japan for selected prefecture
  const prefRankByPrice = useMemo(() => {
    const sorted = [...prefecturesData].sort((a, b) => b.avgWin - a.avgWin);
    const index = sorted.findIndex((p) => p.name === selectedPref.name);
    return index >= 0 ? index + 1 : 1;
  }, [prefecturesData, selectedPref]);

  // Chart data for Price
  const chartPriceData = useMemo(() => {
    let list = [...regionFilteredPrefectures];
    if (priceSortMode === 'high') {
      return list.sort((a, b) => b.avgWin - a.avgWin).slice(0, 10);
    } else if (priceSortMode === 'low') {
      return list.sort((a, b) => a.avgWin - b.avgWin).slice(0, 10);
    } else {
      // 'all' within the region (or top 15 if nationwide)
      const max = selectedRegion === '全国' ? 15 : list.length;
      return list.sort((a, b) => b.avgWin - a.avgWin).slice(0, max);
    }
  }, [regionFilteredPrefectures, priceSortMode, selectedRegion]);

  // Chart data for Multiple Rate
  const chartMultipleData = useMemo(() => {
    let list = [...regionFilteredPrefectures];
    return list.sort((a, b) => b.multipleRate - a.multipleRate).slice(0, 10);
  }, [regionFilteredPrefectures]);

  // Sorted and searched Table data
  const tableData = useMemo(() => {
    let list = [...prefecturesData];
    if (selectedRegion !== '全国') {
      list = list.filter((p) => p.region === selectedRegion);
    }
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter((p) => p.name.includes(q) || p.region.includes(q));
    }

    list.sort((a, b) => {
      const aVal = a[tableSortKey];
      const bVal = b[tableSortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return tableSortAsc ? aVal.localeCompare(bVal, 'ja') : bVal.localeCompare(aVal, 'ja');
      }
      return tableSortAsc ? (Number(aVal) - Number(bVal)) : (Number(bVal) - Number(aVal));
    });

    return list;
  }, [prefecturesData, selectedRegion, tableSearch, tableSortKey, tableSortAsc]);

  const handleTableSort = (key: keyof PrefectureData) => {
    if (tableSortKey === key) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortKey(key);
      setTableSortAsc(false); // default desc
    }
  };

  const formatManYen = (val: number) => `${val.toLocaleString()}万円`;

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800" />
        <div className="h-96 bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. REGION FILTER BAR & PREFECTURE QUICK SELECTOR */}
      <div className="bg-white dark:bg-[#151B22] p-4 sm:p-5 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Region Tabs */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>エリア・地方で絞り込み</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedRegion === region
                      ? 'bg-[#1B4F8A] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Prefecture Dropdown */}
          <div className="shrink-0 flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              特定都道府県を照会:
            </span>
            <select
              value={selectedPrefName}
              onChange={(e) => setSelectedPrefName(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] cursor-pointer"
            >
              {prefecturesData.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.count.toLocaleString()}件)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. PREFECTURE SPOTLIGHT CARD (Hiển thị chi tiết tỉnh đã chọn) - B2B Minimalist */}
      <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1B4F8A] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {selectedPref.name}
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 shrink-0">
                  {selectedPref.region}
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 shrink-0">
                  全国価格順位: 第{prefRankByPrice}位 / 47
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                裁判所開札データ蓄積数: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{selectedPref.count.toLocaleString()}</strong> 件を完全分析
              </p>
            </div>
          </div>

          <Link
            href={`/auction-results?prefecture=${encodeURIComponent(selectedPref.name)}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] transition-colors shadow-xs group shrink-0"
          >
            <span>{selectedPref.name}の落札データ一覧を調べる</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Spotlight 4 Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 dark:bg-[#0D1117]/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              平均落札価格 (Mean)
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatManYen(selectedPref.avgWin)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              基準価額平均: {formatManYen(selectedPref.avgBase)}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1117]/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              落札価格の中央値 (Median)
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
              {formatManYen(selectedPref.medianWin)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              外れ値の影響を受けない実勢指標
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1117]/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              平均落札倍率 (Winning Multiple)
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {selectedPref.multipleRate.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              基準価額に対する乖離率
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-[#0D1117]/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              平均入札参加者数
            </span>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {selectedPref.avgBidders.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">名 / 件</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              競争激化リスクの目安
            </span>
          </div>
        </div>
      </div>

      {/* 3. SWITCHABLE CHARTS SECTION */}
      <div className="bg-white dark:bg-[#151B22] p-5 sm:p-6 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Chart View Toggle Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap pb-1.5 sm:pb-0">
            <button
              type="button"
              onClick={() => setChartActiveTab('price')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                chartActiveTab === 'price'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              平均落札価格・相場水準
            </button>
            <button
              type="button"
              onClick={() => setChartActiveTab('multiple')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                chartActiveTab === 'multiple'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              落札倍率（過熱度）
            </button>
            <button
              type="button"
              onClick={() => setChartActiveTab('competition')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                chartActiveTab === 'competition'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              入札参加者数と倍率の相関
            </button>
          </div>

          {/* Sub-controls for price tab */}
          {chartActiveTab === 'price' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">表示順:</span>
              <button
                type="button"
                onClick={() => setPriceSortMode('high')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  priceSortMode === 'high'
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#1B4F8A] dark:text-blue-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                高価格順 (Top 10)
              </button>
              <button
                type="button"
                onClick={() => setPriceSortMode('low')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  priceSortMode === 'low'
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#1B4F8A] dark:text-blue-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                割安順 (Top 10)
              </button>
              <button
                type="button"
                onClick={() => setPriceSortMode('all')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  priceSortMode === 'all'
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#1B4F8A] dark:text-blue-300'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                エリア内全件
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: PRICE CHART */}
        {chartActiveTab === 'price' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <p>
                {selectedRegion}の平均落札価格（{priceSortMode === 'high' ? '高い順' : priceSortMode === 'low' ? '割安・手頃な順' : '全件一覧'}）
              </p>
              <span className="tabular-nums">単位: 万円</span>
            </div>
            <div className="h-96 w-full min-h-[384px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={384}>
                <BarChart
                  data={chartPriceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:opacity-15" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${Number(v).toLocaleString()}`}
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={48}
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as PrefectureData;
                        return (
                          <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                              <span>{data.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                実績 {data.count.toLocaleString()} 件
                              </span>
                            </div>
                            <div className="text-slate-300">
                              平均落札額: <span className="text-amber-400 font-bold tabular-nums">{formatManYen(data.avgWin)}</span>
                            </div>
                            <div className="text-slate-300 mt-0.5">
                              中央値: <span className="text-sky-400 font-bold tabular-nums">{formatManYen(data.medianWin)}</span>
                            </div>
                            <div className="text-slate-400 text-[10px] mt-1">
                              落札倍率: {data.multipleRate.toFixed(1)}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgWin" fill={KACHI_IRO} radius={[0, 4, 4, 0]}>
                    {chartPriceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === selectedPrefName ? '#D97706' : index === 0 ? KACHI_DARK : KACHI_IRO}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: MULTIPLE RATE CHART */}
        {chartActiveTab === 'multiple' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <p>{selectedRegion}の平均落札倍率（売却基準価額に対する決定価格比）</p>
              <span className="tabular-nums">基準価額 = 100%</span>
            </div>
            <div className="h-96 w-full min-h-[384px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={384}>
                <BarChart data={chartMultipleData} margin={{ top: 10, right: 15, left: -5, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:opacity-15" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={45} />
                  <YAxis domain={[100, 'auto']} tickFormatter={(v) => `${v}%`} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as PrefectureData;
                        const diff = (data.multipleRate - 100).toFixed(1);
                        return (
                          <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                              <span>{data.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">実績 {data.count.toLocaleString()} 件</span>
                            </div>
                            <div className="text-slate-300">
                              平均落札倍率: <span className="text-emerald-400 font-bold tabular-nums">{data.multipleRate.toFixed(1)}%</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              基準価額より <span className="text-amber-300 font-semibold tabular-nums">+{diff}%</span> で落札
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="multipleRate" fill={HANADA_IRO} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: COMPETITION CORRELATION CHART */}
        {chartActiveTab === 'competition' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <p>入札者数（競争レベル）が増加するにつれて、決定落札価額が基準価額からどれほど高騰するかの実証相関</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span>
                  該当案件数（左軸）
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span>
                  想定落札倍率（右軸）
                </span>
              </div>
            </div>
            <div className="h-96 w-full min-h-[384px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={384}>
                <BarChart data={competitionData} margin={{ top: 10, right: 25, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:opacity-15" />
                  <XAxis dataKey="range" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toLocaleString()}件`} />
                  <YAxis yAxisId="right" orientation="right" domain={[100, 400]} stroke={KOHAKU_IRO} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as CompetitionStat;
                        return (
                          <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">{data.range}</div>
                            <div className="text-slate-300">該当物件数: <span className="text-sky-400 font-bold tabular-nums">{data.count.toLocaleString()} 件</span></div>
                            <div className="text-slate-300 mt-0.5">想定落札倍率: <span className="text-amber-400 font-bold tabular-nums">{data.avgMultiple}%</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar yAxisId="right" dataKey="avgMultiple" fill={KOHAKU_IRO} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 4. FULL 47-PREFECTURES DATA MATRIX TABLE */}
      <div className="bg-white dark:bg-[#151B22] rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span>全国47都道府県 落札相場統計マトリクス一覧</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              各列のヘッダーをクリックして昇順・降順に並び替え（ソート）が可能です。
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="都道府県名で検索..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1117] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-[#0D1117]/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>都道府県</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">地方区分</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('count')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>分析件数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('avgWin')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>平均落札価格</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('medianWin')}>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[#1B4F8A] dark:text-blue-400">中央値</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('multipleRate')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>平均落札倍率</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleTableSort('avgBidders')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>平均入札者</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {tableData.map((item, idx) => {
                const isSelected = item.name === selectedPrefName;
                return (
                  <tr
                    key={item.name}
                    className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${
                      isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPrefName(item.name)}
                        className="hover:text-[#1B4F8A] hover:underline text-left cursor-pointer flex items-center gap-1.5"
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A]"></span>}
                        <span>{item.name}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 font-sans text-[11px] text-slate-400">
                      {item.region}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {item.count.toLocaleString()} 件
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {formatManYen(item.avgWin)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-[#1B4F8A] dark:text-blue-400">
                      {formatManYen(item.medianWin)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                      {item.multipleRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {item.avgBidders.toFixed(1)} 名
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <Link
                        href={`/auction-results?prefecture=${encodeURIComponent(item.name)}`}
                        className="inline-flex items-center justify-center gap-1 min-h-[36px] min-w-[56px] px-2.5 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-[#1B4F8A] text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-[#1B4F8A] dark:text-slate-200 transition-colors"
                      >
                        <span>結果</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
