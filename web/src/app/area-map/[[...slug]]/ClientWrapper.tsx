'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import HazardSearchInput from '@/components/HazardMap/HazardSearchInput';
import { TradeSocialShare } from '@/components/Trade/TradeSocialShare';
import { PrintButton } from '@/components/PrintButton';

const HazardMapTool = dynamic(() => import('@/components/HazardMap/HazardMapTool'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
         <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
         <span className="text-zinc-500 font-bold text-sm">マップ初期化中...</span>
      </div>
    </div>
  )
});

export default function ClientWrapper() {
  // Map Mode: Hazard or Zoning
  const [mapMode, setMapMode] = useState<'hazard' | 'zoning'>('hazard');

  // exact coordinate for pin
  const [targetPoint, setTargetPoint] = useState<[number, number] | null>(null);
  
  // generic coordinate for flying without pinning
  const [flyPoint, setFlyPoint] = useState<[number, number] | null>(null);

  const handleLocationSelected = (lat: number, lng: number) => {
    setFlyPoint(null);
    setTargetPoint([lat, lng]);
  };

  const handleFlyOnlySelected = (lat: number, lng: number) => {
    setTargetPoint(null);
    setFlyPoint([lat, lng]);
  };

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Header Layout (Unified) */}
      <div className="w-full bg-white border-b border-gray-100 flex-shrink-0 z-10 shadow-sm relative z-20 print:hidden">
         <div className="max-w-[1400px] mx-auto px-4 py-2 md:py-3 flex flex-row items-center justify-between gap-2 md:gap-4">
            
            <div className="flex-1 md:flex-none min-w-0 flex flex-col justify-center">
               <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4">
                 <h1 className="text-base md:text-xl font-black text-zinc-900 tracking-tight flex items-center gap-1.5 md:gap-2 shrink-0">
                   <span className="bg-blue-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[10px] md:text-sm">📍</span>
                   <span className="truncate">エリア分析マップ</span>
                 </h1>
                 
                 <div className="flex items-center gap-1.5 shrink-0">
                   <TradeSocialShare title="🔥 エリア分析マップ (災害・都市計画) | Keibai Finder" />
                   <PrintButton />
                 </div>
               </div>
               
               <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold mt-1 md:mt-1.5 truncate pr-2">
                 不動産災害リスク・都市計画確認ツール (出典：
                 <a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                   国土交通省地価公示
                 </a>
                 )
               </p>
            </div>
            
            {/* Right Side: Mode Switcher (Compact & Vertical) */}
            <div className="flex flex-col bg-zinc-100/50 p-1 rounded-md border border-zinc-200 shadow-inner shrink-0 w-auto">
                 <button 
                   onClick={() => setMapMode('zoning')}
                   className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold rounded-[4px] transition-all flex items-center justify-start gap-1 mb-0.5 md:mb-1 ${mapMode === 'zoning' ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700'}`}
                 >
                   <span className="text-[11px] md:text-[13px]">🏢</span> 都市計画
                 </button>
                 <button 
                   onClick={() => setMapMode('hazard')}
                   className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold rounded-[4px] transition-all flex items-center justify-start gap-1 ${mapMode === 'hazard' ? 'bg-white text-red-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-700'}`}
                 >
                   <span className="text-[11px] md:text-[13px]">🌋</span> 災害リスク
                 </button>
            </div>
            
         </div>
      </div>

      {/* Print Branding Container */}
      <div className="hidden print:flex flex-col items-start justify-center p-4 border-b-2 border-zinc-900 bg-white">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Keibai Finder - エリア分析マップ</h1>
          <p className="text-sm text-zinc-600 font-medium">作成日: {new Date().toLocaleDateString('ja-JP')} | 出典元: https://keibai-koubai.com | 国土交通省地価公示</p>
      </div>

      {/* Main Map Container */}
      <div className="w-full h-full flex-1 relative">
         {/* Top Floating Controls inside Map (Search Input - Hidden in print) */}
         <div className="print:hidden absolute top-4 left-4 lg:left-6 z-[1000] w-[calc(100%-80px)] lg:w-[400px] flex flex-col gap-2 pointer-events-auto">
            <HazardSearchInput 
              onLocationSelected={handleLocationSelected} 
              onFlyOnlySelected={handleFlyOnlySelected} 
            />
         </div>
         
         {/* Render Map */}
         <HazardMapTool externalPoint={targetPoint} flyPoint={flyPoint} mapMode={mapMode} />
      </div>
    </div>
  );
}
