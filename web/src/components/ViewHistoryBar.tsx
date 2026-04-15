'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ViewHistoryBar() {
   const [history, setHistory] = useState<any[]>([]);
   const [isOpen, setIsOpen] = useState(false);

   useEffect(() => {
     try {
       const h = JSON.parse(localStorage.getItem('keibai_history') || '[]');
       setHistory(h);
     } catch(e){}
   }, []);

   if (history.length === 0) return null;

   return (
      <div 
        className="fixed bottom-20 md:bottom-4 left-4 z-[60] flex items-end pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`shrink-0 pointer-events-auto flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-700 rounded-full transition-all duration-300 z-10 focus:outline-none focus:ring-4 focus:ring-blue-500/20
            ${isOpen ? 'w-10 h-10 -translate-y-2 sm:-translate-y-4 translate-x-2 bg-white dark:bg-zinc-900 border-zinc-200 text-zinc-500 hover:text-red-500 hover:rotate-90 hidden' : 'w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 dark:bg-black text-white hover:scale-105'}`}
          title={isOpen ? "閉じる" : "閲覧履歴"}
        >
           <span className="relative flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm border border-white dark:border-black">{history.length}</span>
           </span>
        </button>

        {/* Collapsible Slide-in Panel */}
        <div className={`pointer-events-auto overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 origin-bottom-left flex flex-col absolute bottom-0 left-0
          ${isOpen ? 'w-[calc(100vw-32px)] sm:w-[500px] opacity-100 scale-100' : 'w-[0px] opacity-0 scale-95 pointer-events-none'}`}>
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span>🕒</span> 閲覧履歴
            </h4>
            <button onClick={() => setIsOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full p-1.5 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide snap-x">
             {history.map((item, idx) => (
                 <Link href={`/property/${item.id}`} prefetch={false} onClick={() => setIsOpen(false)} key={`${item.id}-${idx}`} className="snap-start min-w-[100px] max-w-[100px] block rounded-xl overflow-hidden bg-transparent shrink-0 group">
                     <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                        {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400 font-bold tracking-widest bg-zinc-50 dark:bg-zinc-950">NO IMAGE</div>
                        )}
                     </div>
                     <div className="pt-2 px-1">
                        <p className="text-[10px] font-bold line-clamp-2 leading-snug text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors w-full break-words">
                          {item.label}
                        </p>
                     </div>
                 </Link>
             ))}
          </div>
        </div>
      </div>
   );
}
