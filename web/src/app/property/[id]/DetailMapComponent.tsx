'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import KeibaiMap from '@/components/KeibaiMap';

export default function DetailMapComponent({ property, nearestStations, nearbyActive, nearbySold }: any) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
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

  const handleMarkerClick = useCallback((id: string) => {
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

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 flex flex-col relative z-0">
       <div className="w-full h-[350px] md:h-[500px] relative z-10 bg-zinc-200">
          {/* Floating Google Maps Button */}
          <a href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`} target="_blank" rel="noreferrer" className="absolute top-4 right-4 z-[2000] bg-white/90 dark:bg-zinc-900/90 text-blue-600 font-bold border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:bg-white dark:hover:bg-zinc-950 shadow-md backdrop-blur-sm transition-colors text-xs md:text-sm flex items-center gap-2">
            Google Mapsで開く ↗
          </a>
          <KeibaiMap 
             mode="detail"
             centerProperty={property}
             properties={nearbyActive || []}
             nearestStations={nearestStations} 
             nearbySold={nearbySold}
             hoveredPropertyId={activeItemId}
             onMarkerClick={handleMarkerClick}
          />
       </div>

       {nearbyActive && nearbyActive.length > 0 && (
         <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-t border-zinc-200 dark:border-zinc-800 relative z-20">
           <p className="font-bold text-sm mb-4 text-zinc-600 dark:text-zinc-400">周辺の類似物件 (現在入札中)</p>
           <div 
             ref={listRef}
             className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 relative scroll-smooth"
             style={{ scrollSnapType: 'x mandatory' }}
           >
             {nearbyActive.map((p: any) => (
               <div 
                  key={p.sale_unit_id} 
                  data-id={p.sale_unit_id}
                  onMouseEnter={() => setActiveItemId(p.sale_unit_id)}
                  onMouseLeave={() => setActiveItemId(null)}
                  className={`shrink-0 w-[240px] md:w-[280px] bg-white dark:bg-zinc-900 border rounded-xl p-3 snap-center shadow-sm transition-all block relative ${activeItemId === p.sale_unit_id ? 'border-blue-500 ring-2 ring-blue-500/20 -translate-y-1' : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-300'}`}
                  style={{ scrollSnapAlign: 'center' }}
               >
                 <Link href={`/property/${p.sale_unit_id}`} className="flex gap-3 h-full">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 relative">
                      {p.thumbnailUrl ? <img src={p.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-zinc-100">🏠</div>}
                   </div>
                   <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white truncate" title={p.address}>{p.address}</p>
                      <p className="text-[10px] md:text-xs text-zinc-500 mb-1 truncate">{p.property_type}</p>
                      <p className="text-blue-600 dark:text-blue-400 font-bold text-sm md:text-base">¥{Number(p.starting_price).toLocaleString()}</p>
                   </div>
                 </Link>
               </div>
             ))}
           </div>
         </div>
       )}
    </section>
  );
}
