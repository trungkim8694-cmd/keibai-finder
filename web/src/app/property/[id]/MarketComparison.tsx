export default function MarketComparison({ nearbySold = [], stations = [] }: { nearbySold?: any[], stations?: any[] }) {
  if (!nearbySold || nearbySold.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 mt-8">
        <p>このエリアの過去の落札データが見つかりませんでした。</p>
      </div>
    );
  }

  // Calculate insight
  const avgBidder = Math.round(nearbySold.reduce((acc, curr) => acc + (curr.bidderCount || 0), 0) / nearbySold.length * 10) / 10;
  const avgMargin = Math.round(nearbySold.reduce((acc, curr) => acc + (curr.marginRate || 0), 0) / nearbySold.length);

  const competitionStr = avgBidder >= 5 ? '競争率が高く' : (avgBidder >= 2 ? '競争率は標準的で' : '競争率が低く');
  const marginStr = avgMargin > 0 ? `売却基準価額より平均${avgMargin}%高い価格で落札される傾向があります。` : `売却基準価額付近で落札される傾向があります。`;

  const insightText = `このエリアは${competitionStr}（平均入札者数${avgBidder}名）、${marginStr}`;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 mt-8">
      <div className="bg-zinc-200 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-bold text-xl text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-2">
          📊 AI 相場分析 (半径10km圏内)
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        {/* Insight Box */}
        <div className="mb-6 p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <span className="text-2xl sm:text-3xl">🤖</span>
            <div>
              <p className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1.5 flex items-center gap-2">
                AI マーケットインサイト
                <span className="bg-blue-200 dark:bg-blue-800 text-[10px] px-2 py-0.5 rounded-full text-blue-800 dark:text-blue-100 uppercase tracking-wider font-bold">Auto-Gen</span>
              </p>
              <p className="text-blue-900 dark:text-blue-100 font-medium leading-relaxed sm:text-lg">
                {insightText}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <h3 className="font-bold mb-3 text-lg flex items-center gap-2">📍 近隣の落札履歴スコア</h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-800/80 uppercase text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap">距離</th>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap">売却基準価額</th>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap">落札価額</th>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap text-center">乖離率</th>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap text-center">入札件数</th>
                <th className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap text-center">落札者</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {nearbySold.map((sold) => (
                <tr key={sold.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-medium font-mono text-xs">
                    {sold.distance.toFixed(1)}km
                  </td>
                  <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                    {sold.basePrice ? `${Math.round(sold.basePrice / 10000).toLocaleString('ja-JP')}万円` : '-'}
                  </td>
                  <td className="px-5 py-4 text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                    {sold.winningPrice ? `${Math.round(sold.winningPrice / 10000).toLocaleString('ja-JP')}万円` : '-'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {sold.marginRate !== null && sold.marginRate !== undefined ? (
                      <span className={`inline-block px-2.5 py-1 rounded-md tracking-wider text-xs font-bold w-16 text-center ${sold.marginRate > 50 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50' : sold.marginRate > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'}`}>
                        {sold.marginRate > 0 ? '+' : ''}{Math.round(sold.marginRate)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-700">
                      {sold.bidderCount !== null ? sold.bidderCount : '-'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {sold.winnerType === '法人' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 whitespace-nowrap">
                        🏢 法人
                      </span>
                    ) : sold.winnerType === '個人' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap">
                        👤 個人
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
