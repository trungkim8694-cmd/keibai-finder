'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import japanMaskData from '../data/japanMask.json';
import { getNearestStationInfo } from '../actions/propertyActions';
import type { BoundingBox } from '../actions/propertyActions';
import type { KeibaiMapProps } from './KeibaiMap';
import { getPropertyTypeColor } from '../types';
import { AsyncStationInfo } from './AsyncStationInfo';
import { PropertyInfoTags } from './PropertyInfoTags';
import { CourtContactLink } from './CourtContactLink';
import FavoriteButton from './FavoriteButton';
import { resolvePropertyAiAnalysis } from '../lib/aiRiskExtractor';
import { getSourceProviderMeta, isPublicAuctionProvider } from '../lib/sourceProviderConfig';
import { extractTotalArea, cleanAddress } from '../lib/utils';
import { createPricePillIcon, createClusterCustomIcon, syncHoveredMarkerDOM, formatMarkerPrice } from './MapPriceMarker';
import { MapLayerControl, BaseMapMode } from './MapLayerControl';
import { StreetViewModal } from './StreetViewModal';
import { Compass } from 'lucide-react';

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

function MapEventHandler({
  onBoundsChanged,
  programmaticMoveRef
}: {
  onBoundsChanged?: (bounds: BoundingBox) => void;
  programmaticMoveRef: React.MutableRefObject<boolean>;
}) {
  const userInteractedRef = useRef(false);

  const map = useMapEvents({
    dragstart: () => {
      if (!programmaticMoveRef.current) {
        userInteractedRef.current = true;
      }
    },
    zoomstart: () => {
      if (!programmaticMoveRef.current) {
        userInteractedRef.current = true;
      }
    },
    moveend: () => {
      if (programmaticMoveRef.current) {
        programmaticMoveRef.current = false;
        userInteractedRef.current = false;
        return;
      }
      if (!userInteractedRef.current || !onBoundsChanged) return;
      userInteractedRef.current = false;
      const b = map.getBounds();
      onBoundsChanged({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    }
  });

  return null;
}

function MapResizeObserver({ programmaticMoveRef }: { programmaticMoveRef: React.MutableRefObject<boolean> }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => {
      programmaticMoveRef.current = true;
      map.invalidateSize({ animate: false });
      setTimeout(() => { programmaticMoveRef.current = false; }, 150);
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, programmaticMoveRef]);
  return null;
}

function MapBounds({
  properties,
  fingerprint,
  programmaticMoveRef
}: {
  properties: any[];
  fingerprint?: string;
  programmaticMoveRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const lastFittedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !properties || properties.length === 0) return;
    const currentFp = fingerprint || 'default';
    // Only fitBounds once per unique LOCATION fingerprint! Changing property type, price, or sort will NEVER move the map camera.
    if (lastFittedFingerprintRef.current === currentFp) return;

    const validBounds = properties.filter(p => p.lat && p.lng);
    if (validBounds.length === 0) return;

    const isInitialFit = lastFittedFingerprintRef.current === null;
    lastFittedFingerprintRef.current = currentFp;

    // Check if any location filter is active in the fingerprint
    let hasSpecificLocation = false;
    try {
      const parsed = JSON.parse(currentFp);
      hasSpecificLocation = Boolean(
        parsed.prefecture ||
        (parsed.prefectures && parsed.prefectures.length > 0) ||
        parsed.lineName ||
        parsed.stationName ||
        parsed.keyword ||
        parsed.lat
      );
    } catch {}

    programmaticMoveRef.current = true;

    if (!hasSpecificLocation) {
      // Nationwide default view: fits Japan cleanly within visible area without being covered by menus
      fitToNationwideJapan(map, !isInitialFit);
      setTimeout(() => {
        programmaticMoveRef.current = false;
      }, 900);
      return;
    }

    // Specific location filter active (prefecture, station, keyword)
    const bounds = L.latLngBounds(validBounds.map(p => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 15,
      animate: !isInitialFit,
      duration: 0.6
    });

    const timer = setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, [fingerprint, properties, map, programmaticMoveRef]);

  return null;
}

function DetailFitBounds({ target, properties }: { target: any, properties: any[] }) {
  const map = useMap();
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    if (!fitted && target && target.lat && target.lng) {
      const validNearbys = properties.filter(p => p.lat && p.lng);
      if (validNearbys.length > 0) {
        import('leaflet').then(L => {
          // Add the target and the top 3-5 closest valid properties
          const boundPoints = [[target.lat, target.lng] as [number, number]];
          validNearbys.slice(0, 5).forEach(p => {
             boundPoints.push([p.lat, p.lng] as [number, number]);
          });
          
          const bounds = L.latLngBounds(boundPoints);
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
          setFitted(true);
        });
      } else {
        map.setView([target.lat, target.lng], 16);
        setFitted(true);
      }
    }
  }, [map, target, properties, fitted]);

  return null;
}

function MapSync({ activeItemId, items, mode }: { activeItemId?: string | null, items: any[], mode: 'list' | 'detail' }) {
  const map = useMap();
  useEffect(() => {
    if (activeItemId) {
      const activeItem = items.find(p => p.sale_unit_id === activeItemId);
      if (activeItem && activeItem.lat && activeItem.lng) {
        const bounds = map.getBounds();
        const latLng = L.latLng(activeItem.lat, activeItem.lng);
        if (!bounds.pad(-0.1).contains(latLng) || mode === 'list') {
          map.panTo(latLng, { animate: true, duration: 0.5 });
        }
      }
    }
  }, [activeItemId, items, map, mode]);
  return null;
}

function MapHoverSync({ activeItemId }: { activeItemId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    syncHoveredMarkerDOM(map, activeItemId, null);
  }, [activeItemId, map]);
  return null;
}

function MapClickSync({
  clickedItemId,
  programmaticMoveRef
}: {
  clickedItemId?: string | null;
  programmaticMoveRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || !clickedItemId) return;
    let foundMarker: any = null;
    let clusterGroup: any = null;
    const targetId = String(clickedItemId);

    const traverseLayer = (layer: any) => {
      if (layer instanceof L.Marker && layer.options && layer.options.title) {
        if (String(layer.options.title) === targetId) {
           foundMarker = layer;
        }
      }
      if (layer.zoomToShowLayer) clusterGroup = layer;
      if (layer.getLayers) layer.getLayers().forEach(traverseLayer);
    };

    map.eachLayer(traverseLayer);

    if (foundMarker) {
      programmaticMoveRef.current = true;
      if (!foundMarker._map && clusterGroup) {
         clusterGroup.zoomToShowLayer(foundMarker, () => {
            if (foundMarker.openPopup) foundMarker.openPopup();
            setTimeout(() => { programmaticMoveRef.current = false; }, 300);
         });
      } else {
         const latLng = foundMarker.getLatLng();
         const currentZoom = map.getZoom();
         // Respect user's current zoom level if already zoomed in (>= 12); never forcibly zoom out to 11!
         if (currentZoom < 12) {
           map.setView(latLng, 13, { animate: true, duration: 0.5 });
         } else {
           map.panTo(latLng, { animate: true, duration: 0.4 });
         }
         if (foundMarker.openPopup) foundMarker.openPopup();
         setTimeout(() => { programmaticMoveRef.current = false; }, 600);
      }
    }
  }, [clickedItemId, map, programmaticMoveRef]);
  return null;
}

// Strictly restrict camera viewport to Japan's territory (Okinawa/Yonaguni to Hokkaido/Wakkanai)
const JAPAN_MAX_BOUNDS: [[number, number], [number, number]] = [
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
    paddingTopLeft: [65, 30],     // Clears top floating regional pill menu
    paddingBottomRight: [45, 30], // Clears bottom navigation & controls
    maxZoom: 5,                   // Strictly caps zoom at 5 so Japan fits inside 700px-900px viewport
    animate,
    duration: 0.8,
  });
}

function CustomMapControls() {
  const map = useMap();

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.zoomIn();
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.zoomOut();
  };

  const handleResetJapan = (e: React.MouseEvent) => {
    e.stopPropagation();
    fitToNationwideJapan(map, true);
  };

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.locate().on("locationfound", (e) => {
      const { lat, lng } = e.latlng;
      // If user's GPS/IP is inside Japan, fly to their exact position
      if (lat >= 20.0 && lat <= 46.5 && lng >= 120.0 && lng <= 154.0) {
        map.flyTo(e.latlng, 14, { duration: 1.5 });
      } else {
        // If user is accessing from outside Japan, keep them in Central Tokyo rather than flying abroad
        map.flyTo([35.6812, 139.7671], 13, { duration: 1.5 });
      }
    });
  };

  return (
    <div 
      className="absolute lg:bottom-[40px] lg:right-6 bottom-20 right-4 z-[1000] flex flex-col gap-2.5 pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      {/* Reset to Entire Japan View */}
      <button 
        onClick={handleResetJapan} 
        className="w-10 h-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1B4F8A] transition-all active:scale-95 cursor-pointer" 
        title="全国表示に戻す (日本全体を表示)"
      >
        <span className="text-sm">🗾</span>
      </button>

      {/* Location Button */}
      <button 
        onClick={handleLocate} 
        className="w-10 h-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center text-lg text-slate-700 hover:bg-slate-50 hover:text-[#1B4F8A] transition-all active:scale-95 cursor-pointer" 
        title="現在地 (日本国内)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-full overflow-hidden">
        <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center text-xl text-slate-700 hover:bg-slate-50 hover:text-[#1B4F8A] transition-all active:bg-slate-100 font-medium border-b border-slate-200 cursor-pointer" title="ズームイン">
          +
        </button>
        <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center text-2xl text-slate-700 hover:bg-slate-50 hover:text-[#1B4F8A] transition-all active:bg-slate-100 font-medium pb-0.5 cursor-pointer" title="ズームアウト">
          −
        </button>
      </div>
    </div>
  );
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

  return (
    <div
      className="absolute top-3.5 left-4 z-[1000] pointer-events-auto max-w-[calc(100%-140px)] sm:max-w-none"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/90 dark:border-zinc-700/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 pl-1 pr-1.5 shrink-0 flex items-center gap-1">
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
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200'
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

export default function KeibaiMapInner({
  mode,
  properties,
  centerProperty,
  nearbySold = [],
  nearestStations = [],
  hoveredPropertyId = null,
  clickedPropertyId = null,
  onMarkerClick,
  onMarkerHover,
  onBoundsChanged,
  center,
  filterFingerprint,
  mapMoved,
  onSearchAreaClick
}: KeibaiMapProps) {
  const router = useRouter();
  const [baseMapMode, setBaseMapMode] = useState<BaseMapMode>('pale');
  const [focusJapan, setFocusJapan] = useState<boolean>(true);
  const [showFlood, setShowFlood] = useState(false);
  const [showLandslide, setShowLandslide] = useState(false);
  const [showRailways, setShowRailways] = useState(true);
  const [streetViewTarget, setStreetViewTarget] = useState<{
    lat: number;
    lng: number;
    title: string;
    address: string;
  } | null>(null);
  const programmaticMoveRef = useRef(false);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const targetIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-50 animate-ping"></div>
             <div class="relative inline-flex flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-xl bg-red-500 z-50">
               <span class="text-lg">📍</span>
             </div>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  }), []);

  const soldIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="relative w-6 h-6 flex items-center justify-center rounded-full border border-white shadow-sm transition-all duration-300 bg-zinc-400">
             <span class="text-[10px] grayscale flex items-center justify-center mt-[-2px]">🏠</span>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }), []);

  const stationIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="flex flex-col items-center">
             <div class="bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white text-white z-40">
               🚇
             </div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }), []);

  const targetMarkerRef = useRef<any>(null);
  useEffect(() => {
    if (mode === 'detail' && targetMarkerRef.current) {
      targetMarkerRef.current.openPopup();
    }
  }, [mode]);

  // Determine initial center and zoom based on mode (Default to nationwide view with full archipelago visibility)
  let initCenter: [number, number] = [36.0, 137.0];
  let initZoom = 5;
  if (center) {
    initCenter = center;
  } else if (mode === 'detail' && centerProperty && centerProperty.lat) {
    initCenter = [centerProperty.lat, centerProperty.lng];
    initZoom = 16;
  }

  // Optimize marker list
  const activeMarkers = useMemo(() => {
    if (!properties || properties.length === 0) return null;
    const validProps = properties.filter((p: any) => p && p.lat && p.lng);
    return validProps.map((p: any) => (
           <Marker
             key={"active-" + p.sale_unit_id}
             position={[p.lat, p.lng]}
             icon={createPricePillIcon(p)}
             title={p.sale_unit_id}
             eventHandlers={{
               click: () => {
                 if (onMarkerClick) onMarkerClick(p.sale_unit_id);
               },
               mouseover: () => {
                 if (onMarkerHover) onMarkerHover(p.sale_unit_id);
               },
               mouseout: () => {
                 if (onMarkerHover) onMarkerHover(null);
               }
             }}
          >
           <Popup autoPan={true} autoPanPadding={[20, 20]} className="custom-property-popup">
              <div 
                onClick={() => window.open(`/property/${p.sale_unit_id}`, '_blank')}
                className="p-0 w-[250px] sm:w-[270px] cursor-pointer hover:opacity-[0.98] transition-opacity block group outline-none focus:outline-none bg-white dark:bg-[#151B22] rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                <div className="w-full h-[124px] bg-zinc-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden border-b border-zinc-200 dark:border-zinc-700 relative">
                    {p.thumbnailUrl ? (
                      <img 
                        src={p.thumbnailUrl} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/no-image.png';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt="Thumbnail" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                    )}

                   {/* Top Left Badges: Is New & Source Type (NTA / BIT) */}
                   <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start">
                     {p.created_at && (Date.now() - new Date(p.created_at).getTime() < 24 * 60 * 60 * 1000) && (
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs">
                         新着
                       </span>
                     )}
                     {(() => {
                       const meta = getSourceProviderMeta(p.source_provider);
                       return (
                         <div className={`${meta.badgeClass} text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs`}>
                           {meta.badgeText}
                         </div>
                       );
                     })()}
                   </div>

                   {/* Top Right: Favorite Button */}
                   <div 
                     onClick={(e) => e.stopPropagation()} 
                     className="absolute top-1.5 right-7 z-20 pointer-events-auto"
                   >
                     <FavoriteButton id={p.sale_unit_id} compact={true} />
                   </div>

                   {/* Bottom Right: Status */}
                   <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-xs">
                      {p.status === 'ACTIVE' ? '公開中' : p.status}
                   </div>
                </div>
                
                <div className="p-3 pt-2 flex flex-col gap-1.5">
                   <div className="flex justify-between items-start gap-1">
                     <div className="text-[10px] text-zinc-500 min-w-0" onClick={(e) => e.stopPropagation()}>
                       {isPublicAuctionProvider(p.source_provider) ? (() => {
                         const meta = getSourceProviderMeta(p.source_provider);
                         return (
                           <CourtContactLink 
                             courtName={p.managing_authority ? p.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : (p.court_name || meta.authorityFallback)} 
                             contactUrl={p.contact_url || p.source_url} 
                             theme={meta.linkTheme}
                           />
                         );
                       })() : (
                         <CourtContactLink courtName={p.court_name} contactUrl={p.contact_url} />
                       )}
                     </div>
                     {p.mlit_investment_gap !== null && p.mlit_investment_gap !== undefined && p.mlit_investment_gap > 0 && (
                       <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/60 tabular-nums">
                         市場比 {p.mlit_investment_gap.toFixed(0)}% 割安
                       </span>
                     )}
                   </div>

                  <h4 className="font-semibold text-[11px] lg:text-[10px] line-clamp-2 leading-snug text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors" title={cleanAddress(p.address, p.prefecture, p.city)}>
                    {cleanAddress(p.address, p.prefecture, p.city)}
                  </h4>
                  
                  <div className="w-full">
                    {(() => {
                      const dbArea = (p as any).area && (p as any).area > 0 ? (p as any).area : null;
                      const parsedArea = dbArea || extractTotalArea(p.raw_display_data);
                      const displayArea = parsedArea ? `${Math.round(parsedArea).toLocaleString('en-US')}m²` : null;
                      return <PropertyInfoTags property={p} displayArea={displayArea} showCourtTag={false} />;
                    })()}
                  </div>

                  {/* AI Complexity Quick Badge */}
                  {(() => {
                    const ai = resolvePropertyAiAnalysis(p);
                    const hasArrears = ai.metrics.arrears.amountYen > 0;
                    const isCaution = ai.complexityLevel === 'C' || ai.complexityLevel === 'D';

                    return (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums ${
                          isCaution
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60'
                            : hasArrears
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-zinc-700/60'
                        }`}>
                          調査難易度 {ai.complexityLevel}
                        </span>

                        {hasArrears && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 tabular-nums">
                            滞納約{Math.round(ai.metrics.arrears.amountYen / 10000)}万
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 pb-0.5 flex items-center justify-between gap-1">
                    <div className="shrink-0 overflow-hidden">
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 whitespace-nowrap">売却基準価額</p>
                      <p className="font-bold text-[13px] tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                         {p.starting_price ? (p.starting_price >= 10000 ? `${(p.starting_price / 10000).toLocaleString('ja-JP')}万円` : `¥${p.starting_price.toLocaleString('ja-JP')}`) : '未定'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStreetViewTarget({
                            lat: p.lat,
                            lng: p.lng,
                            title: p.starting_price ? `売却基準価額: ${formatMarkerPrice(p.starting_price)}` : '競売・公売物件',
                            address: cleanAddress(p.address, p.prefecture, p.city),
                          });
                        }}
                        className="px-2 py-1 text-[11px] font-medium border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded transition-colors inline-flex items-center gap-1 shrink-0"
                        title="Google Street View 360°で現地・接道を確認"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>360°現地</span>
                      </button>
                      <a 
                        href={`/property/${p.sale_unit_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded transition-colors inline-flex items-center gap-0.5 cursor-pointer shrink-0"
                      >
                         詳細
                      </a>
                    </div>
                  </div>
                </div>
              </div></Popup>
        </Marker>
    ));
  }, [properties, onMarkerClick, onMarkerHover]);

  return (
    <>
      <style>{`
        .leaflet-tile-pane {
          filter: saturate(1.15) contrast(1.05);
        }
      `}</style>
      <MapContainer 
        center={initCenter} 
        zoom={initZoom} 
        maxZoom={18}
        minZoom={5}
        maxBounds={JAPAN_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={mode === 'list'}
        zoomControl={false}
        className="w-full h-full relative z-0"
      >
        <MapResizeObserver programmaticMoveRef={programmaticMoveRef} />
        <MapBounds properties={properties} fingerprint={filterFingerprint} programmaticMoveRef={programmaticMoveRef} />
        <CustomMapControls />
        {mode === 'list' && <MapRegionalQuickJumps />}

        <MapLayerControl 
          baseMapMode={baseMapMode}
          setBaseMapMode={setBaseMapMode}
          focusJapan={focusJapan}
          setFocusJapan={setFocusJapan}
          showFlood={showFlood}
          setShowFlood={setShowFlood}
          showLandslide={showLandslide}
          setShowLandslide={setShowLandslide}
          showRailways={showRailways}
          setShowRailways={setShowRailways}
        />

        {/* Base Map Layers (Dynamic Switcher) */}
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
        {showRailways && (
          <TileLayer 
              url="/api/tiles/railway/{z}/{x}/{y}.png" 
              opacity={0.6} 
              maxZoom={18}
          />
        )}

        {/* Dynamic GSI Hazard Map Layers */}
        {showFlood && (
           <TileLayer 
              url="/api/tiles/flood/{z}/{x}/{y}.png"
              opacity={0.6}
              maxNativeZoom={17}
              maxZoom={18}
              zIndex={500}
              keepBuffer={2}
           />
        )}
        {showLandslide && (
           <TileLayer 
              url="/api/tiles/landslide/{z}/{x}/{y}.png"
              opacity={0.6}
              maxNativeZoom={17}
              maxZoom={18}
              zIndex={500}
              keepBuffer={2}
           />
        )}

        {/* Listeners for list mode */}
        {mode === 'list' && (
          <>
            <MapEventHandler onBoundsChanged={onBoundsChanged} programmaticMoveRef={programmaticMoveRef} />
            <MapHoverSync activeItemId={hoveredPropertyId} />
            <MapClickSync clickedItemId={clickedPropertyId} programmaticMoveRef={programmaticMoveRef} />
          </>
        )}

        {/* Map interaction for detail mode */}
        {mode === 'detail' && (
          <>
            <MapSync activeItemId={hoveredPropertyId} items={properties} mode="detail" />
            <DetailFitBounds target={centerProperty} properties={properties} />
          </>
        )}

        {/* 1km Radius around Target for Detail Mode */}
        {mode === 'detail' && centerProperty && centerProperty.lat && (
          <Circle 
            center={[centerProperty.lat, centerProperty.lng]} 
            radius={1000} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }} 
          />
        )}

        {/* Target Property Marker for Detail Mode */}
        {mode === 'detail' && centerProperty && centerProperty.lat && (
          <Marker 
            position={[centerProperty.lat, centerProperty.lng]}
            icon={targetIcon}
            ref={targetMarkerRef}
            zIndexOffset={2000}
          >
            <Popup closeButton={false} autoClose={false} closeOnClick={false} className="target-popup">
               <div className="font-bold text-sm text-red-600 flex items-center gap-1.5 px-1 pb-1">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 現在閲覧中
               </div>
            </Popup>
          </Marker>
        )}

        {/* Stations for Detail Mode */}
        {mode === 'detail' && nearestStations && nearestStations.map((station: any, idx: number) => (
          <Marker 
            key={"station-" + idx}
            position={[station.lat, station.lng]}
            icon={stationIcon}
          >
            <Popup>
               <div className="font-bold text-[13px]">{station.name_ja}</div>
               <div className="text-xs text-emerald-600 font-bold mt-1">徒歩 {station.walkTimeMin}分</div>
            </Popup>
          </Marker>
        ))}

        {/* Active Properties (used in BOTH modes) with MarkerClusterGroup */}
        <MarkerClusterGroup
           chunkedLoading
           iconCreateFunction={createClusterCustomIcon}
           polygonOptions={{
              fillColor: '#1B4F8A',
              color: '#143D6C',
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.15
           }}
           showCoverageOnHover={true}
           spiderfyOnMaxZoom={true} // Spiderfy Effect
           disableClusteringAtZoom={18} // Force spiderfy for exact same coordinates at zoom 18
           maxClusterRadius={45}
        >
           {activeMarkers}
        </MarkerClusterGroup>

        {/* Sold Properties (Past Auctions) for Detail Mode */}
        {mode === 'detail' && nearbySold && nearbySold.map((d: any) => (
          d.lat && d.lng ? (
            <Marker
               key={"sold-" + d.id}
               position={[d.lat, d.lng]}
               icon={soldIcon}
               zIndexOffset={0}
            >
               <Popup>
                 <div className="p-1 min-w-[140px]">
                   <div className="font-bold text-sm text-zinc-800 mb-2 border-b border-zinc-200 pb-1 flex justify-between">
                     <span>📍 売却済</span>
                     <span className="text-xs text-zinc-500">{d.distance.toFixed(1)}km</span>
                   </div>
                   <div className="text-xs text-zinc-700 space-y-1.5">
                     <div className="flex justify-between items-center">
                       <span>落札価格</span>
                       <span className="font-black text-green-600">
                         {d.winningPrice ? "¥" + d.winningPrice.toLocaleString() : '不明'}
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span>落札日</span>
                       <span>{d.completionDate ? new Date(d.completionDate).toLocaleDateString('ja-JP') : '-'}</span>
                     </div>
                   </div>
                 </div>
               </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>

      {/* Zero-Cost Google Street View & Satellite Modal */}
      <StreetViewModal
        isOpen={Boolean(streetViewTarget)}
        onClose={() => setStreetViewTarget(null)}
        lat={streetViewTarget?.lat}
        lng={streetViewTarget?.lng}
        title={streetViewTarget?.title}
        address={streetViewTarget?.address}
      />
    </>
  );
}
