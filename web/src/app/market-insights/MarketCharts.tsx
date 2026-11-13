"use client";

import React from 'react';
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

export interface PrefectureStat {
  name: string;
  avgPrice: number;
  count: number;
}

export interface MultipleStat {
  name: string;
  multipleRate: number;
  count: number;
}

export interface CompetitionStat {
  range: string;
  count: number;
  avgMultiple: number;
}

interface MarketChartsProps {
  avgPriceData: PrefectureStat[];
  multipleData: MultipleStat[];
  competitionData: CompetitionStat[];
}

export default function MarketCharts({
  avgPriceData,
  multipleData,
  competitionData,
}: MarketChartsProps) {
  // B2B Japanese Washoku Palette
  const KACHI_IRO = '#1B4F8A'; // 勝ち色 (Samurai Deep Indigo)
  const KACHI_DARK = '#143D6C';
  const HANADA_IRO = '#0284C7'; // 縹色 (Slate Sky)
  const KOHAKU_IRO = '#D97706'; // 琥珀色 (Warm Amber)

  const formatManYen = (val: number) => `${val.toLocaleString()}万円`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Biểu đồ 1: 都道府県別 平均落札価格 (Horizontal Bar Chart) */}
      <div className="bg-white dark:bg-[#151B22] p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              都道府県別 平均落札価格 (上位10地域)
            </h2>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              単位: 万円
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            開札結果が多数記録されている主要エリアにおける落札価格平均値
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={avgPriceData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#E2E8F0"
                className="dark:opacity-15"
              />
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
                width={70}
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PrefectureStat;
                    return (
                      <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                          <span>{data.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            実績 {data.count} 件
                          </span>
                        </div>
                        <div className="text-slate-300">
                          平均落札額:{' '}
                          <span className="text-amber-400 font-bold tabular-nums">
                            {formatManYen(data.avgPrice)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgPrice" fill={KACHI_IRO} radius={[0, 4, 4, 0]}>
                {avgPriceData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? KACHI_DARK : KACHI_IRO}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ 2: 都道府県別 落札倍率推移 (Vertical Bar Chart) */}
      <div className="bg-white dark:bg-[#151B22] p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              都道府県別 平均落札倍率 (上位10地域)
            </h2>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              基準価額 = 100%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            裁判所の売却基準価額に対して何％の価格で落札されたかの倍率指標
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={multipleData}
              margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                className="dark:opacity-15"
              />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[100, 'auto']}
                tickFormatter={(v) => `${v}%`}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MultipleStat;
                    const diff = (data.multipleRate - 100).toFixed(1);
                    return (
                      <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                          <span>{data.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            実績 {data.count} 件
                          </span>
                        </div>
                        <div className="text-slate-300">
                          平均落札倍率:{' '}
                          <span className="text-emerald-400 font-bold tabular-nums">
                            {data.multipleRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          基準価額より{' '}
                          <span className="text-amber-300 font-semibold tabular-nums">
                            +{diff}%
                          </span>{' '}
                          で落札
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

      {/* Biểu đồ 3: 入札者数（競争度）と落札倍率の相関 (Grouped Bar Chart) */}
      <div className="bg-white dark:bg-[#151B22] p-5 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs col-span-1 md:col-span-2">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              入札参加者数（競争レベル）と落札倍率の相関傾向
            </h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 dark:bg-slate-500"></span>
                案件数（左軸）
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]"></span>
                平均落札倍率（右軸）
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            競合入札者数が増加するにつれて、決定落札価額が売却基準価額からどれほど高騰するかの実証相関
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={competitionData}
              margin={{ top: 10, right: 25, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
                className="dark:opacity-15"
              />
              <XAxis
                dataKey="range"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Number(v).toLocaleString()}件`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[90, 200]}
                stroke={KOHAKU_IRO}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CompetitionStat;
                    return (
                      <div className="bg-slate-900/95 dark:bg-[#1C2128] text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700/80 font-mono">
                        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
                          {data.range}
                        </div>
                        <div className="text-slate-300">
                          該当物件数:{' '}
                          <span className="text-sky-400 font-bold tabular-nums">
                            {data.count.toLocaleString()} 件
                          </span>
                        </div>
                        <div className="text-slate-300 mt-0.5">
                          想定落札倍率:{' '}
                          <span className="text-amber-400 font-bold tabular-nums">
                            {data.avgMultiple}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                yAxisId="right"
                dataKey="avgMultiple"
                fill={KOHAKU_IRO}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
