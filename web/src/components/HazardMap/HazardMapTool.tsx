'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSWR from 'swr';

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

const fetcher = (url: string) => fetch(url).then(res => res.json());

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

function CustomMapControls() {
  const map = useMap();
  const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); map.zoomIn(); };
  const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); map.zoomOut(); };
  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 14, { duration: 1.5 });
    });
  };

  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  return (
    <div 
      ref={controlRef}
      className="absolute lg:bottom-[40px] lg:right-6 bottom-20 right-4 z-[1000] flex flex-col gap-3 pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button onClick={handleLocate} className="w-10 h-10 bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center text-lg text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:scale-95" title="現在地">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </button>
      <div className="flex flex-col bg-white/95 backdrop-blur-md border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full overflow-hidden">
        <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center text-xl text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:bg-zinc-100 font-medium border-b border-gray-200" title="ズームイン">+</button>
        <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center text-2xl text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:bg-zinc-100 font-medium pb-0.5" title="ズームアウト">−</button>
      </div>
    </div>
  );
}

// 5 Hazard Controls (Japanese)
function HazardControls({ 
  state, setState 
}: { 
  state: any; 
  setState: any;
}) {
  const [showLegends, setShowLegends] = useState(true);
  const isAllOff = !state.flood && !state.landslide && !state.tsunami && !state.stormSurge && !state.shelter;
  
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

  const tsunamiLegend = [
    { color: '#f7f5a9', label: '0.3m未満' },
    { color: '#ffd3a3', label: '0.3m 〜 1.0m未満' },
    { color: '#ff9999', label: '1.0m 〜 3.0m未満' },
    { color: '#ff5050', label: '3.0m 〜 5.0m未満' },
    { color: '#b30000', label: '5.0m 〜 10.0m未満' },
    { color: '#cc00cc', label: '10.0m以上' }
  ];
  
  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  return (
    <div 
      ref={controlRef}
      className="absolute top-[80px] lg:top-4 right-4 lg:right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
    >
      <div className="bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg rounded-lg overflow-hidden p-[2px] flex flex-col transition-all gap-[1px] w-[76px]">
        <button 
          onClick={() => {
            if (isAllOff) {
              setState({ flood: true, landslide: true, tsunami: true, stormSurge: true, shelter: true });
            } else {
              setState({ flood: false, landslide: false, tsunami: false, stormSurge: false, shelter: false });
            }
          }}
          className={`px-0 py-1 text-[9px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 ${isAllOff ? 'bg-zinc-800 text-white shadow-sm hover:bg-zinc-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} w-full text-center hover:scale-[0.98] active:scale-95`}
          title={isAllOff ? "すべて表示" : "すべて非表示"}
        >
          {isAllOff ? 'ON全て' : 'OFF全て'}
        </button>
        
        <div className="w-full h-[1px] bg-zinc-200 my-[1px]" />

        <button onClick={() => setState({...state, flood: !state.flood})} className={`px-1 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${state.flood ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} w-full`}>
          <span className={`text-[11px] leading-none flex-shrink-0 ${!state.flood && 'grayscale opacity-70'}`}>🌊</span> 洪水
        </button>
        <button onClick={() => setState({...state, landslide: !state.landslide})} className={`px-1 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${state.landslide ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-700' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} w-full`}>
          <span className={`text-[11px] leading-none flex-shrink-0 ${!state.landslide && 'grayscale opacity-70'}`}>⛰️</span> 土砂災害
        </button>
        <button onClick={() => setState({...state, tsunami: !state.tsunami})} className={`px-1 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${state.tsunami ? 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-700' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} w-full`}>
          <span className={`text-[11px] leading-none flex-shrink-0 ${!state.tsunami && 'grayscale opacity-70'}`}>🌊</span> 津波
        </button>
        <button onClick={() => setState({...state, stormSurge: !state.stormSurge})} className={`px-1 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${state.stormSurge ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} w-full`}>
          <span className={`text-[11px] leading-none flex-shrink-0 ${!state.stormSurge && 'grayscale opacity-70'}`}>🌀</span> 高潮
        </button>
        <div className="w-full h-[1px] bg-zinc-200 my-[1px]" />
        <button onClick={() => setState({...state, shelter: !state.shelter})} className={`px-1 py-1 text-[10px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${state.shelter ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} w-full`}>
          <span className={`text-[11px] leading-none flex-shrink-0 ${!state.shelter && 'grayscale opacity-70'}`}>🏃‍♂️</span> 避難所
        </button>
      </div>

      {/* Dynamic Legends Toggle Button */}
      {!isAllOff && (
        <button 
          onClick={() => setShowLegends(!showLegends)}
          className="bg-white/90 backdrop-blur-md border border-zinc-200 shadow-md rounded-[4px] py-1.5 text-[9px] font-bold text-zinc-600 hover:bg-zinc-50 flex items-center justify-center mt-1 transition-all w-[76px]"
          title="凡例の表示/非表示"
        >
          {showLegends ? '凡例を隠す ▲' : '凡例を表示 ▼'}
        </button>
      )}

      {/* Dynamic Legends Container */}
      <div className={`flex flex-col gap-2 mt-1 overflow-y-auto no-scrollbar pointer-events-auto transition-all origin-top ${showLegends ? 'max-h-[40vh] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-0'}`}>
        {state.flood && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="font-bold text-zinc-800 mb-2 border-b pb-1">浸水想定区域 (洪水)</div>
            <div className="flex flex-col gap-1.5">
              {floodLegend.map((item, idx) => (
                <div key={`flood-${idx}`} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-zinc-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.landslide && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="font-bold text-zinc-800 mb-2 border-b pb-1">土砂災害警戒区域</div>
            <div className="flex flex-col gap-1.5">
              {landslideLegend.map((item, idx) => (
                <div key={`land-${idx}`} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-zinc-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.tsunami && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="font-bold text-zinc-800 mb-2 border-b pb-1">津波浸水想定</div>
            <div className="flex flex-col gap-1.5">
              {tsunamiLegend.map((item, idx) => (
                <div key={`tsunami-${idx}`} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-zinc-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.stormSurge && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="font-bold text-zinc-800 mb-2 border-b pb-1">高潮浸水想定区域</div>
            <div className="flex flex-col gap-1.5">
              {floodLegend.map((item, idx) => (
                <div key={`storm-${idx}`} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-zinc-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.shelter && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="font-bold text-zinc-800 mb-2 border-b pb-1">指定緊急避難場所</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">🏃‍♂️</span>
              <span className="text-zinc-600 font-medium">各市町村が指定する避難所</span>
            </div>
          </div>
        )}
      </div>
    </div>
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
      map.flyTo(point, 17, { duration: 1.5 });
    }
  }, [point, map]);
  return null;
}

// Controls for Zoning Mode
function ZoningControls({ opacity, setOpacity }: { opacity: number, setOpacity: (v: number) => void }) {
  const controlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  return (
    <div 
      ref={controlRef}
      className="absolute top-[80px] lg:top-4 right-4 lg:right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
    >
      <div className="bg-white/95 backdrop-blur-md border border-zinc-200 shadow-lg rounded-[8px] p-3 flex flex-col gap-2 w-[160px]">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-700">濃さ (Opacity)</span>
            <span className="text-[10px] bg-zinc-100 px-1.5 rounded text-zinc-600 font-mono font-bold">{opacity}%</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="100" 
          step="10" 
          value={opacity} 
          onChange={(e) => setOpacity(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}

export default function HazardMapTool({
  externalPoint,
  flyPoint,
  mapMode = 'hazard'
}: {
  externalPoint: [number, number] | null;
  flyPoint?: [number, number] | null;
  mapMode?: 'hazard' | 'zoning';
}) {
  const [layers, setLayers] = useState({
    flood: true,
    landslide: true,
    tsunami: true,
    stormSurge: true,
    shelter: true
  });

  const [activePoint, setActivePoint] = useState<[number, number] | null>(null);
  const [zoningOpacity, setZoningOpacity] = useState<number>(40);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (externalPoint) {
      setActivePoint(externalPoint);
    }
  }, [externalPoint]);

  const targetIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-50 animate-ping"></div>
             <div class="relative inline-flex flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-xl bg-red-600 z-50">
               <span class="text-lg">📍</span>
             </div>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  }), []);

  const { data: hazardInfo, isLoading: isHazardLoading } = useSWR(
    activePoint && mapMode === 'hazard' ? `/api/hazard-check?lat=${activePoint[0]}&lng=${activePoint[1]}` : null,
    fetcher,
    { dedupingInterval: 300000, revalidateOnFocus: false }
  );

  const { data: zoningInfo, isLoading: isZoningLoading } = useSWR(
    activePoint && mapMode === 'zoning' ? `/api/zoning-check?lat=${activePoint[0]}&lng=${activePoint[1]}` : null,
    fetcher,
    { dedupingInterval: 300000, revalidateOnFocus: false }
  );

  return (
    <>
      <style>{`
        .leaflet-tile-pane {
          filter: saturate(1.2) contrast(1.05); 
        }
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .leaflet-control-zoom,
          .leaflet-control-attribution,
          .map-resize-observer {
            display: none !important;
          }
          .leaflet-container {
            width: 100% !important;
            height: 100% !important;
            max-height: 85vh !important;
          }
          /* Hide UI overlay buttons when printing */
          .pointer-events-auto button {
             display: none !important;
          }
        }
      `}</style>
      <div className="w-full h-full relative print:h-[80vh] print:w-full print:border print:border-zinc-300">
        <MapContainer 
          center={[35.681236, 139.767125]} // Default Tokyo
          zoom={13} 
          maxZoom={18}
          minZoom={5}
          maxBounds={[[20.0, 122.0], [46.0, 154.0]]}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          className="w-full h-full relative z-0"
        >
          <MapResizeObserver />
          <CustomMapControls />
          {mapMode === 'hazard' && <HazardControls state={layers} setState={setLayers} />}
          {mapMode === 'zoning' && <ZoningControls opacity={zoningOpacity} setOpacity={setZoningOpacity} />}
          <MapClickMarker onLocationSelected={(lat, lng) => setActivePoint([lat, lng])} />
          <FlyToCoords point={externalPoint || flyPoint || null} />

          {/* Base Map */}
          <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>' 
              maxZoom={18}
          />

          {/* Single Highlighted Polygon for Zoning Map */}
          {mapMode === 'zoning' && zoningInfo?.feature && (
             <GeoJSON 
               key={`zoning-layer-${zoningInfo.feature.properties?.use_area_ja || "default"}-${zoningOpacity}`}
               data={zoningInfo.feature} 
               style={() => {
                 const useType = zoningInfo.feature?.properties?.use_area_ja || "未指定";
                 const color = ZONING_COLORS[useType] || "#9e9e9e";
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

          {activePoint && (
            <Marker 
              position={activePoint} 
              icon={targetIcon} 
              zIndexOffset={2000}
              ref={(r: any) => { r && r.openPopup(); }}
            >
              <Popup autoPan={true} closeButton={true} className="hazard-popup w-[260px] p-0 font-sans">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm m-[-14px]">
                  <div className={`w-full text-white p-2 ${mapMode === 'hazard' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    <h3 className="font-bold text-[13px] flex items-center gap-1.5 leading-tight">
                      <span className="text-sm">📍</span> 解析結果 ({mapMode === 'hazard' ? 'Hazard Data' : 'Zoning Data'})
                    </h3>
                  </div>
                  
                  <div className="p-3">
                    {(mapMode === 'hazard' ? isHazardLoading : isZoningLoading) ? (
                      <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-4 bg-zinc-200 rounded w-full"></div>
                        <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
                        <div className="h-4 bg-zinc-200 rounded w-4/6"></div>
                        <div className="mt-2 text-xs text-zinc-500 font-bold">データ取得中...</div>
                      </div>
                    ) : mapMode === 'hazard' && hazardInfo ? (
                      <div className="flex flex-col gap-2 text-[12px]">
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">🌊</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">洪水 (Flood)</span>
                            <span className={`font-bold block mt-0.5 ${hazardInfo.flood === '危険なし' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {hazardInfo.flood}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">⛰️</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">土砂災害 (Landslide)</span>
                            <span className={`font-bold block mt-0.5 ${hazardInfo.landslide === '危険なし' ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {hazardInfo.landslide}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">🌊</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">津波 (Tsunami)</span>
                            <span className={`font-bold block mt-0.5 ${hazardInfo.tsunami === '危険なし' ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {hazardInfo.tsunami}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">🌀</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">高潮 (Storm Surge)</span>
                            <span className={`font-bold block mt-0.5 ${hazardInfo.storm_surge === '危険なし' ? 'text-emerald-600' : 'text-purple-600'}`}>
                              {hazardInfo.storm_surge}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-px bg-zinc-100 my-1" />
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">🏕</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">指定避難所</span>
                            <span className="font-bold text-emerald-700 block mt-0.5">{hazardInfo.shelter}</span>
                          </div>
                        </div>
                        <div className="w-full text-right mt-2">
                           <span className="text-[9px] text-zinc-400">
                             出典：<a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">国土交通省地価公示</a>
                           </span>
                        </div>
                      </div>
                    ) : mapMode === 'zoning' && zoningInfo ? (
                      <div className="flex flex-col gap-2 text-[12px]">
                        <div className="flex items-start gap-1">
                          <span className="shrink-0 text-base leading-none">📍</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">都市計画区域 (City Planning)</span>
                            <span className="font-bold text-zinc-800 block mt-0.5">{zoningInfo.plan_zone}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-1 mt-1">
                          <span className="shrink-0 text-base leading-none">🏢</span>
                          <div className="flex-1">
                            <span className="text-zinc-500 font-semibold block text-[10px]">用途地域 (Land Use)</span>
                            <span 
                              className="font-bold block mt-0.5"
                              style={{ color: ZONING_COLORS[zoningInfo.land_use] || (zoningInfo.land_use.includes('未指定') ? '#71717a' : '#2563eb') }}
                            >
                              {zoningInfo.land_use}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 mt-1 bg-zinc-50 p-2 rounded border border-zinc-100">
                          <div className="flex-1">
                            <span className="text-zinc-400 font-medium block text-[9px]">建蔽率 (Coverage)</span>
                            <span className="font-bold text-zinc-700 block mt-0.5">{zoningInfo.coverage}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-zinc-400 font-medium block text-[9px]">容積率 (FAR)</span>
                            <span className="font-bold text-zinc-700 block mt-0.5">{zoningInfo.far}</span>
                          </div>
                        </div>
                        <div className="w-full text-right mt-2">
                           <span className="text-[9px] text-zinc-400">
                             出典：<a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">国土交通省地価公示</a>
                           </span>
                        </div>
                      </div>
                    ) : (
                       <div className="text-xs text-red-500 font-bold py-2">
                          データの取得に失敗しました。
                       </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </>
  );
}
