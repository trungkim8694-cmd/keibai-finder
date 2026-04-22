'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp, AlertCircle, Building2 } from 'lucide-react';

type ChartProps = {
  property: any;
};

export default function InteractivePropertyChart({ property }: ChartProps) {
  if (!property) return null;

  const startingPrice = Number(property.starting_price) || 0;
  const mlitPrice = Number(property.mlit_estimated_price) || 0;
  
  if (startingPrice === 0 || mlitPrice === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500">
        <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
        <p className="text-sm">データが不足しているため、乖離グラフを表示できません。</p>
      </div>
    );
  }

  // Formatting helper
  const formatYen = (val: number) => {
    if (val >= 10000) {
      return `¥${(val / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万円`;
    }
    return `¥${val.toLocaleString('ja-JP')}円`;
  };

  const gapPercent = ((mlitPrice - startingPrice) / mlitPrice) * 100;
  const isBargain = gapPercent > 0;

  const data = [
    {
      name: '市場価格 (MLIT)',
      price: mlitPrice,
      fill: '#94a3b8', // subtle gray for benchmark
    },
    {
      name: '競売開始価格',
      price: startingPrice,
      fill: isBargain ? '#ef4444' : '#3b82f6', // red if it's a bargain (dropping price)
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">{dataPoint.name}</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            {formatYen(dataPoint.price)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 relative z-10">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1 tracking-wider uppercase">
            <Building2 className="w-4 h-4" />
            価格乖離分析 (Value Analysis)
          </h4>
          <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            {property.city || ''} {property.address.substring(0, 15)}...
          </p>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isBargain ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
          {isBargain ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          <span className="text-sm font-bold">乖離率 {Math.abs(gapPercent).toFixed(1)}%</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[220px] w-[100%] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#52525b" opacity={0.2} />
            <XAxis 
              type="number" 
              tickFormatter={(val) => `¥${(val / 10000).toLocaleString()}万`} 
              stroke="#71717a" 
              fontSize={12}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 13, fontWeight: 'bold' }} 
              width={110}
            />
            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
            <Bar dataKey="price" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="text-xs text-zinc-400 dark:text-zinc-500">
           ID: <span className="font-mono">{property.sale_unit_id}</span>
        </div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          Source: MLIT & BIT
        </div>
      </div>
    </div>
  );
}
