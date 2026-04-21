'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { getProperties, getAreaStats } from '../actions/propertyActions';
import type { BoundingBox, SearchFilters } from '../actions/propertyActions';
import PropertyCard from '../components/PropertyCard';
import type { SharedProperty } from '../types';
import SearchBar from '../components/SearchBar';
import ViewHistoryBar from '../components/ViewHistoryBar';
import HeaderFavLink from '../components/HeaderFavLink';
import UserMenu from '../components/UserMenu';
import Link from 'next/link';
import { MapIcon, ListBulletIcon } from '@heroicons/react/20/solid';

import KeibaiMap from '../components/KeibaiMap';
import SidebarFooter from '../components/SidebarFooter';

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [clickedPropertyId, setClickedPropertyId] = useState<string | null>(null);

  const [bounds, setBounds] = useState<BoundingBox | undefined>(undefined);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [areaStats, setAreaStats] = useState<Record<string, number>>({});
  const [mapMoved, setMapMoved] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0); // Bump to force SWR refetch

  useEffect(() => {
    setIsHydrated(true);

    getAreaStats().then(setAreaStats).catch(console.error);
  }, []);

  // 1. Fetch Map Data (Minimal payload, all matching bounds)
  const { data: mapDataArray, isLoading: isMapLoading } = useSWR(
    isHydrated ? { ...currentFilters, mapOnly: true, _v: searchVersion } : null,
    (filters) => getProperties({ ...filters, isMapPayload: true }),
    { revalidateOnFocus: false, dedupingInterval: 0, refreshInterval: 15000 }
  );
  
  const mapProperties = mapDataArray || [];

  // 2. Fetch List Data (Paginated, full payload)
  const {
    data: listDataArray,
    size,
    setSize,
    isLoading: isListLoading,
    isValidating
  } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!isHydrated) return null;
      // Reached end
      if (previousPageData && previousPageData.length < 20) return null;
      return { 
        ...currentFilters, 
        // DO NOT inject reactive bounds from state to decouple list from map!
        page: pageIndex + 1, 
        listOnly: true,
        _v: searchVersion
      };
    },
    (key) => getProperties({ ...key, limit: 20 }),
    { revalidateOnFocus: false, revalidateFirstPage: true, refreshInterval: 15000 }
  );

  const rawListProperties = listDataArray ? ([] as any[]).concat(...listDataArray) : [];
  const listRef = useRef<HTMLDivElement>(null);

  // Dedicated Click Handler: Ensures scrolling happens EXACTLY ONCE on explicit click, releasing control afterwards
  const handlePropertyClick = useCallback((id: string | null) => {
    setClickedPropertyId(id);
    if (id && listRef.current) {
        setTimeout(() => {
           listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    }
  }, []);

  // 3. Dynamic Re-Sorting Logic based on Clicked Property
  const listProperties = useMemo(() => {
     let baseList = [...rawListProperties];
     // List is no longer dynamically reordered when a card is clicked. 
     // Natural sorting preserves the user's scroll context exactly.
     return baseList;
  }, [rawListProperties]);

  const isLoading = isListLoading || isMapLoading;
  const isReachingEnd = listDataArray && listDataArray[listDataArray.length - 1]?.length < 20;

  useEffect(() => {
    // Notify Header via CustomEvent using the map total count
    window.dispatchEvent(new CustomEvent('update_property_count', { detail: mapProperties.length }));
  }, [mapProperties.length]);

  // Airbnb UX: Smooth scroll to the clicked card in the list
  useEffect(() => {
    if (clickedPropertyId) {
      setTimeout(() => {
        const el = document.getElementById(`card-${clickedPropertyId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [clickedPropertyId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isReachingEnd && !isValidating) {
      setSize(size + 1);
    }
  };

  const handleMapBoundsChange = useCallback((newBounds: any, centerLat: number, centerLng: number) => {
    setBounds(newBounds);
    setCurrentFilters(f => {
       const newF = { ...f, bounds: newBounds }; // Lock in current box logic
       delete newF.lat; delete newF.lng;
       return newF;
    });
    setMapMoved(false);
  }, []);

  const handleMoveEnd = (newBounds: BoundingBox) => {
    setMapMoved(true);
    setBounds(newBounds);
  };

  const handleSearchThisArea = () => {
    setCurrentFilters(f => {
       const newF = { ...f, bounds: bounds }; // Lock in current box logic
       delete newF.lat; delete newF.lng;
       return newF;
    });
    setMapMoved(false);
  };

  const handleSearch = (filters: any) => {
    const newFilters: SearchFilters = { ...filters };
    if (filters.station) {
      newFilters.lat = filters.station.lat;
      newFilters.lng = filters.station.lng;
    }
    
    // Support legacy properties mapped by SearchBar earlier
    if (filters.newOnly !== undefined) newFilters.isClosingSoon = filters.newOnly;
    
    const isNewLocation = filters.lat !== currentFilters.lat || filters.lng !== currentFilters.lng;
    setCurrentFilters(newFilters);
    setSearchVersion(v => v + 1); // Force SWR key change → always refetches
    
    if (!mapMoved || isNewLocation) {
        setMapMoved(false);
    }
  };

  const filterFingerprint = useMemo(() => {
    const obj = { ...currentFilters };
    delete obj.bounds; // Do not refit maps if bounds (manual move) changes
    return JSON.stringify(obj);
  }, [currentFilters]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* 2. Horizontal Toolbar (Search & Filter) */}
      <div className="w-full z-[9999] shadow-none lg:shadow-none bg-zinc-50 dark:bg-zinc-950 lg:bg-transparent dark:lg:bg-transparent shrink-0 relative lg:pt-2">
        <Suspense fallback={<div className="h-16 w-full animate-pulse bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"></div>}>
          <SearchBar onSearch={handleSearch} areaStats={areaStats} />
        </Suspense>
      </div>

      {/* 3. Content Area (Split Screen on Desktop, Toggle on Mobile) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* List Panel */}
        <aside className={`w-full md:w-[350px] shrink-0 flex-col bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 relative z-10 transition-all ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 md:hidden flex justify-between items-center shadow-sm">
             <span className="font-bold text-sm">検索結果: <span className="text-blue-600">{mapProperties.length}件</span></span>
             {(isLoading || isValidating) && <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>}
          </div>

          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full relative">
            {isLoading && listProperties.length === 0 ? (
              <div className="flex items-center justify-center p-8 space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            ) : (
              <>
                {listProperties.map((item: any) => (
                  <div key={item.sale_unit_id} id={`card-${item.sale_unit_id}`}>
                    <PropertyCard 
                      property={item as SharedProperty} 
                    distanceFromTarget={item.sortDist}
                    isActive={clickedPropertyId === item.sale_unit_id}
                    isHovered={hoveredPropertyId === item.sale_unit_id}
                    onClick={() => handlePropertyClick(item.sale_unit_id)}
                    onMouseEnter={() => setHoveredPropertyId(item.sale_unit_id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                  />
                  </div>
                ))}
                
                {isValidating && listProperties.length > 0 && (
                  <div className="flex justify-center p-4">
                     <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                )}
                
                {listProperties.length === 0 && !isLoading && (
                  <div className="text-center py-16 px-6 h-full flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 m-2">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                       <span className="text-4xl absolute z-10 transition-transform duration-500 hover:scale-110">🧭</span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                      条件に一致する物件は見つかりませんでした
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] leading-relaxed mb-6">
                      検索条件を変更するか、地図を動かして別のエリアを探してみてください。
                    </p>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('clear-all-filters'))} 
                      className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center gap-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      条件をクリアする
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* SEO & Internal Links Footer */}
            {!isLoading && <SidebarFooter />}
          </div>
        </aside>

        {/* Map Panel */}
        <div className={`flex-1 relative bg-zinc-200 dark:bg-zinc-800 ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
          {mapMoved && (
            <button 
              onClick={handleSearchThisArea} 
              className="absolute top-[68px] lg:top-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-white text-blue-600 px-3 py-1.5 text-[11px] rounded-full font-bold shadow-md hover:bg-blue-50 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              このエリアを検索
            </button>
          )}
          <KeibaiMap 
             mode="list"
             properties={mapProperties} 
             onBoundsChanged={handleMoveEnd} 
             center={currentFilters.lat && currentFilters.lng ? [currentFilters.lat, currentFilters.lng] : undefined}
             hoveredPropertyId={hoveredPropertyId}
             clickedPropertyId={clickedPropertyId}
             onMarkerHover={setHoveredPropertyId}
             onMarkerClick={handlePropertyClick}
             filterFingerprint={filterFingerprint}
          />
        </div>
      
        {/* View History Floating Bar */}
        <ViewHistoryBar />

        {/* Floating Toggle Button (Mobile Only) */}
        <div 
          className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[50]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
           <button 
             onClick={() => {
                const nextMode = viewMode === 'map' ? 'list' : 'map';
                setViewMode(nextMode);
                try { sessionStorage.setItem('kb_viewMode', nextMode); } catch (e) {}
             }}
             className="bg-zinc-900/85 backdrop-blur-xl dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-[13px] font-bold px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center gap-2 border border-white/10 dark:border-zinc-200 transition-all hover:bg-zinc-800 active:scale-95 tracking-wide"
           >
             {viewMode === 'map' ? (
               <><ListBulletIcon className="w-4 h-4" /> リストで見る</>
             ) : (
               <><MapIcon className="w-4 h-4" /> 地図で見る</>
             )}
           </button>
        </div>

      </div>
    </div>
  );
}
