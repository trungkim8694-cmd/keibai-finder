'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import HazardSearchInput from '@/components/HazardMap/HazardSearchInput';
import { TradeSocialShare } from '@/components/Trade/TradeSocialShare';
import { PrintButton } from '@/components/PrintButton';

// Dynamic import Leaflet GIS Map Tool to prevent SSR window is not defined
const HazardMapTool = dynamic(() => import('@/components/HazardMap/HazardMapTool'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F8FAFC] dark:bg-[#0D1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">マップ初期化中...</span>
      </div>
    </div>
  )
});

const PREFECTURE_CENTERS: Record<string, [number, number]> = {
  '北海道': [43.0642, 141.3469],
  '青森県': [40.8244, 140.7400],
  '岩手県': [39.7036, 141.1527],
  '宮城県': [38.2682, 140.8694],
  '秋田県': [39.7186, 140.1024],
  '山形県': [38.2404, 140.3633],
  '福島県': [37.7500, 140.4678],
  '茨城県': [36.3418, 140.4468],
  '栃木県': [36.5658, 139.8836],
  '群馬県': [36.3912, 139.0608],
  '埼玉県': [35.8570, 139.6490],
  '千葉県': [35.6051, 140.1233],
  '東京都': [35.6895, 139.6917],
  '神奈川県': [35.4478, 139.6425],
  '新潟県': [37.9026, 139.0232],
  '富山県': [36.6953, 137.2113],
  '石川県': [36.5947, 136.6256],
  '福井県': [36.0652, 136.2216],
  '山梨県': [35.6639, 138.5684],
  '長野県': [36.6513, 138.1810],
  '岐阜県': [35.3912, 136.7223],
  '静岡県': [34.9770, 138.3831],
  '愛知県': [35.1802, 136.9066],
  '三重県': [34.7303, 136.5086],
  '滋賀県': [35.0045, 135.8686],
  '京都府': [35.0210, 135.7556],
  '大阪府': [34.6937, 135.5023],
  '兵庫県': [34.6913, 135.1830],
  '奈良県': [34.6853, 135.8328],
  '和歌山県': [34.2260, 135.1675],
  '鳥取県': [35.5039, 134.2377],
  '島根県': [35.4723, 133.0505],
  '岡山県': [34.6618, 133.9350],
  '広島県': [34.3966, 132.4596],
  '山口県': [34.1859, 131.4705],
  '徳島県': [34.0658, 134.5593],
  '香川県': [34.3401, 134.0434],
  '愛媛県': [33.8417, 132.7661],
  '高知県': [33.5597, 133.5311],
  '福岡県': [33.6068, 130.4181],
  '佐賀県': [33.2494, 130.2988],
  '長崎県': [32.7448, 129.8737],
  '熊本県': [32.7898, 130.7417],
  '大分県': [33.2382, 131.6126],
  '宮崎県': [31.9111, 131.4239],
  '鹿児島県': [31.5602, 130.5581],
  '沖縄県': [26.2124, 127.6809],
};

interface ClientWrapperProps {
  initialSlug?: string[];
  regionName?: string;
}

export default function ClientWrapper({ initialSlug = [], regionName = '全国' }: ClientWrapperProps) {
  // Map Mode: Hazard (災害リスク) or Zoning (都市計画)
  const [mapMode, setMapMode] = useState<'hazard' | 'zoning'>('hazard');

  // Exact coordinate for analysis pin
  const [targetPoint, setTargetPoint] = useState<[number, number] | null>(null);
  const [selectedAddressTitle, setSelectedAddressTitle] = useState<string>('');
  
  // Generic coordinate for camera flight without pin
  const [flyPoint, setFlyPoint] = useState<[number, number] | null>(null);

  // Compute initial map center based on administrative slug
  const { initialCenter, initialZoom } = useMemo(() => {
    if (initialSlug.length > 0) {
      const prefCandidate = initialSlug[0];
      if (PREFECTURE_CENTERS[prefCandidate]) {
        return {
          initialCenter: PREFECTURE_CENTERS[prefCandidate],
          initialZoom: initialSlug.length > 1 ? 14 : 11
        };
      }
    }
    return {
      initialCenter: [36.0, 137.0] as [number, number],
      initialZoom: 5
    };
  }, [initialSlug]);

  const handleLocationSelected = (lat: number, lng: number, title?: string) => {
    setFlyPoint(null);
    setTargetPoint([lat, lng]);
    if (title) {
      setSelectedAddressTitle(title);
    }
  };

  const handleFlyOnlySelected = (lat: number, lng: number) => {
    setTargetPoint(null);
    setFlyPoint([lat, lng]);
  };

  return (
    <div className="flex flex-col w-full h-full relative bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Top Header Bar (Unified Corporate B2B Theme) */}
      <header className="w-full bg-white dark:bg-[#151B22] border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-20 shadow-xs print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-row items-center justify-between gap-3">
          
          {/* Left: Branding & Region Title */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B4F8A] dark:bg-blue-500 shrink-0"></span>
              <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {regionName} エリア分析マップ
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                災害リスク・都市計画・用途地域
              </span>
            </div>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden md:block">
              国土交通省・国土地理院オープンデータ連携 ｜ 洪水・土砂・津波・高潮・用途地域・建ぺい率・容積率を一括診断
            </p>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="w-72 lg:w-96 hidden md:block shrink-0">
            <HazardSearchInput 
              onLocationSelected={handleLocationSelected} 
              onFlyOnlySelected={handleFlyOnlySelected} 
            />
          </div>
          
          {/* Right: Mode Switcher & Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setMapMode('hazard')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapMode === 'hazard' 
                    ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="自然災害リスク（洪水・土砂・津波・避難所）を表示"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                災害リスク
              </button>
              <button 
                onClick={() => setMapMode('zoning')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  mapMode === 'zoning' 
                    ? 'bg-white dark:bg-[#151B22] text-[#1B4F8A] dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="都市計画・用途地域・建ぺい率・容積率を表示"
              >
                <span className="w-2 h-2 rounded-full bg-[#1B4F8A]"></span>
                都市計画
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              <TradeSocialShare title={`🔥 ${regionName} エリア分析マップ（災害・都市計画）| Keibai Finder`} />
              <PrintButton />
            </div>
          </div>
          
        </div>
      </header>

      {/* Mobile Search Bar Row */}
      <div className="md:hidden px-3 py-2 bg-white dark:bg-[#151B22] border-b border-slate-200 dark:border-slate-800 z-10">
        <HazardSearchInput 
          onLocationSelected={handleLocationSelected} 
          onFlyOnlySelected={handleFlyOnlySelected} 
        />
      </div>

      {/* Main Full-View GIS Map Workspace (100% Full Width & Height) */}
      <main className="flex-1 w-full h-full overflow-hidden relative">
        <HazardMapTool 
          externalPoint={targetPoint} 
          flyPoint={flyPoint} 
          mapMode={mapMode}
          setMapMode={setMapMode}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onLocationSelected={handleLocationSelected}
          regionName={regionName}
          selectedAddressTitle={selectedAddressTitle}
        />
      </main>

    </div>
  );
}
