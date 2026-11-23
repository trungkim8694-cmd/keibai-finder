'use client';

import React, { useState, useEffect } from 'react';
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
  mapMoved?: boolean;
  onSearchAreaClick?: () => void;
}

export default function KeibaiMap(props: KeibaiMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<KeibaiMapProps> | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('./KeibaiMapInner').then((mod) => {
      if (isMounted) {
        setMapComponent(() => mod.default);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center font-bold text-zinc-500">
        地図を読み込み中...
      </div>
    );
  }

  return <MapComponent {...props} />;
}

