'use client';

import dynamic from 'next/dynamic';
import type { BoundingBox } from '../actions/propertyActions';

export interface KeibaiMapProps {
  mode: 'list' | 'detail';
  properties: any[];
  centerProperty?: any;
  nearbySold?: any[];
  nearestStations?: any[];
  hoveredPropertyId?: string | null;
  clickedPropertyId?: string | null;
  onMarkerClick?: (id: string | null) => void;
  onMarkerHover?: (id: string | null) => void;
  onBoundsChanged?: (bounds: BoundingBox) => void;
  center?: [number, number];
  filterFingerprint?: string;
}

const KeibaiMapInner = dynamic(() => import('./KeibaiMapInner'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center font-bold text-zinc-500">
      地図を読み込み中...
    </div>
  )
});

export default function KeibaiMap(props: KeibaiMapProps) {
  return <KeibaiMapInner {...props} />;
}
