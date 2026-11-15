'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { getProperties, getAreaStats } from '@/actions/propertyActions';
import type { BoundingBox, SearchFilters } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import PropertyQuickDrawer from '@/components/PropertyQuickDrawer';
import type { SharedProperty } from '@/types';
import SearchBar from '@/components/SearchBar';
import ViewHistoryBar from '@/components/ViewHistoryBar';
import HeaderFavLink from '@/components/HeaderFavLink';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
import { MapIcon, ListBulletIcon } from '@heroicons/react/20/solid';

import SidebarFooter from '@/components/SidebarFooter';
import MobileMapPeekCard from '@/components/MobileMapPeekCard';

const KeibaiMap = dynamic(() => import('@/components/KeibaiMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-400">
      地図を読み込み中...
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
  const [previewProperty, setPreviewProperty] = useState<SharedProperty | null>(null);

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
     const res = await fetch(`/api/properties?${qs}`, {
        headers: {
           'x-app-client': 'keibai-finder-client'
        }
     });
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

  // Clicking a card in the left sidebar: select property so map pans gently & opens popup, WITHOUT jumping the sidebar scroll position
  const handleCardClick = useCallback((id: string | null) => {
    setClickedPropertyId(id);
  }, []);

  // Clicking a marker on the map: select property AND smoothly scroll the left sidebar to bring that card into view
  const handleMarkerClick = useCallback((id: string | null) => {
    setClickedPropertyId(id);
    if (id) {
      setTimeout(() => {
        const el = document.getElementById(`card-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 60);
    }
  }, []);

  // 3. Natural Sorting Logic (preserves user scroll context)
  const listProperties = useMemo(() => {
     return [...rawListProperties];
  }, [rawListProperties]);

  const clickedProperty = useMemo(() => {
    if (!clickedPropertyId) return null;
    return (
      (mapProperties as any[]).find((p: any) => p.sale_unit_id === clickedPropertyId) ||
      (listProperties as any[]).find((p: any) => p.sale_unit_id === clickedPropertyId) ||
      null
    );
  }, [clickedPropertyId, mapProperties, listProperties]);

  const isLoading = isListLoading || isMapLoading;
  const isReachingEnd = listDataArray && listDataArray[listDataArray.length - 1]?.length < 20;

  useEffect(() => {
    // Notify Header via CustomEvent using the map total count
    window.dispatchEvent(new CustomEvent('update_property_count', { detail: mapProperties.length }));
  }, [mapProperties.length]);

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

  const handleClearAreaLock = () => {
    setCurrentFilters(f => {
       const newF = { ...f };
       delete newF.bounds;
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

    // Determine whether the user changed LOCATION filters (prefectures, line, station, keyword)
    const prevLocKey = JSON.stringify({
      prefecture: currentFilters.prefecture,
      prefectures: currentFilters.prefectures,
      lineName: currentFilters.lineName,
      stationName: currentFilters.stationName,
      keyword: currentFilters.keyword,
      lat: currentFilters.lat,
      lng: currentFilters.lng,
    });
    const nextLocKey = JSON.stringify({
      prefecture: newFilters.prefecture,
      prefectures: newFilters.prefectures,
      lineName: newFilters.lineName,
      stationName: newFilters.stationName,
      keyword: newFilters.keyword,
      lat: newFilters.lat,
      lng: newFilters.lng,
    });
    const isClearAll = Object.keys(filters).length === 0;
    const isLocationChanged = prevLocKey !== nextLocKey || isClearAll;

    if (isLocationChanged) {
      // User explicitly changed location (or cleared all filters): release viewport bounds lock so map fits the new location
      delete newFilters.bounds;
      setBounds(undefined);
      setMapMoved(false);
    } else if (currentFilters.bounds) {
      // User only changed attribute filters (e.g. 戸建て, price, sort) while locked into a map area: preserve the map area lock!
      newFilters.bounds = currentFilters.bounds;
    }
    
    setCurrentFilters(newFilters);
    setSearchVersion(v => v + 1); // Force SWR key change → always refetches
  };

  // Location-only fingerprint: MapBounds ONLY refits camera when location filters change, never when toggling property types/price/sort!
  const locationFingerprint = useMemo(() => {
    return JSON.stringify({
      prefecture: currentFilters.prefecture || null,
      prefectures: currentFilters.prefectures || null,
      lineName: currentFilters.lineName || null,
      stationName: currentFilters.stationName || null,
      keyword: currentFilters.keyword || null,
      lat: currentFilters.lat || null,
      lng: currentFilters.lng || null,
    });
  }, [
    currentFilters.prefecture,
    currentFilters.prefectures,
    currentFilters.lineName,
    currentFilters.stationName,
    currentFilters.keyword,
    currentFilters.lat,
    currentFilters.lng,
  ]);

  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.keibai-koubai.com/#website",
        "url": "https://www.keibai-koubai.com/",
        "name": "Keibai Finder",
        "description": "全国の不動産競売・公売情報を一括検索。AIによる落札価格の査定、過去の取引相場（国土交通省データ連携）で市場価格より安い不動産が見つかります。",
        "publisher": {
          "@id": "https://www.keibai-koubai.com/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.keibai-koubai.com/?keyword={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ],
        "inLanguage": "ja"
      },
      {
        "@type": "Organization",
        "@id": "https://www.keibai-koubai.com/#organization",
        "name": "TQC株式会社 (TQC Corporation)",
        "alternateName": "Keibai Finder",
        "url": "https://www.keibai-koubai.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.keibai-koubai.com/icon.png",
          "caption": "Keibai Finder Logo"
        },
        "email": "info@keibai-koubai.com",
        "telephone": "+81-3-6907-1219",
        "faxNumber": "+81-3-6701-2399",
        "address": {
          "@type": "PostalAddress",
          "postalCode": "171-0022",
          "addressCountry": "JP",
          "addressRegion": "東京都",
          "addressLocality": "豊島区",
          "streetAddress": "南池袋２丁目３３－６ 佐藤ビル３F"
        }
      }
    ]
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 select-none sm:select-auto">
      
      {/* 2. Docked Horizontal B2B Toolbar (Search & Filter) */}
      <div className="w-full z-40 bg-white dark:bg-zinc-900 shrink-0 relative">
        <Suspense fallback={<div className="h-[88px] w-full animate-pulse bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800"></div>}>
          <SearchBar onSearch={handleSearch} />
        </Suspense>
      </div>

      {/* 3. Fixed Split-Screen App Shell (SUUMO / LIFULL HOME'S / KENBIYA Standard) */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        
        {/* Left List Panel */}
        <aside className={`w-full md:w-[370px] lg:w-[390px] shrink-0 flex-col bg-slate-50 dark:bg-zinc-900/60 border-r border-slate-200 dark:border-zinc-800 relative z-10 ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>

          {/* Sticky B2B List Header */}
          <div className="shrink-0 px-3.5 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">該当物件</span>
              <span className="text-sm font-bold font-mono tabular-nums text-[#1B4F8A] dark:text-blue-400">
                {mapProperties.length.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">件</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentFilters.bounds ? (
                <button
                  type="button"
                  onClick={handleClearAreaLock}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0F4F9] dark:bg-blue-950/50 border border-[#1B4F8A]/30 text-[#1B4F8A] dark:text-blue-300 text-[10px] font-bold hover:bg-slate-200/70 transition-colors"
                  title="地図範囲の絞り込みを解除"
                >
                  <span>📍 地図範囲で絞込中</span>
                  <span className="text-slate-400 hover:text-slate-700 ml-0.5">×</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 truncate max-w-[160px]">
                  {currentFilters.prefectures && currentFilters.prefectures.length > 0
                    ? currentFilters.prefectures.length <= 2
                      ? currentFilters.prefectures.join('・')
                      : `${currentFilters.prefectures[0]}ほか${currentFilters.prefectures.length - 1}県`
                    : currentFilters.prefecture || '全国すべて'}
                </span>
              )}
            </div>
          </div>

          <div ref={listRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-4 pt-2.5 md:p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full relative">
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
                      onClick={() => handleCardClick(item.sale_unit_id)}
                      onMouseEnter={() => setHoveredPropertyId(item.sale_unit_id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      onPreview={setPreviewProperty}
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
        <div className={`flex-1 h-full relative bg-slate-200 dark:bg-zinc-800 overflow-hidden ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
          <KeibaiMap 
             mode="list"
             properties={mapProperties} 
             onBoundsChanged={handleMoveEnd} 
             center={currentFilters.lat && currentFilters.lng ? [currentFilters.lat, currentFilters.lng] : undefined}
             hoveredPropertyId={hoveredPropertyId}
             clickedPropertyId={clickedPropertyId}
             onMarkerHover={setHoveredPropertyId}
             onMarkerClick={handleMarkerClick}
             filterFingerprint={locationFingerprint}
          />
        </div>
      
        {/* View History Floating Bar */}
        <ViewHistoryBar />

        {/* Zillow/SUUMO Mobile Peek Card when marker is tapped on mobile */}
        {viewMode === 'map' && clickedProperty && (
          <MobileMapPeekCard 
            property={clickedProperty as SharedProperty}
            onClose={() => setClickedPropertyId(null)}
          />
        )}

        {/* Property Quick Drawer (Desktop Slide-Over / Mobile Bottom Sheet) */}
        <PropertyQuickDrawer 
          property={previewProperty}
          isOpen={!!previewProperty}
          onClose={() => setPreviewProperty(null)}
        />

        {/* Floating Toggle Button (Mobile Only) - Automatically hidden when Peek Card is active */}
        {(!clickedProperty || viewMode === 'list') && (
          <div 
            className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[45] animate-in fade-in-0 duration-150"
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
        )}

      </div>
    </div>
  );
}
