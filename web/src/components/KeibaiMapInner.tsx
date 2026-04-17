'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getNearestStationInfo } from '../actions/propertyActions';
import type { BoundingBox } from '../actions/propertyActions';
import type { KeibaiMapProps } from './KeibaiMap';
import { getPropertyTypeColor } from '../types';
import { AsyncStationInfo } from './AsyncStationInfo';
import { PropertyInfoTags } from './PropertyInfoTags';
import { CourtContactLink } from './CourtContactLink';

const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

function MapEventHandler({ onBoundsChanged }: { onBoundsChanged?: (bounds: BoundingBox) => void }) {
  const map = useMapEvents({
    dragstart: () => {
      window.dispatchEvent(new CustomEvent('map-interaction'));
    },
    zoomstart: () => {
      window.dispatchEvent(new CustomEvent('map-interaction'));
    },
    moveend: () => {
      if (!onBoundsChanged) return;
      const b = map.getBounds();
      onBoundsChanged({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    },
    zoomend: () => {
      if (!onBoundsChanged) return;
      const b = map.getBounds();
      onBoundsChanged({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    }
  });

  useEffect(() => {
    if (map && onBoundsChanged) {
      const b = map.getBounds();
      onBoundsChanged({
        sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng },
        ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }
      });
    }
  }, [map, onBoundsChanged]);

  return null;
}

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

function MapBounds({ properties, fingerprint }: { properties: any[], fingerprint?: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length > 0) {
      const validProps = properties.filter(p => p.lat && p.lng);
      if (validProps.length > 0) {
        import('leaflet').then(L => {
          const bounds = L.latLngBounds(validProps.map(p => [p.lat, p.lng] as [number, number]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        });
      }
    }
  }, [map, fingerprint]);

  return null;
}

function MapFlyTo({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 });
    }
  }, [center, map]);
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
    let foundMarker: any = null;
    let clusterGroup: any = null;
    let sampleIds: string[] = [];
    const targetId = activeItemId ? String(activeItemId) : null;

    const traverseLayer = (layer: any) => {
      // Find standard markers with titles
      if (layer instanceof L.Marker && layer.options && layer.options.title) {
        const layerId = String(layer.options.title);
        if (sampleIds.length < 5) sampleIds.push(layerId);

        if (targetId && layerId === targetId) {
           foundMarker = layer;
        }
        
        const el = layer.getElement();
        if (el) {
          const innerChild = el.querySelector('.property-marker-icon');
          if (innerChild) {
             if (targetId && layerId === targetId) {
                innerChild.classList.add('bg-[#ff4d4f]', 'scale-125', 'shadow-red-500/50', 'animate-bounce');
                innerChild.classList.remove('bg-blue-600', 'scale-100', 'shadow-black/30');
                if (layer.setZIndexOffset) layer.setZIndexOffset(1000);
                el.style.zIndex = '1000';
             } else {
                innerChild.classList.remove('bg-[#ff4d4f]', 'scale-125', 'shadow-red-500/50', 'animate-bounce');
                innerChild.classList.add('bg-blue-600', 'scale-100', 'shadow-black/30');
                if (layer.setZIndexOffset) layer.setZIndexOffset(0);
                el.style.zIndex = '';
             }
          }
        }
      }
      
      if (layer.zoomToShowLayer) {
        clusterGroup = layer;
      }
      
      if (layer.getLayers) {
        layer.getLayers().forEach(traverseLayer);
      }
    };

    map.eachLayer(traverseLayer);

    if (targetId) {
      if (!foundMarker) {
        console.log("Matched hovered ID:", targetId, "- Marker Found: No. Sample IDs:", sampleIds);
      }
    }
  }, [activeItemId, map]);
  return null;
}

function MapClickSync({ clickedItemId }: { clickedItemId?: string | null }) {
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
      // If it's clustered, zoom to show layer (Internal logic automatically chooses min scale, usually 18 for spiderfy)
      if (!foundMarker._map && clusterGroup) {
         clusterGroup.zoomToShowLayer(foundMarker, () => {
            if (foundMarker.openPopup) foundMarker.openPopup();
         });
      } else {
         // It's already on map, dynamically fly to it keeping optimal bounds
         const latLng = foundMarker.getLatLng();
         
         // Set fixed zoom to 11 (Macro View) for broader city perspective
         const targetZoom = 11;
         
         map.flyTo(latLng, targetZoom, { animate: true, duration: 1.5, easeLinearity: 0.25 });
         
         // Trigger popup auto-expand; natively tracks alongside the panning animation
         if (foundMarker.openPopup) foundMarker.openPopup();
      }
    }
  }, [clickedItemId, map]);
  return null;
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

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 14, { duration: 1.5 });
    });
  };

  return (
    <div 
      className="absolute lg:bottom-[40px] lg:right-6 bottom-20 right-4 z-[1000] flex flex-col gap-3 pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      {/* Location Button */}
      <button onClick={handleLocate} className="w-10 h-10 bg-white/95 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center text-lg text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:scale-95" title="現在地">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/95 backdrop-blur-md border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-full overflow-hidden">
        <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center text-xl text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:bg-zinc-100 font-medium border-b border-gray-200" title="ズームイン">
          +
        </button>
        <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center text-2xl text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 transition-all active:bg-zinc-100 font-medium pb-0.5" title="ズームアウト">
          −
        </button>
      </div>
    </div>
  );
}

function HazardMapControls({ 
  mode, 
  setMode,
  showRailways,
  setShowRailways
}: { 
  mode: 'OFF' | 'FLOOD' | 'LANDSLIDE', 
  setMode: (m: 'OFF' | 'FLOOD' | 'LANDSLIDE') => void,
  showRailways: boolean,
  setShowRailways: (v: boolean) => void
}) {
  const [isOpen, setIsOpen] = useState(false);

  const floodLegend = [
    { color: '#f7f5a9', label: '0.5m未満' },
    { color: '#ffd3a3', label: '0.5m ~ 3.0m未満' },
    { color: '#ff9999', label: '3.0m ~ 5.0m未満' },
    { color: '#ff5050', label: '5.0m ~ 10.0m未満' },
    { color: '#b30000', label: '10.0m以上' }
  ];

  const landslideLegend = [
    { color: '#ffe600', label: '土石流危険渓流' },
  ];

  return (
    <div 
      className="absolute top-6 right-4 lg:right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div className="bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg rounded-lg overflow-hidden p-[3px] flex flex-col transition-all gap-[1px]">
        <button 
          onClick={() => {
            setMode('OFF');
            setShowRailways(false);
          }}
          className={`px-1.5 py-1 text-[9px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 ${(mode === 'OFF' && !showRailways) ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-black/5'} w-full text-center`}
          title="Tất cả OFF"
        >
          OFF
        </button>
        
        <div className="w-full h-[1px] bg-zinc-200" />

        <button 
          onClick={() => setMode('FLOOD')}
          className={`px-1.5 py-1 text-[9px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${mode === 'FLOOD' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'} w-full`}
        >
          <span className={`text-[11px] leading-none flex-shrink-0 ${mode === 'FLOOD' ? '' : 'grayscale opacity-70'}`}>🌊</span> 洪水
        </button>

        <button 
          onClick={() => setMode('LANDSLIDE')}
          className={`px-1.5 py-1 text-[9px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${mode === 'LANDSLIDE' ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'} w-full`}
        >
          <span className={`text-[11px] leading-none flex-shrink-0 ${mode === 'LANDSLIDE' ? '' : 'grayscale opacity-70'}`}>⛰️</span> 土砂災害
        </button>

        <div className="w-full h-[1px] bg-zinc-200" />

        <button 
          onClick={() => setShowRailways(!showRailways)}
          className={`px-1.5 py-1 text-[9px] font-bold tracking-tighter whitespace-nowrap rounded-[4px] transition-all duration-200 flex items-center justify-start gap-1 ${showRailways ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'} w-full`}
        >
          <span className={`text-[11px] leading-none flex-shrink-0 ${showRailways ? '' : 'grayscale opacity-70'}`}>🚃</span> 路線
        </button>
      </div>

      {mode === 'FLOOD' && (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="font-bold text-zinc-800 mb-2 border-b pb-1">浸水想定区域 (最大規模)</div>
          <div className="flex flex-col gap-1.5">
            {floodLegend.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-zinc-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'LANDSLIDE' && (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-3 w-48 text-xs animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="font-bold text-zinc-800 mb-2 border-b pb-1">土砂災害警戒区域</div>
          <div className="flex flex-col gap-1.5">
            {landslideLegend.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-zinc-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  center
}: KeibaiMapProps) {
  const router = useRouter();
  const [hazardMode, setHazardMode] = useState<'OFF' | 'FLOOD' | 'LANDSLIDE'>('OFF');
  const [showRailways, setShowRailways] = useState(false);

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

  const createActiveIcon = useMemo(() => L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="property-marker-icon relative w-8 h-8 flex items-center justify-center rounded-full border-[2.5px] shadow-lg transition-all duration-300 bg-blue-600 border-white scale-100 shadow-black/30">
             <span class="text-sm flex items-center justify-center mt-[-2px]">🏠</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
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

  // Determine initial center and zoom based on mode
  let initCenter: [number, number] = [42.5, 141.0];
  let initZoom = 8;
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
             icon={createActiveIcon}
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
           <Popup autoPan={false}>
             <div 
               onClick={() => window.open(`/property/${p.sale_unit_id}`, '_blank')}
               className="p-0 w-[240px] sm:w-[260px] cursor-pointer hover:opacity-90 transition-opacity block group outline-none focus:outline-none bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
             >
               <div className="w-full h-[120px] bg-zinc-100 dark:bg-zinc-800 rounded-t-lg mb-2 overflow-hidden border-b border-zinc-200 dark:border-zinc-700 relative">
                  {p.thumbnailUrl ? <img src={p.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Thumbnail" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                     {p.status === 'ACTIVE' ? '公開中' : p.status}
                  </div>
               </div>
               
               <div className="p-3 pt-1 flex flex-col gap-1.5">
                  <div className="text-[10px] text-zinc-500" onClick={(e) => e.stopPropagation()}>
                    {p.source_provider === 'NTA' ? (
                      <CourtContactLink 
                        courtName={p.managing_authority ? p.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : 'NTA 税務署'} 
                        contactUrl={p.contact_url || p.source_url} 
                        theme="red"
                      />
                    ) : (
                      <CourtContactLink courtName={p.court_name} contactUrl={p.contact_url} />
                    )}
                  </div>

                 <h4 className="font-bold text-xs mb-1 truncate block text-zinc-800 dark:text-zinc-300 group-hover:text-blue-600 transition-colors" title={`${p.prefecture || ''}${p.address}`}>
                   {p.prefecture || ''}{p.address}
                 </h4>
                 
                 <div className="mb-2 w-full">
                    <PropertyInfoTags property={p} displayArea={(p as any).area ? `${Math.round((p as any).area).toLocaleString('en-US')}m²` : null} showCourtTag={false} />
                 </div>
                 
                 <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex items-end justify-between pr-1">
                   <div>
                     <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0 leading-tight">売却基準価額</p>
                     <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
                        {p.starting_price ? (p.starting_price >= 10000 ? `${(p.starting_price / 10000).toLocaleString('en-US')}万円` : `¥${p.starting_price.toLocaleString('en-US')}`) : '未定'}
                     </p>
                   </div>
                   <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold py-1 px-2 rounded-md text-[10px] flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-100 dark:border-blue-800">
                      詳細を見る <span className="group-hover:translate-x-1 transition-transform">→</span>
                   </div>
                 </div>
               </div>
             </div>
           </Popup>
        </Marker>
    ));
  }, [properties, onMarkerClick, onMarkerHover]);

  return (
    <>
      <style>{`
        .leaflet-tile-pane {
          filter: saturate(1.2) contrast(1.05); /* Same style for shared map */
        }
        .marker-cluster-custom {
          background-color: rgba(37, 99, 235, 0.6);
        }
        .marker-cluster-custom div {
          background-color: rgba(29, 78, 216, 0.9);
          color: white;
          font-weight: bold;
        }
      `}</style>
      <MapContainer 
        center={initCenter} 
        zoom={initZoom} 
        maxZoom={18}
        scrollWheelZoom={mode === 'list'}
        zoomControl={false}
        className="w-full h-full relative z-0"
      >
        <MapResizeObserver />
        <CustomMapControls />
        <HazardMapControls 
          mode={hazardMode} 
          setMode={setHazardMode} 
          showRailways={showRailways}
          setShowRailways={setShowRailways}
        />

        {/* Base Map Layers */}
        <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>' 
            maxZoom={18}
        />
        {showRailways && (
          <TileLayer 
              url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png" 
              opacity={0.6} 
              maxZoom={18}
          />
        )}

        {/* Dynamic GSI Hazard Map Layers */}
        {hazardMode === 'FLOOD' && (
           <TileLayer 
              url="https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png"
              opacity={0.6}
              maxNativeZoom={17}
              maxZoom={18}
              zIndex={500}
              keepBuffer={2}
           />
        )}
        {hazardMode === 'LANDSLIDE' && (
           <TileLayer 
              url="https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png"
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
            <MapEventHandler onBoundsChanged={onBoundsChanged} />
            <MapHoverSync activeItemId={hoveredPropertyId} />
            <MapClickSync clickedItemId={clickedPropertyId} />
            <MapSync activeItemId={clickedPropertyId} items={properties} mode="list" />
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
                 現在 xem tài sản này
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
           polygonOptions={{
              fillColor: '#3b82f6',
              color: '#1d4ed8',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.2
           }}
           showCoverageOnHover={true}
           spiderfyOnMaxZoom={true} // Spiderfy Effect
           disableClusteringAtZoom={18} // Force spiderfy for exact same coordinates at zoom 18
           maxClusterRadius={50}
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
    </>
  );
}
