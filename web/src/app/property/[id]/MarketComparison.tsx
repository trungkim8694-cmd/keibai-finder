import React from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Scale, Building2, User, ArrowRight } from 'lucide-react';

export default function MarketComparison({ 
  nearbySold = [], 
  stations = [],
  prefecture,
  city,
}: { 
  nearbySold?: any[]; 
  stations?: any[];
  prefecture?: string;
  city?: string;
}) {
  const searchQuery = prefecture && city ? `${prefecture}${city}` : (prefecture || city || '');

  if (!nearbySold || nearbySold.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xs border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
        <p className="mb-3">このエリアの過去の落札データが見つかりませんでした。</p>
        <Link
          href="/auction-results"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
        >
          <span>全国の落札結果データベース一覧を見る</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Calculate insights
  const count = nearbySold.length;
  const avgBidder = Math.round(nearbySold.reduce((acc, curr) => acc + (curr.bidderCount || 0), 0) / count * 10) / 10;
  const avgMargin = Math.round(nearbySold.reduce((acc, curr) => acc + (curr.marginRate || 0), 0) / count);
  const corporateCount = nearbySold.filter(s => s.winnerType === '法人').length;
  const corporateRatio = Math.round((corporateCount / count) * 100);

  const competitionStr = avgBidder >= 5 ? '競争率が高く' : (avgBidder >= 2 ? '競争率は標準的で' : '競争率が低く');
  const marginStr = avgMargin > 0 ? `基準価額より平均+${avgMargin}%高い価格で落札される傾向があります。` : `基準価額付近で落札される傾向があります。`;

  const insightText = `このエリアは${competitionStr}（平均応札数${avgBidder}名）、${marginStr}`;

  // Helper to extract clean district name from address
  const getCleanDistrict = (addr?: string | null) => {
    if (!addr) return '近隣エリア';
    // e.g. "新潟県上越市仲町三丁目" -> "上越市仲町" or "仲町"
    let clean = addr.replace(/^[^\s]+[都道府県]/, '');
    const m = clean.match(/^([^市区町村]+[市区町村])?([^0-9０-９\s-]+)/);
    if (m) {
      return m[2] ? m[2].trim() : (m[1] || clean.substring(0, 8));
    }
    return clean.substring(0, 8);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-800">
      <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          <span>周辺エリア競売落札傾向 (半径20km圏内)</span>
        </h2>
        <span className="text-[10px] text-slate-500 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {count}件の落札事例
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-3.5 text-center">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">平均応札数</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {avgBidder}<span className="text-[11px] font-normal ml-0.5">名</span>
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">平均落札乖離</span>
            <span className={`text-base font-bold tabular-nums ${avgMargin > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
              {avgMargin > 0 ? `+${avgMargin}%` : `${avgMargin}%`}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-zinc-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">法人落札比率</span>
            <span className="text-base font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
              {corporateRatio}<span className="text-[11px] font-normal ml-0.5">%</span>
            </span>
          </div>
        </div>

        {/* Market Insight Stat Summary */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 border-l-3 border-[#1B4F8A] rounded-r-md">
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A]" />
            <span>エリア市場動向サマリー</span>
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            {insightText}
          </p>
        </div>

        {/* Nearby Winning Bid History Table - Anti-Wrap & Clean Grid */}
        <h3 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
          <span>近隣の落札履歴データ</span>
          <span className="text-[10px] text-slate-400">直近10件</span>
        </h3>
        
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2.5 py-2 whitespace-nowrap">エリア・距離</th>
                <th className="px-2.5 py-2 whitespace-nowrap text-right">基準 → 落札額</th>
                <th className="px-2 py-2 whitespace-nowrap text-center">乖離率</th>
                <th className="px-2 py-2 whitespace-nowrap text-center">入札</th>
                <th className="px-2.5 py-2 whitespace-nowrap text-center">区分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {nearbySold.slice(0, 10).map((sold) => {
                const district = getCleanDistrict(sold.address);
                const baseMan = sold.basePrice ? Math.round(sold.basePrice / 10000) : null;
                const winMan = sold.winningPrice ? Math.round(sold.winningPrice / 10000) : null;

                return (
                  <tr key={sold.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Col 1: Area & Distance */}
                    <td className="px-2.5 py-2 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate" title={sold.address || ''}>
                        {district}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sold.distance.toFixed(1)}km
                      </div>
                    </td>

                    {/* Col 2: Base -> Winning Price */}
                    <td className="px-2.5 py-2 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {winMan ? `${winMan.toLocaleString('ja-JP')}万円` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        基準 {baseMan ? `${baseMan.toLocaleString('ja-JP')}万` : '-'}
                      </div>
                    </td>

                    {/* Col 3: Margin */}
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {sold.marginRate !== null && sold.marginRate !== undefined ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums whitespace-nowrap ${
                          sold.marginRate > 50 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' 
                            : sold.marginRate > 0 
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' 
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}>
                          {sold.marginRate > 0 ? '+' : ''}{Math.round(sold.marginRate)}%
                        </span>
                      ) : '-'}
                    </td>

                    {/* Col 4: Bidders */}
                    <td className="px-2 py-2 text-center whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {sold.bidderCount !== null ? `${sold.bidderCount}名` : '-'}
                    </td>

                    {/* Col 5: Winner Type Badge (Anti-Wrap) */}
                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                      {sold.winnerType === '法人' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                          <Building2 className="w-2.5 h-2.5 shrink-0" />
                          <span>法人</span>
                        </span>
                      ) : sold.winnerType === '個人' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
                          <User className="w-2.5 h-2.5 shrink-0" />
                          <span>個人</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Deep-link to auction-results */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <Link
            href={`/auction-results${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
            className="inline-flex items-center gap-1 font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
          >
            <span>{searchQuery ? `「${searchQuery}」周辺の` : ''}過去の落札結果を検索</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-slate-400 dark:text-slate-500">全国競売・公売落札データベース</span>
        </div>
      </div>
    </div>
  );
}
