'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { createPricePillIcon, createClusterCustomIcon, formatMarkerPrice } from './MapPriceMarker';
import type { PropertyMarkerData } from './MapPriceMarker';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Building2, ExternalLink } from 'lucide-react';

export interface PreviewProperty extends PropertyMarkerData {
  lat: number;
  lng: number;
  court_name?: string | null;
}

interface HomeMapPreviewInnerProps {
  properties: PreviewProperty[];
}

// Controller component to smoothly pan map when clicking regional chips
function MapPanController({ panTarget }: { panTarget: { center: [number, number]; zoom: number } | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (panTarget) {
      map.flyTo(panTarget.center, panTarget.zoom, { duration: 1.2 });
    }
  }, [panTarget, map]);
  return null;
}

export default function HomeMapPreviewInner({ properties }: HomeMapPreviewInnerProps) {
  const router = useRouter();
  const [panTarget, setPanTarget] = React.useState<{ center: [number, number]; zoom: number } | null>(null);

  const REGIONAL_HOTSPOTS = [
    { name: '全国', center: [38.0, 137.5] as [number, number], zoom: 5 },
    { name: '関東', center: [35.6895, 139.6917] as [number, number], zoom: 9 },
    { name: '近畿', center: [34.6937, 135.5023] as [number, number], zoom: 9 },
    { name: '中部', center: [35.1815, 136.9066] as [number, number], zoom: 8 },
    { name: '九州', center: [33.5904, 130.4017] as [number, number], zoom: 8 },
    { name: '東北', center: [38.2682, 140.8694] as [number, number], zoom: 8 },
    { name: '北海道', center: [43.2, 142.8] as [number, number], zoom: 7 },
  ];

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm bg-slate-100 dark:bg-zinc-900">
      <MapContainer
        center={[38.0, 137.5]}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom={false}
        zoomControl={false}
        className="w-full h-full z-10"
        attributionControl={false}
      >
        <TileLayer
          url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院 (淡色地図)</a>'
          maxZoom={18}
        />

        <MapPanController panTarget={panTarget} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={55}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {properties.map((p) => {
            if (!p.lat || !p.lng) return null;
            return (
              <Marker
                key={p.sale_unit_id}
                position={[p.lat, p.lng]}
                icon={createPricePillIcon(p)}
              >
                <Popup className="custom-leaflet-popup" closeButton={true}>
                  <div className="p-3 max-w-[240px] space-y-2 text-left font-sans">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-900/30 dark:text-blue-300">
                        {p.property_type || '物件'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.source_provider === 'NTA' ? '公売' : '競売'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {p.address || '所在地詳細'}
                    </p>

                    <div className="pt-1 border-t border-slate-100 dark:border-zinc-800 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-500">売却基準価額</span>
                      <strong className="text-sm font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums font-mono">
                        {formatMarkerPrice(p.starting_price)}
                      </strong>
                    </div>

                    <Link
                      href={`/property/${p.sale_unit_id}`}
                      className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-[11px] font-semibold transition-colors"
                    >
                      <span>物件詳細を見る</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating Header Info Badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 shadow-md flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>全国マッププレビュー</span>
          <span className="text-[11px] text-slate-400 font-normal">|</span>
          <span className="font-mono text-[#1B4F8A] dark:text-blue-400 tabular-nums">
            {properties.length} 件公示中
          </span>
        </div>
      </div>

      {/* Floating CTA to Fullscreen Map */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <Link
          href="/map"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <span>地図を全画面で開く</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Bottom Region Quick Jumps Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700/80 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 px-2 shrink-0 hidden sm:inline">
            エリア移動:
          </span>
          {REGIONAL_HOTSPOTS.map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={() => setPanTarget({ center: r.center, zoom: r.zoom })}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 hover:text-[#1B4F8A] dark:text-slate-200 font-medium transition-colors whitespace-nowrap"
            >
              {r.name}
            </button>
          ))}
        </div>

        <Link
          href="/map"
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#1B4F8A] shadow-md transition-colors shrink-0"
        >
          <span>条件絞り込み・詳細検索へ</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
