'use client';

import { useEffect, useState } from 'react';
import { getNearestStationInfo } from '../actions/propertyActions';

interface AsyncStationInfoProps {
  lat: number;
  lng: number;
  sale_unit_id?: string;
  initial?: string;
  hideIfNoStation?: boolean; // Used to hide the tag entirely if no station is found
}

export function AsyncStationInfo({ lat, lng, sale_unit_id, initial, hideIfNoStation = false }: AsyncStationInfoProps) {
  const [station, setStation] = useState<string | null>(initial || '計算中...');
  
  useEffect(() => {
    if (initial) {
       setStation(initial);
       return;
    }
    
    let isMounted = true;
    getNearestStationInfo(lat, lng, sale_unit_id)
      .then(resp => {
        if (!isMounted) return;
        if (resp) setStation(resp);
        else setStation(hideIfNoStation ? null : '駅情報なし');
      })
      .catch(() => {
        if (isMounted) setStation(hideIfNoStation ? null : '駅情報なし');
      });
      
    return () => { isMounted = false; };
  }, [lat, lng, sale_unit_id, initial, hideIfNoStation]);
  
  if (!station && hideIfNoStation) return null;
  
  return <>{station}</>;
}
