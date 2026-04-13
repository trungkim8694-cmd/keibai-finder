"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from 'recharts';

export default function MarketCharts({ avgPriceData, roiData, competitionData }: any) {
  
  const formatJPY = (value: number) => {
    return `¥${(value / 10000).toLocaleString()}万`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Average Price Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">都道府県別の平均売却価額</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgPriceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatJPY} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(val: number) => formatJPY(val)} />
              <Bar dataKey="avgPrice" fill="#3b82f6" name="平均価額" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top ROI Zones Area Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Hot Zones (高利回りエリア)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={roiData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatPercent} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip formatter={(val: number) => formatPercent(val)} />
              <Area type="monotone" dataKey="avgRoi" stroke="#10b981" fillOpacity={1} fill="url(#colorRoi)" name="平均利益率" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competition Scatter/Line */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">競争レベルと平均入札者数</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={competitionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgBidders" stroke="#f59e0b" activeDot={{ r: 8 }} name="平均入札者数" strokeWidth={3} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" name="物件数" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
