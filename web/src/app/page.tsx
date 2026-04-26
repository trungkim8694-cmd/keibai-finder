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

import SidebarFooter from '../components/SidebarFooter';

const KeibaiMap = dynamic(() => import('../components/KeibaiMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-400">
      Đang tải bản đồ...
    </div>
  )
});

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [clickedPropertyId, setClickedPropertyId] = useState<string | null>(null);

  const [bounds, setBounds] = useState<BoundingBox | undefined>(undefined);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const [mapMoved, setMapMoved] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0); // Bump to force SWR refetch
  const isAutoFly = useRef(false);
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const buildQueryString = (filters: any) => {
     const params = new URLSearchParams();
     if (filters.isMapPayload) params.append('isMapPayload', 'true');
     if (filters.page) params.append('page', filters.page.toString());
     if (filters.limit) params.append('limit', filters.limit.toString());
     if (filters.bounds) {
       params.append('swLat', filters.bounds.sw.lat.toString());
       params.append('swLng', filters.bounds.sw.lng.toString());
       params.append('neLat', filters.bounds.ne.lat.toString());
       params.append('neLng', filters.bounds.ne.lng.toString());
     }
     if (filters.keyword) params.append('keyword', filters.keyword);
     if (filters.sort) params.append('sort', filters.sort);
     if (filters.prefecture) params.append('prefecture', filters.prefecture);
     if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
     if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
     if (filters.newOnly) params.append('newOnly', 'true');
     if (filters.isClosingSoon) params.append('isClosingSoon', 'true');
     if (filters.types) {
       filters.types.forEach((t: string) => params.append('types[]', t));
     }
     if (filters.provider) params.append('provider', filters.provider);
     if (filters.providers) {
       filters.providers.forEach((p: string) => params.append('providers[]', p));
     }
     if (filters.courtName) params.append('courtName', filters.courtName);
     if (filters.managingAuthority) params.append('managingAuthority', filters.managingAuthority);
     if (filters.lineName) params.append('lineName', filters.lineName);
     if (filters.stationName) params.append('stationName', filters.stationName);
     if (filters.maxWalkTime) params.append('maxWalkTime', filters.maxWalkTime.toString());
     if (filters.minArea) params.append('minArea', filters.minArea.toString());
     if (filters.prefectures) {
       filters.prefectures.forEach((p: string) => params.append('prefectures[]', p));
     }
     return params.toString();
  };

  const fetchPropertiesApi = async (filters: any) => {
     const qs = buildQueryString(filters);
     const res = await fetch(`/api/properties?${qs}`);
     if (!res.ok) throw new Error('API Error');
     return res.json();
  };

  const mapFilters = useMemo(() => {
     const f = { ...currentFilters };
     // Khắc phục Lớp 2: Loại bỏ hoàn toàn Bounds khỏi API Map để Cache Edge Toàn Quốc
     delete f.bounds; 
     delete f.lat; 
     delete f.lng;
     return f;
  }, [currentFilters]);

  // 1. Fetch Map Data (One-Time Global Payload: Không bao gồm Bounding Box)
  const { data: mapDataArray, isLoading: isMapLoading } = useSWR(
    isHydrated && !isFlying ? { ...mapFilters, isMapPayload: true, _v: searchVersion } : null,
    fetchPropertiesApi,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  
  const mapProperties = mapDataArray || [];

  // 2. Fetch List Data (Paginated, Full Payload, Sử dụng Bounding Box)
  const {
    data: listDataArray,
    size,
    setSize,
    isLoading: isListLoading,
    isValidating
  } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!isHydrated || isFlying) return null;
      if (previousPageData && previousPageData.length < 20) return null;
      return { 
        ...currentFilters, 
        page: pageIndex + 1, 
        limit: 20,
        _v: searchVersion
      };
    },
    fetchPropertiesApi,
    { revalidateOnFocus: false, revalidateFirstPage: true, refreshInterval: 60000 }
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

  const handleMoveEnd = useCallback((newBounds: BoundingBox) => {
    setBounds(newBounds);
    
    // Normal manual panning: wait for user to click 'Search this area'
    setMapMoved(true);
  }, []);

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
          <SearchBar onSearch={handleSearch} />
        </Suspense>
      </div>

      {/* 3. Content Area (Split Screen on Desktop, Toggle on Mobile) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* List Panel */}
        <aside className={`w-full md:w-[350px] shrink-0 flex-col bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 relative z-10 transition-all ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>


          <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 pb-4 pt-1 md:p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full relative">
            {isLoading && listProperties.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 animate-pulse">
                    <div className="h-48 bg-zinc-200 dark:bg-zinc-800 w-full mb-3" />
                    <div className="p-4 space-y-3">
                       <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                       <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                       <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-full mt-2" />
                    </div>
                  </div>
                ))}
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
             mapMoved={mapMoved}
             onSearchAreaClick={handleSearchThisArea}
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
