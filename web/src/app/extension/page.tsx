import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Keibai Lens - 不動産X線スキャン拡張機能',
  description: 'Keibai Lensを無料ダウンロード。SUUMOやHOME\'S上で実勢価格とハザードマップ（洪水・土砂災害）をワンクリックで自動解析する究極のツール。',
};

export default function ExtensionLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header / Hero Section */}
      <header className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden flex flex-col items-center justify-center">
        {/* Background glow effects */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-sm font-bold border border-blue-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Keibai-Koubai 公式プロダクト
          </div>

          <h1 className="flex items-center justify-center gap-4 text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            <img src="/extension-icon.png" alt="Keibai Lens Logo" className="w-12 h-12 md:w-20 md:h-20 rounded-2xl shadow-xl shadow-blue-500/20 ring-4 ring-white" />
            <span>Keibai <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lens</span></span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto">
            日本の不動産投資家に向けた、究極のX線スキャン・ツール。
          </p>

          <p className="text-sm md:text-base text-slate-500 max-w-3xl mx-auto leading-relaxed mt-4">
            大手ポータルサイトで物件を購入予定ですか？割高な価格設定に騙されないでください。今すぐ拡張機能をインストールして、1秒で<strong>国土交通省（MLIT）の取引価格</strong>を透視し、<strong>ハザードマップ（洪水・土砂災害）</strong>のリスクを暴き出しましょう。
          </p>

          {/* Call to action */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://chrome.google.com/webstore" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.74 0 12c0 3.26.015 3.667.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.985 8.74 24 12 24c3.26 0 3.667-.015 4.948-.072 4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.687.072-4.948s-.015-3.667-.072-4.948c-.2-4.358-2.618-6.78-6.98-6.98C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.586-.015-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zm6.162 3.999a4.004 4.004 0 100-8.008 4.004 4.004 0 000 8.008z"/></svg>
              Google Chromeに追加
            </a>
            <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">完全無料</span>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-indigo-50 rounded-xl mb-6 flex items-center justify-center text-indigo-600 font-bold text-xl">1</div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">AI査定・価格分析</h3>
             <p className="text-slate-600 text-sm leading-relaxed">不透明な価格情報を排除。国税庁（NTA）、裁判所（BIT）、国土交通省（MLIT）の公的データを瞬時に統合して分析します。</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-emerald-50 rounded-xl mb-6 flex items-center justify-center text-emerald-600 font-bold text-xl">2</div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">ハザードレーダー（災害予測）</h3>
             <p className="text-slate-600 text-sm leading-relaxed">検討中の物件が、浸水想定区域、土砂災害警戒区域、または津波リスクエリアに含まれていないかを即座に検知します。</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-rose-50 rounded-xl mb-6 flex items-center justify-center text-rose-600 font-bold text-xl">3</div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">競売物件（Keibai）の自動検知</h3>
             <p className="text-slate-600 text-sm leading-relaxed">検討中物件の周辺に、市場価格より30%安い「競売物件」が出現した場合、自動的にアラートを発動します！</p>
          </div>
        </div>
      </section>

      {/* Footer link to Privacy */}
      <footer className="py-8 text-center border-t border-slate-200 mt-12 bg-white">
        <p className="text-sm text-slate-500">
           © 2026 Keibai Finder. 透明性を確保するため、当社の<Link href="/extension/privacy" className="text-indigo-600 hover:underline font-medium">プライバシーポリシー（Privacy Policy）</Link>をお読みください。
        </p>
      </footer>
    </div>
  );
}
