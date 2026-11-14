'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, Phone, MessageSquareQuote } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import { SocialShareDropdown } from '@/components/Detail/SocialShare';
import { AgencyLeadModal } from '@/components/Detail/AgencyLeadModal';

export function StickyActionBar({ 
  saleUnitId, 
  predictedPrice, 
  startPrice,
  pdfUrl,
  shareTitle,
  propertyUrl,
  prefecture,
  city
}: { 
  saleUnitId: string; 
  predictedPrice: string; 
  startPrice?: string;
  pdfUrl: string | null;
  shareTitle?: string;
  propertyUrl?: string;
  prefecture?: string | null;
  city?: string | null;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 1. Desktop & Tablet Top Sticky Sub-Header */}
      <div className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-200 mb-5">
        <div className="w-full max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-4">
          
          {/* Left Side: Visual Breadcrumb for SEO & Quick Jump */}
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 overflow-hidden min-w-0">
            <Link 
              href="/" 
              className="hover:text-blue-700 dark:hover:text-blue-400 shrink-0 font-medium transition-colors"
            >
              ホーム
            </Link>
            
            {prefecture && (
              <>
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />
                <Link 
                  href={`/search/area/${encodeURIComponent(prefecture)}`}
                  className="hover:text-blue-700 dark:hover:text-blue-400 shrink-0 font-medium transition-colors"
                >
                  {prefecture}
                </Link>
              </>
            )}

            {prefecture && city && (
              <>
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />
                <Link 
                  href={`/search/area/${encodeURIComponent(prefecture)}/${encodeURIComponent(city)}`}
                  className="hover:text-blue-700 dark:hover:text-blue-400 shrink-0 font-medium transition-colors truncate max-w-[120px]"
                >
                  {city}
                </Link>
              </>
            )}

            <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px] sm:max-w-[200px]">
              物件番号: {saleUnitId}
            </span>

            {/* When scrolled, show price badges */}
            {isScrolled && (
              <div className="hidden md:flex items-center gap-2 ml-3 shrink-0">
                {startPrice && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold rounded text-[11px] border border-slate-200 dark:border-zinc-700 tabular-nums">
                    基準: {startPrice}
                  </span>
                )}
                {predictedPrice && predictedPrice !== '-' && (
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded text-[11px] border border-blue-100 dark:border-blue-800 tabular-nums">
                    AI想定: {predictedPrice}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Side: CTAs & Favorite & Share (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end">
            {/* Lead Consultation CTA */}
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="h-8 text-xs font-semibold bg-[#1B4F8A] hover:bg-[#153e6d] text-white px-3 sm:px-3.5 rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>入札相談</span>
            </button>

            {/* B2B Favorite Button */}
            <FavoriteButton id={saleUnitId} />

            {/* B2B Share Dropdown */}
            <SocialShareDropdown url={propertyUrl || ''} title={shareTitle || 'Keibai-Koubai Finder'} />

            {/* Scrolled Quick PDF download */}
            {isScrolled && pdfUrl && (
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden lg:flex items-center gap-1 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 h-8 px-2.5 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>3点セット</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* 2. Mobile Fixed Bottom Sticky CTA Bar (SUUMO / LIFULL HOME'S / Kenbiya High-Conversion Standard) */}
      <div 
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] px-3 py-2"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          {/* Left: Price Stack (基準価額 & AI想定) */}
          <div className="flex flex-col min-w-0 pr-1 shrink">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold truncate leading-none mb-1">
              {startPrice ? `基準: ${startPrice}` : '売却基準価額'}
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400 leading-none truncate">
              {predictedPrice && predictedPrice !== '-' ? predictedPrice : (startPrice || '査定中')}
            </span>
          </div>

          {/* Right: Touch-Friendly High-Conversion Action Buttons (Apple HIG >= 44px) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick 3点セット PDF direct download */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-bold text-[11px] flex items-center gap-1 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                title="3点セットPDFを閲覧"
              >
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="whitespace-nowrap">3点セット</span>
              </a>
            )}

            {/* Main Conversion CTA: Free Consultation Lead Form */}
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="h-11 px-4 rounded-xl bg-[#1B4F8A] hover:bg-[#153e6d] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span className="whitespace-nowrap">入札相談</span>
            </button>

            {/* Quick Favorite Toggle */}
            <div className="shrink-0 scale-95">
              <FavoriteButton id={saleUnitId} />
            </div>
          </div>
        </div>
      </div>

      <AgencyLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        saleUnitId={saleUnitId}
        propertyAddress={shareTitle}
      />
    </>
  );
}
