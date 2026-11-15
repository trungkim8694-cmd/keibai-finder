'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSWR from 'swr';
import japanMaskData from '@/data/japanMask.json';
import { StreetViewModal } from '@/components/StreetViewModal';
import { Compass, ExternalLink, X, AlertTriangle, ShieldCheck, MapPin, Building, Waves, ChevronDown, ChevronUp } from 'lucide-react';

export type BaseMapMode = 'pale' | 'standard' | 'satellite';

export const ZONING_COLORS: Record<string, string> = {
  "第一種低層住居専用地域": "#00b285",
  "第二種低層住居専用地域": "#95d18d",
  "第一種中高層住居専用地域": "#b2d234",
  "第二種中高層住居専用地域": "#d6e033",
  "第一種住居地域": "#f4e001",
  "第二種住居地域": "#f1b306",
  "準住居地域": "#eb7d05",
  "田園住居地域": "#1f8c47",
  "近隣商業地域": "#f089a8",
  "商業地域": "#ea445a",
  "準工業地域": "#b085c8",
  "工業地域": "#a0e1e6",
  "工業専用地域": "#49b2e8"
};

// Strictly restrict camera viewport to Japan's territory (Okinawa/Yonaguni to Hokkaido/Wakkanai)
export const JAPAN_MAX_BOUNDS: [[number, number], [number, number]] = [
  [20.0, 120.0], // Southwest: South of Okinawa & Yonaguni Island
  [46.5, 154.0], // Northeast: North of Hokkaido (Cape Soya) & Kuril Islands
];

// Nationwide bounding box of Japan (Okinawa to Hokkaido)
export const JAPAN_NATIONWIDE_BOUNDS: [[number, number], [number, number]] = [
  [25.8, 127.0], // Southwest: Okinawa & Kyushu
  [45.6, 145.8], // Northeast: Cape Soya (Hokkaido) & Shiretoko
];

export function fitToNationwideJapan(map: L.Map, animate = true) {
  try {
    map.closePopup();
  } catch {}
  map.fitBounds(JAPAN_NATIONWIDE_BOUNDS, {
    paddingTopLeft: [65, 30],     // Clears top floating regional pill & header
    paddingBottomRight: [45, 30], // Clears bottom navigation & controls
    maxZoom: 5,                   // Strictly caps zoom at 5 so Japan fits inside viewport
    animate,
    duration: 0.8,
  });
}

const REGIONAL_HOTSPOTS = [
  { name: '全国', center: [36.0, 137.0] as [number, number], zoom: 5 },
  { name: '関東', center: [35.6895, 139.6917] as [number, number], zoom: 9 },
  { name: '近畿', center: [34.6937, 135.5023] as [number, number], zoom: 9 },
  { name: '中部', center: [35.1815, 136.9066] as [number, number], zoom: 8 },
  { name: '九州', center: [33.5904, 130.4017] as [number, number], zoom: 8 },
  { name: '東北', center: [38.2682, 140.8694] as [number, number], zoom: 8 },
  { name: '北海道', center: [43.2, 142.8] as [number, number], zoom: 7 },
  { name: '中四国', center: [34.3853, 132.4553] as [number, number], zoom: 8 },
];

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-app-client': 'keibai-finder-client'
  }
}).then(res => res.json());

// Zero CDN Dependency - strictly use local public icons
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

function MapResizeObserver() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function MapInitialBoundsHandler({
  externalPoint,
  flyPoint,
  initialCenter,
  initialZoom,
}: {
  externalPoint: [number, number] | null;
  flyPoint?: [number, number] | null;
  initialCenter?: [number, number];
  initialZoom?: number;
}) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (externalPoint) {
      map.setView(externalPoint, 15);
    } else if (flyPoint) {
      map.setView(flyPoint, 15);
    } else if (initialCenter && (initialZoom ?? 13) > 5) {
      map.setView(initialCenter, initialZoom);
    } else {
      fitToNationwideJapan(map, false);
    }
  }, [map, externalPoint, flyPoint, initialCenter, initialZoom]);

  return null;
}

function CustomMapControls() {
  const map = useMap();
  const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); map.zoomIn(); };
  const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); map.zoomOut(); };
  const handleResetJapan = (e: React.MouseEvent) => {
    e.stopPropagation();
    fitToNationwideJapan(map, true);
  };
  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.locate().on("locationfound", (e) => {
      const { lat, lng } = e.latlng;
      // If user's GPS/IP is inside Japan, fly to their position
      if (lat >= 20.0 && lat <= 46.5 && lng >= 120.0 && lng <= 154.0) {
        map.flyTo(e.latlng, 15, { duration: 1.2 });
      } else {
        // If user is accessing from abroad, fly to Tokyo rather than foreign country
        map.flyTo([35.6812, 139.7671], 13, { duration: 1.2 });
      }
    });
  };

  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = controlRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  return (
    <div 
      ref={controlRef}
      className="absolute lg:bottom-8 lg:right-6 bottom-20 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Reset to Entire Japan View */}
      <button 
        onClick={handleResetJapan}
        className="w-9 h-9 bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors active:scale-95 cursor-pointer"
        title="全国表示に戻す (日本全体を表示)"
      >
        <span className="text-sm">🗾</span>
      </button>

      {/* GPS Location Button */}
      <button 
        onClick={handleLocate} 
        className="w-9 h-9 bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors active:scale-95 cursor-pointer" 
        title="現在地を表示 (日本国内)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md rounded-lg overflow-hidden">
        <button 
          onClick={handleZoomIn} 
          className="w-9 h-9 flex items-center justify-center text-base text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1B4F8A] transition-colors border-b border-slate-100 dark:border-slate-800 font-semibold cursor-pointer" 
          title="拡大"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut} 
          className="w-9 h-9 flex items-center justify-center text-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1B4F8A] transition-colors font-semibold cursor-pointer" 
          title="縮小"
        >
          −
        </button>
      </div>
    </div>
  );
}

function MapRegionalQuickJumps() {
  const map = useMap();
  const [activeRegion, setActiveRegion] = useState<string>('全国');

  const handleJump = (r: typeof REGIONAL_HOTSPOTS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveRegion(r.name);
    if (r.name === '全国') {
      fitToNationwideJapan(map, true);
    } else {
      map.flyTo(r.center, r.zoom, { duration: 1.0 });
    }
  };

  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = controlRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  return (
    <div
      ref={controlRef}
      className="absolute top-3.5 left-2.5 sm:left-4 z-[1000] pointer-events-auto max-w-[calc(100%-20px)] lg:max-w-[calc(100%-220px)] select-none"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md px-2 py-1 rounded-full border border-slate-200/90 dark:border-slate-800/90 shadow-md overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-1 pr-1 shrink-0 flex items-center gap-1">
          <span>🗾</span>
          <span className="hidden sm:inline">地域:</span>
        </span>
        {REGIONAL_HOTSPOTS.map((r) => {
          const isActive = activeRegion === r.name;
          return (
            <button
              key={r.name}
              type="button"
              data-region-jump={r.name}
              title={`${r.name}エリアを表示`}
              onClick={(e) => handleJump(r, e)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1B4F8A] text-white shadow-xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Unified Minimalist Japanese B2B Map Layer Panel (Map Type + Hazard/Zoning Layers)
function UnifiedMapLayerPanel({
  baseMapMode,
  setBaseMapMode,
  focusJapan,
  setFocusJapan,
  mapMode,
  hazardState,
  setHazardState,
  zoningOpacity,
  setZoningOpacity,
}: {
  baseMapMode: BaseMapMode;
  setBaseMapMode: (mode: BaseMapMode) => void;
  focusJapan: boolean;
  setFocusJapan: (v: boolean) => void;
  mapMode: 'hazard' | 'zoning';
  hazardState: {
    flood: boolean;
    landslide: boolean;
    tsunami: boolean;
    stormSurge: boolean;
    shelter: boolean;
  };
  setHazardState: React.Dispatch<React.SetStateAction<any>>;
  zoningOpacity: number;
  setZoningOpacity: (v: number) => void;
}) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [showLegends, setShowLegends] = useState(false);
  const isAllOff = !hazardState.flood && !hazardState.landslide && !hazardState.tsunami && !hazardState.stormSurge && !hazardState.shelter;

  const activeLayerCount = useMemo(() => {
    if (mapMode === 'hazard') {
      return Object.values(hazardState).filter(Boolean).length;
    }
    return 1;
  }, [mapMode, hazardState]);

  const layers = [
    { key: 'flood', label: '洪水浸水想定', dotColor: 'bg-blue-500' },
    { key: 'landslide', label: '土砂災害警戒', dotColor: 'bg-amber-500' },
    { key: 'tsunami', label: '津波浸水想定', dotColor: 'bg-cyan-500' },
    { key: 'stormSurge', label: '高潮浸水想定', dotColor: 'bg-purple-500' },
    { key: 'shelter', label: '指定避難場所', dotColor: 'bg-emerald-500' },
  ];

  const floodLegend = [
    { color: '#f7f5a9', label: '0.5m未満' },
    { color: '#ffd3a3', label: '0.5m 〜 3.0m未満' },
    { color: '#ff9999', label: '3.0m 〜 5.0m未満' },
    { color: '#ff5050', label: '5.0m 〜 10.0m未満' },
    { color: '#b30000', label: '10.0m以上' }
  ];

  const landslideLegend = [
    { color: '#ffe600', label: '土石流危険渓流' },
    { color: '#ff9999', label: '急傾斜地の崩壊区域' },
    { color: '#b30000', label: '地滑り危険区域' }
  ];

  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = controlRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  return (
    <>
      {/* Mobile Backdrop to close popover when clicking anywhere outside */}
      {isOpenMobile && (
        <div 
          className="lg:hidden fixed inset-0 z-[999] bg-slate-900/10 backdrop-blur-[0.5px]"
          onClick={() => setIsOpenMobile(false)}
          onTouchStart={() => setIsOpenMobile(false)}
        />
      )}

      <div 
        ref={controlRef}
        className="absolute top-[52px] lg:top-3.5 right-2.5 lg:right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-2 select-none"
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Toggle Button Pill */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setIsOpenMobile((v) => !v)}
            className={`h-8 px-2.5 rounded-full border shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isOpenMobile
                ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                : 'bg-white/95 dark:bg-[#151B22]/95 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="地図タイプ・レイヤーの切り替え"
          >
            <span className="text-xs">🗺️</span>
            <span>レイヤー</span>
            {activeLayerCount > 0 && (
              <span className={`ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                isOpenMobile ? 'bg-white text-[#1B4F8A]' : 'bg-[#1B4F8A] text-white'
              }`}>
                {activeLayerCount}
              </span>
            )}
          </button>
        </div>

        <div className={`bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg lg:shadow-md rounded-lg p-2 flex-col gap-2 w-48 sm:w-44 ${
          isOpenMobile ? 'flex animate-in fade-in zoom-in-95 duration-150' : 'hidden lg:flex'
        }`}>
        
        {/* Base Map Switcher: Standard / Satellite / Pale */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 px-1 flex items-center justify-between">
            <span>地図タイプ</span>
            <span className="text-[9px] font-mono text-slate-400">GSI/地理院</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setBaseMapMode('pale')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center cursor-pointer ${
                baseMapMode === 'pale'
                  ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="淡色地図（ハザード推奨）"
            >
              淡色
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode('standard')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center cursor-pointer ${
                baseMapMode === 'standard'
                  ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="標準地図"
            >
              標準
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode('satellite')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center cursor-pointer ${
                baseMapMode === 'satellite'
                  ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="航空写真（シームレス写真）"
            >
              航空写真
            </button>
          </div>

          {/* Japan Area Focus Mask Toggle */}
          <button
            type="button"
            onClick={() => setFocusJapan(!focusJapan)}
            className={`w-full mt-1.5 px-2 py-1 text-[10.5px] font-semibold rounded transition-all flex items-center justify-between border cursor-pointer ${
              focusJapan
                ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border-[#1B4F8A]/30 font-bold'
                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="日本国外エリアを減光し、国内を鮮明に強調します"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[12px] leading-none">🗾</span>
              <span>日本強調</span>
            </span>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded leading-none ${
              focusJapan ? 'bg-[#1B4F8A] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {focusJapan ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="w-full h-px bg-slate-200/80 dark:bg-slate-800" />

        {/* Hazard Layers or Zoning Controls */}
        {mapMode === 'hazard' ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1 py-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">災害レイヤー</span>
              <button 
                type="button"
                onClick={() => {
                  if (isAllOff) {
                    setHazardState({ flood: true, landslide: true, tsunami: true, stormSurge: true, shelter: true });
                  } else {
                    setHazardState({ flood: false, landslide: false, tsunami: false, stormSurge: false, shelter: false });
                  }
                }}
                className="text-[10px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isAllOff ? '全表示' : '全解除'}
              </button>
            </div>

            {layers.map(({ key, label, dotColor }) => {
              const isActive = (hazardState as any)[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHazardState((prev: any) => ({ ...prev, [key]: !isActive }))}
                  className={`px-2 py-1 text-[11px] font-medium rounded flex items-center justify-between transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-slate-100 dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? dotColor : 'bg-slate-300 dark:bg-slate-600'}`} />
                    {label}
                  </span>
                  <span className="text-[10px] tabular-nums font-mono opacity-80">
                    {isActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}

            <button 
              type="button"
              onClick={() => setShowLegends(!showLegends)}
              className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-center py-1 border-t border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
            >
              {showLegends ? '凡例を閉じる ▲' : '凡例を表示 ▼'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">都市計画レイヤー</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono font-bold tabular-nums">{zoningOpacity}%</span>
            </div>
            <div className="px-1">
              <div className="text-[10px] text-slate-500 mb-1">透過度</div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="10" 
                value={zoningOpacity} 
                onChange={(e) => setZoningOpacity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1B4F8A]"
              />
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Legends Container */}
      {showLegends && mapMode === 'hazard' && (
        <div className={`bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md rounded-lg p-3 w-48 text-xs flex-col gap-3 animate-in fade-in slide-in-from-top-1 max-h-[50vh] overflow-y-auto ${
          isOpenMobile ? 'flex' : 'hidden lg:flex'
        }`}>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">浸水想定区域（洪水）</div>
            <div className="flex flex-col gap-1">
              {floodLegend.map((item, idx) => (
                <div key={`flood-${idx}`} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">土砂災害警戒区域</div>
            <div className="flex flex-col gap-1">
              {landslideLegend.map((item, idx) => (
                <div key={`land-${idx}`} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// Click event catcher for Map
function MapClickMarker({ 
  onLocationSelected 
}: { 
  onLocationSelected: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToCoords({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) {
      map.flyTo(point, 16, { duration: 1.2 });
    }
  }, [point, map]);
  return null;
}

export default function HazardMapTool({
  externalPoint,
  flyPoint,
  mapMode = 'hazard',
  setMapMode,
  initialCenter,
  initialZoom = 5,
  onLocationSelected,
  regionName = '全国',
  selectedAddressTitle = ''
}: {
  externalPoint: [number, number] | null;
  flyPoint?: [number, number] | null;
  mapMode?: 'hazard' | 'zoning';
  setMapMode?: (mode: 'hazard' | 'zoning') => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  onLocationSelected?: (lat: number, lng: number, title?: string) => void;
  regionName?: string;
  selectedAddressTitle?: string;
}) {
  // Address name for selected coordinate
  const [currentAddress, setCurrentAddress] = useState<string>(selectedAddressTitle || '');

  useEffect(() => {
    if (selectedAddressTitle) {
      setCurrentAddress(selectedAddressTitle);
    }
  }, [selectedAddressTitle]);

  // Base map mode: 'pale' (Recommended default for hazard layers), 'standard', or 'satellite'
  const [baseMapMode, setBaseMapMode] = useState<BaseMapMode>('pale');
  // Japan area highlight mask (dimming exterior countries)
  const [focusJapan, setFocusJapan] = useState<boolean>(true);

  // Active panel tab ('hazard' or 'zoning')
  const [activeTab, setActiveTab] = useState<'hazard' | 'zoning'>(mapMode);

  useEffect(() => {
    setActiveTab(mapMode);
  }, [mapMode]);

  // Hazard overlays state
  const [layers, setLayers] = useState({
    flood: true,
    landslide: true,
    tsunami: false,
    stormSurge: false,
    shelter: true
  });

  const [activePoint, setActivePoint] = useState<[number, number] | null>(null);
  const [isReportCollapsed, setIsReportCollapsed] = useState<boolean>(false);
  const [zoningOpacity, setZoningOpacity] = useState<number>(40);

  // Google Street View 360° modal state
  const [streetViewTarget, setStreetViewTarget] = useState<{
    lat: number;
    lng: number;
    title: string;
    address?: string;
  } | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (externalPoint) {
      setActivePoint(externalPoint);
      setIsReportCollapsed(false);
    }
  }, [externalPoint]);

  const targetIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute inline-flex h-10 w-10 rounded-full bg-red-500/20"></div>
             <div class="relative inline-flex flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow-md bg-red-600 text-white z-50">
               <span class="text-base">📍</span>
             </div>
           </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  }), []);

  // Fetch Hazard Info when activePoint is set
  const { data: hazardInfo, isLoading: isHazardLoading } = useSWR(
    activePoint ? `/api/hazard-check?lat=${activePoint[0].toFixed(4)}&lng=${activePoint[1].toFixed(4)}` : null,
    fetcher,
    { dedupingInterval: 300000, revalidateOnFocus: false }
  );

  // Fetch Zoning Info when activePoint is set
  const { data: zoningInfo, isLoading: isZoningLoading } = useSWR(
    activePoint ? `/api/zoning-check?lat=${activePoint[0].toFixed(4)}&lng=${activePoint[1].toFixed(4)}` : null,
    fetcher,
    { dedupingInterval: 300000, revalidateOnFocus: false }
  );

  const handlePointSelect = (lat: number, lng: number) => {
    setActivePoint([lat, lng]);
    setIsReportCollapsed(false);
    setCurrentAddress(''); // Clicked on custom coordinate
    if (onLocationSelected) {
      onLocationSelected(lat, lng);
    }
  };

  const centerCoords = initialCenter || [36.0, 137.0];

  const handleOpenStreetView = () => {
    if (!activePoint) return;
    setStreetViewTarget({
      lat: activePoint[0],
      lng: activePoint[1],
      title: currentAddress || `解析地点: 北緯 ${activePoint[0].toFixed(4)}°, 東経 ${activePoint[1].toFixed(4)}°`,
      address: currentAddress || (zoningInfo?.land_use ? `${zoningInfo.land_use}（${zoningInfo.plan_zone || '都市計画区域'}）` : undefined),
    });
  };

  return (
    <div className="w-full h-full relative">
      <style>{`
        .leaflet-tile-pane {
          filter: saturate(1.15) contrast(1.05);
        }
      `}</style>

      <MapContainer 
        center={centerCoords} 
        zoom={initialZoom} 
        maxZoom={18}
        minZoom={5}
        maxBounds={JAPAN_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="w-full h-full relative z-0"
      >
        <MapResizeObserver />
        <MapInitialBoundsHandler 
          externalPoint={externalPoint} 
          flyPoint={flyPoint} 
          initialCenter={initialCenter} 
          initialZoom={initialZoom} 
        />
        <CustomMapControls />
        <MapRegionalQuickJumps />
        <UnifiedMapLayerPanel 
          baseMapMode={baseMapMode}
          setBaseMapMode={setBaseMapMode}
          focusJapan={focusJapan}
          setFocusJapan={setFocusJapan}
          mapMode={mapMode}
          hazardState={layers}
          setHazardState={setLayers}
          zoningOpacity={zoningOpacity}
          setZoningOpacity={setZoningOpacity}
        />
        <MapClickMarker onLocationSelected={handlePointSelect} />
        <FlyToCoords point={externalPoint || flyPoint || null} />

        {/* Dynamic Base Map Layers */}
        {baseMapMode === 'standard' && (
          <TileLayer 
            url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png" 
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院 (標準地図)</a>' 
            maxZoom={18}
          />
        )}
        {baseMapMode === 'satellite' && (
          <TileLayer 
            url="https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg" 
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院 (航空写真)</a>' 
            maxZoom={18}
          />
        )}
        {baseMapMode === 'pale' && (
          <TileLayer 
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png" 
            attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院 (淡色地図)</a>' 
            maxZoom={18}
          />
        )}

        {/* Japan Focus Mask: Dim exterior areas (China, Russia, Korea) while keeping Japan 100% vibrant */}
        {focusJapan && (
          <GeoJSON 
            key={`japan-mask-${baseMapMode}`}
            data={japanMaskData as any}
            style={() => ({
              fillColor: baseMapMode === 'satellite' ? '#090D16' : '#F1F5F9',
              fillOpacity: baseMapMode === 'satellite' ? 0.6 : 0.75,
              color: baseMapMode === 'satellite' ? '#60A5FA' : '#1B4F8A',
              weight: 1.2,
              opacity: 0.35,
              interactive: false,
            })}
          />
        )}

        {/* Highlighted Polygon for Zoning Map */}
        {mapMode === 'zoning' && zoningInfo?.feature && (
           <GeoJSON 
             key={`zoning-layer-${zoningInfo.feature.properties?.use_area_ja || "default"}-${zoningOpacity}`}
             data={zoningInfo.feature} 
             style={() => {
               const useType = zoningInfo.feature?.properties?.use_area_ja || "未指定";
               const color = ZONING_COLORS[useType] || "#94a3b8";
               return {
                 color: color,
                 weight: 2,
                 fillOpacity: zoningOpacity / 100,
                 fillColor: color,
                 opacity: 0.8
               };
             }} 
           />
        )}

        {/* Hazard Mapped Layers directly to GSI Disaportal */}
        {mapMode === 'hazard' && layers.flood && (
          <TileLayer url="https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png" opacity={0.65} maxNativeZoom={17} maxZoom={18} zIndex={500} keepBuffer={2} />
        )}
        {mapMode === 'hazard' && layers.landslide && (
          <TileLayer url="https://disaportaldata.gsi.go.jp/raster/05_dosyakikennet_data/{z}/{x}/{y}.png" opacity={0.65} maxNativeZoom={17} maxZoom={18} zIndex={500} keepBuffer={2} />
        )}
        {mapMode === 'hazard' && layers.tsunami && (
          <TileLayer url="https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlevel_data/{z}/{x}/{y}.png" opacity={0.65} maxNativeZoom={17} maxZoom={18} zIndex={500} keepBuffer={2} />
        )}
        {mapMode === 'hazard' && layers.stormSurge && (
          <TileLayer url="https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png" opacity={0.65} maxNativeZoom={17} maxZoom={18} zIndex={500} keepBuffer={2} />
        )}

        {/* Active Analysis Pin Point */}
        {activePoint && (
          <Marker 
            position={activePoint} 
            icon={targetIcon} 
            zIndexOffset={2000}
          />
        )}
      </MapContainer>

      {/* Floating Guidance Tip when no location is selected */}
      {!activePoint && (
        <div className="absolute top-14 left-4 z-[1000] pointer-events-auto bg-white/95 dark:bg-[#151B22]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-md rounded-xl p-3 max-w-sm hidden sm:flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in select-none">
          <span className="text-xl shrink-0">📍</span>
          <div>
            <span className="text-slate-900 dark:text-slate-100 font-bold block text-[12px]">地点診断ツール（災害・都市計画）</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              地図上をクリック、または上部検索バーに住所を入力して、その地点の自然災害リスクと都市計画情報を一括解析します。
            </span>
          </div>
        </div>
      )}

      {/* Comprehensive Due Diligence Analysis Report Card (Bảng Báo Cáo Thẩm Định Địa Điểm) */}
      {activePoint && (
        <div 
          className={`fixed md:absolute inset-x-0 bottom-0 md:bottom-auto md:top-14 md:left-4 z-[1000] w-full md:w-[380px] md:max-w-[calc(100vw-32px)] bg-white/98 dark:bg-[#151B22]/98 backdrop-blur-md border-t md:border border-slate-200/90 dark:border-slate-800 shadow-lg rounded-t-2xl md:rounded-xl p-3.5 flex flex-col gap-3 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-left-2 transition-all duration-200 ${
            isReportCollapsed 
              ? 'max-h-[64px] overflow-hidden' 
              : 'max-h-[55vh] md:max-h-[calc(100vh-130px)] overflow-y-auto'
          }`}
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Bottom Sheet Pull Handle */}
          <div 
            className="md:hidden flex items-center justify-center -mt-1 pb-1 cursor-pointer"
            onClick={() => setIsReportCollapsed((v) => !v)}
            title={isReportCollapsed ? "レポートを展開" : "レポートを折りたたむ"}
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Card Header: Title & Close/Collapse Buttons */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div 
              className="cursor-pointer md:cursor-default flex-1 min-w-0 pr-2"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsReportCollapsed((v) => !v);
                }
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                  地点総合診断レポート
                </h3>
                {isReportCollapsed && (
                  <span className="md:hidden text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    展開
                  </span>
                )}
              </div>
              {currentAddress && (
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-[240px] sm:max-w-[260px]">
                  📍 {currentAddress}
                </div>
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                北緯 {activePoint[0].toFixed(4)}° / 東経 {activePoint[1].toFixed(4)}°
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile Collapse / Expand Button */}
              <button
                type="button"
                onClick={() => setIsReportCollapsed((v) => !v)}
                className="md:hidden w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={isReportCollapsed ? "レポートを展開する" : "レポートを折りたたむ"}
                aria-label={isReportCollapsed ? "レポートを展開する" : "レポートを折りたたむ"}
              >
                {isReportCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setActivePoint(null);
                  setIsReportCollapsed(false);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="レポートを閉じる"
                aria-label="レポートを閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`flex flex-col gap-3 ${isReportCollapsed ? 'hidden md:flex' : 'flex'}`}>

          {/* Sub-Tabs: 災害リスク vs 都市計画 */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('hazard');
                if (setMapMode) setMapMode('hazard');
              }}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'hazard'
                  ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-blue-500" />
              <span>自然災害リスク</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('zoning');
                if (setMapMode) setMapMode('zoning');
              }}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'zoning'
                  ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-[#1B4F8A]" />
              <span>都市計画・用途地域</span>
            </button>
          </div>

          {/* TAB 1: NATURAL HAZARD DETAILS */}
          {activeTab === 'hazard' && (
            <div className="flex flex-col gap-2.5">
              {isHazardLoading ? (
                <div className="flex flex-col gap-2 py-3 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                  <span className="text-xs text-slate-400 mt-1">国土交通省ハザードデータを照会中...</span>
                </div>
              ) : hazardInfo ? (
                <div className="flex flex-col gap-2 text-xs">
                  {/* 洪水 */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        洪水浸水想定
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hazardInfo.flood === '危険なし' || hazardInfo.flood?.includes('想定区域外')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {hazardInfo.flood === '危険なし' ? '想定区域外（安全）' : '浸水想定あり'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 font-medium">
                      {hazardInfo.flood}
                    </p>
                  </div>

                  {/* 土砂災害 */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        土砂災害警戒区域
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hazardInfo.landslide === '危険なし' || hazardInfo.landslide?.includes('警戒区域外')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {hazardInfo.landslide === '危険なし' ? '警戒区域外（安全）' : '土砂警戒区域'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 font-medium">
                      {hazardInfo.landslide}
                    </p>
                  </div>

                  {/* 津波 & 高潮 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">津波浸水想定</span>
                      <span className={`text-[11px] font-bold ${hazardInfo.tsunami === '危険なし' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {hazardInfo.tsunami}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">高潮浸水想定</span>
                      <span className={`text-[11px] font-bold ${hazardInfo.storm_surge === '危険なし' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                        {hazardInfo.storm_surge}
                      </span>
                    </div>
                  </div>

                  {/* 指定緊急避難場所 */}
                  <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5 flex items-center gap-1">
                      <span>🏃‍♂️</span> 最寄りの指定緊急避難場所
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {hazardInfo.shelter}
                    </p>
                  </div>

                  <span className="text-[9.5px] text-slate-400 text-right">
                    出典：国土交通省・国土地理院 重ねるハザードマップ
                  </span>
                </div>
              ) : (
                <div className="text-xs text-rose-500 py-2">
                  ハザード情報の取得に失敗しました。
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ZONING & URBAN PLANNING DETAILS */}
          {activeTab === 'zoning' && (
            <div className="flex flex-col gap-2.5">
              {isZoningLoading ? (
                <div className="flex flex-col gap-2 py-3 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                  <span className="text-xs text-slate-400 mt-1">国土交通省 都市計画API照会中...</span>
                </div>
              ) : zoningInfo ? (
                <div className="flex flex-col gap-2 text-xs">
                  {/* 都市計画区分 */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">都市計画区域区分</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {zoningInfo.plan_zone}
                    </span>
                  </div>

                  {/* 用途地域 */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">用途地域（13分類）</span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-sm border border-black/10 shrink-0" 
                        style={{ backgroundColor: ZONING_COLORS[zoningInfo.land_use] || '#94a3b8' }}
                      />
                      <span 
                        className="font-bold text-sm"
                        style={{ color: ZONING_COLORS[zoningInfo.land_use] || (zoningInfo.land_use?.includes('未指定') ? '#94a3b8' : '#1B4F8A') }}
                      >
                        {zoningInfo.land_use}
                      </span>
                    </div>
                  </div>

                  {/* 建蔽率 & 容積率 */}
                  <div className="grid grid-cols-2 gap-2 bg-blue-50/40 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">指定建蔽率</span>
                      <span className="font-bold text-base text-[#1B4F8A] dark:text-blue-300 tabular-nums">
                        {zoningInfo.coverage}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">指定容積率</span>
                      <span className="font-bold text-base text-[#1B4F8A] dark:text-blue-300 tabular-nums">
                        {zoningInfo.far}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9.5px] text-slate-400 text-right">
                    出典：国土交通省 不動産情報ライブラリ
                  </span>
                </div>
              ) : (
                <div className="text-xs text-rose-500 py-2">
                  都市計画情報の取得に失敗しました。
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Street View 360° & Search Properties on /map */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleOpenStreetView}
              className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
              title="Google Street View 360°で現地の接道・街並みを確認"
            >
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>360°現地ストリートビューを確認</span>
            </button>

            <a
              href={`/map?keyword=${encodeURIComponent(currentAddress || (regionName !== '全国' ? regionName : ''))}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
              title="この周辺の競売・公売物件をマップ検索で探す"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>この周辺の競売・公売物件をマップで探す →</span>
            </a>
          </div>

          </div>

        </div>
      )}

      {/* Google Street View 360° Modal */}
      {streetViewTarget && (
        <StreetViewModal 
          isOpen={Boolean(streetViewTarget)}
          onClose={() => setStreetViewTarget(null)}
          lat={streetViewTarget.lat}
          lng={streetViewTarget.lng}
          title={streetViewTarget.title}
          address={streetViewTarget.address}
        />
      )}
    </div>
  );
}
