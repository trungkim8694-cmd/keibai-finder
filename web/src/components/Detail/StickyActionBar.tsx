'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Share2, ChevronRight, FileText, Phone } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import { SocialShareDropdown } from '@/components/Detail/SocialShare';
import { AgencyLeadModal } from '@/components/Detail/AgencyLeadModal';

export function StickyActionBar({ 
  saleUnitId, 
  predictedPrice, 
  pdfUrl,
  shareTitle,
  propertyUrl,
  prefecture,
  city
}: { 
  saleUnitId: string, 
  predictedPrice: string, 
  pdfUrl: string | null,
  shareTitle?: string,
  propertyUrl?: string,
  prefecture?: string | null,
  city?: string | null
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
      <div className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-200 mb-5">
        <div className="w-full max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-4">
          
          {/* Left Side: Visual Breadcrumb for SEO & Navigation */}
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

            {/* When scrolled, show predicted price */}
            {isScrolled && (
              <div className="hidden md:flex items-center ml-3 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded text-[11px] border border-blue-100 dark:border-blue-800 tabular-nums shrink-0">
                AI想定: {predictedPrice}
              </div>
            )}
          </div>

          {/* Right Side: CTAs & Favorite & Share */}
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

      <AgencyLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        saleUnitId={saleUnitId}
        propertyAddress={shareTitle}
      />
    </>
  );
}
