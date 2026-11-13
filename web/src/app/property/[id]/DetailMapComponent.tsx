'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import KeibaiMap from '@/components/KeibaiMap';
import { ExternalLink, Building2, MapPin, Compass, Satellite } from 'lucide-react';

export default function DetailMapComponent({ property, nearestStations, nearbyActive, nearbySold }: any) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'keibai' | 'streetview' | 'satellite'>('keibai');
  const listRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to accurately detect the card in the center
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) setActiveItemId(id);
        }
      });
    }, {
      root: container,
      // Create a narrow vertical line at the exact center of the container
      rootMargin: '0px -50% 0px -50%',
      threshold: 0
    });

    Array.from(container.children).forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [nearbyActive]);

  const handleMarkerClick = useCallback((id: string | null) => {
    if (!id) return;
    setActiveItemId(id);
    if (listRef.current) {
       const child = listRef.current.querySelector(`[data-id="${id}"]`) as HTMLElement;
       if (child) {
         listRef.current.scrollTo({
           left: child.offsetLeft - listRef.current.clientWidth / 2 + child.clientWidth / 2,
           behavior: 'smooth'
         });
       }
    }
  }, []);

  const hasCoords = Boolean(property && property.lat && property.lng);
  const streetViewUrl = hasCoords ? `https://maps.google.com/maps?layer=c&cbll=${property.lat},${property.lng}&cbp=12,0,0,0,0&output=svembed` : '';
  const satelliteUrl = hasCoords ? `https://maps.google.com/maps?q=${property.lat},${property.lng}&t=k&z=18&output=embed` : '';

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-none border border-slate-200 dark:border-zinc-800 mb-6 flex flex-col relative z-0">
       {/* B2B Map Header & Tab Switcher */}
       <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-zinc-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setViewMode('keibai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === 'keibai'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>周辺・ハザード地図</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('streetview')}
              disabled={!hasCoords}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === 'streetview'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              } ${!hasCoords ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>360°現地ストリートビュー</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('satellite')}
              disabled={!hasCoords}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                viewMode === 'satellite'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              } ${!hasCoords ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Satellite className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google航空写真</span>
            </button>
          </div>

          {hasCoords && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-slate-600 dark:text-slate-300 font-medium hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors text-xs flex items-center gap-1 px-2 py-1"
            >
              <span>Google Mapsで開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
       </div>

       <div className="w-full h-[360px] md:h-[480px] relative z-10 bg-slate-100 dark:bg-zinc-950">
          {viewMode === 'keibai' && (
            <KeibaiMap 
               mode="detail"
               centerProperty={property}
               properties={nearbyActive || []}
               nearestStations={nearestStations} 
               nearbySold={nearbySold}
               hoveredPropertyId={activeItemId}
               onMarkerClick={handleMarkerClick}
            />
          )}

          {viewMode === 'streetview' && hasCoords && (
            <div className="w-full h-full relative">
              <iframe
                src={streetViewUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Street View"
              />
              <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-1 rounded">
                ドラッグで360°回転、矢印クリックで接道・道路の移動が可能です
              </div>
            </div>
          )}

          {viewMode === 'satellite' && hasCoords && (
            <div className="w-full h-full relative">
              <iframe
                src={satelliteUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Satellite"
              />
            </div>
          )}
       </div>

       {nearbyActive && nearbyActive.length > 0 && (
         <div className="bg-slate-50/70 dark:bg-zinc-950 p-4 border-t border-slate-200 dark:border-zinc-800 relative z-20">
           <p className="font-semibold text-xs mb-3 text-slate-700 dark:text-slate-300">マップ連動：周辺の競売・公売物件</p>
           <div 
             ref={listRef}
             className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 relative scroll-smooth"
             style={{ scrollSnapType: 'x mandatory' }}
           >
             {nearbyActive.map((p: any) => {
               const priceMan = p.starting_price ? Math.round(Number(p.starting_price) / 10000) : 0;
               return (
               <div 
                  key={p.sale_unit_id} 
                  data-id={p.sale_unit_id}
                  onMouseEnter={() => setActiveItemId(p.sale_unit_id)}
                  onMouseLeave={() => setActiveItemId(null)}
                  className={`shrink-0 w-[240px] md:w-[270px] bg-white dark:bg-zinc-900 border rounded-md p-3 snap-center shadow-none transition-all block relative ${activeItemId === p.sale_unit_id ? 'border-[#1B4F8A] ring-1 ring-[#1B4F8A]/30' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300'}`}
                  style={{ scrollSnapAlign: 'center' }}
               >
                 <Link href={`/property/${p.sale_unit_id}`} className="flex gap-2.5 h-full">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden shrink-0 border border-slate-200/80 dark:border-zinc-800 relative">
                       {p.thumbnailUrl ? (
                         <img 
                           src={p.thumbnailUrl} 
                           alt={p.address || ''}
                           onError={(e) => {
                             e.currentTarget.onerror = null;
                             e.currentTarget.src = '/no-image.png';
                           }}
                           className="w-full h-full object-cover" 
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                           <Building2 className="w-6 h-6" />
                         </div>
                       )}
                   </div>
                   <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="font-semibold text-xs text-slate-800 dark:text-white truncate" title={p.address}>{p.address}</p>
                      <p className="text-[10px] text-slate-400 mb-0.5 truncate">{p.property_type}</p>
                      <p className="text-slate-900 dark:text-slate-100 font-bold text-xs tabular-nums">{priceMan > 0 ? `${priceMan.toLocaleString()}万円` : '価格非公開'}</p>
                   </div>
                 </Link>
               </div>
             );})}
           </div>
         </div>
       )}
    </section>
  );
}
