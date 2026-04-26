import Link from 'next/link';

export default function PropertyNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 max-w-lg w-full text-center animate-fade-in-up">
        
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-full h-full bg-blue-50 dark:bg-blue-900/60 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm">
            <span className="text-4xl grayscale brightness-110 hue-rotate-180 drop-shadow-md">📭</span>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
          物件が見つかりません
        </h2>
        
        <div className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed space-y-2">
          <p>お探しの物件はすでに落札されたか、競売（公売）期間が終了したため、システムから閲覧できなくなりました。</p>
          <p className="text-xs text-red-500/80 font-medium">※過去履歴(View History)からアクセスされた場合も、元データが削除されると閲覧不可になります。</p>
        </div>

          <Link
            href="/"
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-[0_0_15px_rgba(29,78,216,0.3)] hover:-translate-y-0.5"
          >
            <span>🔍</span> 全国の物件を探す
          </Link>
      </div>
    </div>
  );
}
