'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';

export function StickyActionBar({ 
  saleUnitId, 
  predictedPrice, 
  pdfUrl 
}: { 
  saleUnitId: string, 
  predictedPrice: string, 
  pdfUrl: string | null 
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show action bar after scrolling past the main title area (~200px)
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-[100] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 transition-all duration-300 relative mb-6">
      <div className="w-full max-w-4xl lg:max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
        
        {/* Left Side: Back button & Breadcrumb / Action combo */}
        <div className="flex flex-row items-center gap-1 sm:gap-4 flex-1">
          <Link href="/" className="text-gray-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0">
             <span>&larr;</span> <span>リストへ戻る</span>
          </Link>
          
          <div className={`hidden sm:flex items-center transition-all duration-300 overflow-hidden
            ${isScrolled ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0 pointer-events-none'}
          `}>
             <div className="flex items-center text-[10px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
               AI予測: {predictedPrice}
             </div>
          </div>
        </div>

        {/* Right Side: Sale Unit ID & PDF Action button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right justify-end">
          
          {/* Universal Favorite Button */}
          <div className="mr-2 sm:mr-1">
             <FavoriteButton id={saleUnitId} />
          </div>

          <span className="text-[10px] sm:text-xs text-gray-400 shrink-0 hidden sm:inline-block font-medium">物件番号: {saleUnitId}</span>
          
          <div className={`flex items-center transition-all duration-300
            ${isScrolled ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-4 pointer-events-none absolute right-4'}
          `}>
             {pdfUrl && (
               <a 
                 href={pdfUrl} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 3点セット
               </a>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
