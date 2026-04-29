import React from 'react';
import Link from 'next/link';
import { Map, LineChart, ShieldAlert, Cpu } from 'lucide-react';

export const metadata = {
  title: '主要機能 (Features) | Keibai Finder',
  description: 'Keibai Finderが提供する不動産投資家向けの主要機能一覧。競売物件のマップ検索から、過去10年間の取引価格推移、災害リスクの即時判定まで網羅しています。',
};

export default function FeaturesIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">主要機能 <span className="text-indigo-600">Hub</span></h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Keibai Finder エコシステムが提供する強力なデータ分析ツール一覧です。目的に合わせたツールを選択し、投資機会を最大化してください。
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          
          {/* Map Search */}
          <Link href="/features/map-search" className="group block bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Map className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">エリア物件検索 (Map Search)</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              地図上から直感的に競売物件（Keibai）と公売物件（Koubai）を探し出します。学区や駅からの距離など、周辺環境と合わせて投資判断が可能です。
            </p>
            <span className="text-indigo-600 font-bold text-sm flex items-center gap-1">検索を開始 <span className="group-hover:translate-x-1 transition-transform">→</span></span>
          </Link>

          {/* Trade Price Search */}
          <Link href="/features/trade-price-search" className="group block bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:emerald-300 transition-all">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LineChart className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">取引価格調査 (Trade Price)</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              国土交通省（MLIT）が公表する過去10年分の不動産取引価格データを視覚化。地域の相場トレンドを一目で把握し、割安な物件を見抜きます。
            </p>
            <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">相場を調べる <span className="group-hover:translate-x-1 transition-transform">→</span></span>
          </Link>

          {/* Area Map Hazard */}
          <Link href="/features/area-map" className="group block bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:rose-300 transition-all">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-7 h-7 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-rose-600 transition-colors">災害リスクマップ (Hazard Area)</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              洪水、土砂災害、津波などの各種災害リスクエリアをマップ上に重ねて表示。購入予定物件の安全性を事前に徹底確認できます。
            </p>
            <span className="text-rose-600 font-bold text-sm flex items-center gap-1">リスクを確認 <span className="group-hover:translate-x-1 transition-transform">→</span></span>
          </Link>

          {/* Chrome Extension */}
          <Link href="/extension" className="group block bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="w-14 h-14 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
              <Cpu className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors relative z-10">X-Ray 拡張機能 (Chrome Tool)</h2>
            <p className="text-slate-300 mb-6 leading-relaxed relative z-10">
              SUUMOやHOME'Sで家を探す際に、この拡張機能を使えばワンクリックで「相場情報」と「災害リスク」をリアルタイムで透視できます。
            </p>
            <span className="text-blue-400 font-bold text-sm flex items-center gap-1 relative z-10">無料でインストール <span className="group-hover:translate-x-1 transition-transform">→</span></span>
          </Link>

        </div>
      </div>
    </div>
  );
}
