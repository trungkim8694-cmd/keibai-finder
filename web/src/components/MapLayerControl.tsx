'use client';

import React, { useState } from 'react';

export type BaseMapMode = 'standard' | 'satellite' | 'pale';

export interface MapLayerControlProps {
  baseMapMode: BaseMapMode;
  setBaseMapMode: (mode: BaseMapMode) => void;
  focusJapan?: boolean;
  setFocusJapan?: (v: boolean) => void;
  showFlood: boolean;
  setShowFlood: (v: boolean) => void;
  showLandslide: boolean;
  setShowLandslide: (v: boolean) => void;
  showRailways: boolean;
  setShowRailways: (v: boolean) => void;
}

export function MapLayerControl({
  baseMapMode,
  setBaseMapMode,
  focusJapan = true,
  setFocusJapan,
  showFlood,
  setShowFlood,
  showLandslide,
  setShowLandslide,
  showRailways,
  setShowRailways,
}: MapLayerControlProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

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

  const activeOverlayCount = (showFlood ? 1 : 0) + (showLandslide ? 1 : 0) + (showRailways ? 1 : 0);
  const hasActiveOverlay = activeOverlayCount > 0;

  return (
    <div 
      className="absolute top-3.5 right-3 lg:right-5 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
    >
      {/* Mobile Toggle Button (Thu gọn bảng trên Mobile để giải phóng 40% tầm nhìn bản đồ) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpenMobile(v => !v)}
          className={`h-9 px-3 rounded-full border shadow-[0_4px_14px_rgba(0,0,0,0.12)] backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isOpenMobile
              ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
              : 'bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
          }`}
          title="地図タイプ・ハザードレイヤーの切り替え"
        >
          <span className="text-sm">🗺️</span>
          <span>レイヤー</span>
          {activeOverlayCount > 0 && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-mono flex items-center justify-center">
              {activeOverlayCount}
            </span>
          )}
        </button>
      </div>

      {/* Unified B2B Map Layer Panel (Hiển thị cố định trên Desktop, mở dạng Popover thả xuống trên Mobile) */}
      <div className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 shadow-xl lg:shadow-md rounded-xl lg:rounded-lg p-2.5 lg:p-1.5 flex flex-col gap-2 lg:gap-1.5 min-w-[200px] lg:min-w-[170px] select-none ${
        isOpenMobile ? 'flex animate-in fade-in zoom-in-95 duration-150' : 'hidden lg:flex'
      }`}>
        <div className="flex items-center justify-between lg:hidden pb-1.5 border-b border-slate-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
            <span>🗺️</span>
            <span>地図・ハザード設定</span>
          </span>
          <button
            type="button"
            onClick={() => setIsOpenMobile(false)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
        
        {/* Base Map Switcher: Standard / Satellite / Pale */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1 px-1 flex items-center justify-between">
            <span>地図タイプ</span>
            <span className="text-[9px] font-mono text-slate-400">GSI/国土地理院</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setBaseMapMode('standard')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center ${
                baseMapMode === 'standard'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              }`}
            >
              標準
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode('satellite')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center ${
                baseMapMode === 'satellite'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              }`}
            >
              航空写真
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode('pale')}
              className={`py-1 text-[11px] font-semibold rounded transition-colors text-center ${
                baseMapMode === 'pale'
                  ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
              }`}
            >
              淡色
            </button>
          </div>

          {setFocusJapan && (
            <button
              type="button"
              onClick={() => setFocusJapan(!focusJapan)}
              className={`w-full mt-1.5 px-2 py-1 text-[10.5px] font-semibold rounded transition-all flex items-center justify-between border ${
                focusJapan
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 border-[#1B4F8A]/30'
                  : 'text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
              title="日本国外エリアを減光し、国内を鮮明に強調します"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[12px] leading-none">🗾</span>
                <span>日本エリア強調</span>
              </span>
              <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded leading-none ${
                focusJapan ? 'bg-[#1B4F8A] text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
              }`}>
                {focusJapan ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
        </div>

        <div className="w-full h-px bg-slate-200/80 dark:bg-zinc-800" />

        {/* Hazard & Railway Layer Toggles */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1 px-1">
            <span>ハザード・交通</span>
            {hasActiveOverlay && (
              <button
                type="button"
                onClick={() => {
                  setShowFlood(false);
                  setShowLandslide(false);
                  setShowRailways(false);
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                解除
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button 
              type="button"
              onClick={() => {
                const nextVal = !showFlood;
                setShowFlood(nextVal);
                // If turning on flood, Pale map offers the best contrast
                if (nextVal && baseMapMode === 'satellite') {
                  setBaseMapMode('pale');
                }
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition-all flex items-center justify-between ${
                showFlood 
                  ? 'bg-[#1B4F8A] text-white shadow-2xs font-bold' 
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`text-[12px] leading-none ${showFlood ? '' : 'grayscale opacity-70'}`}>🌊</span>
                <span>洪水浸水想定</span>
              </span>
              <span className="text-[10px] font-mono opacity-80">{showFlood ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                const nextVal = !showLandslide;
                setShowLandslide(nextVal);
                if (nextVal && baseMapMode === 'satellite') {
                  setBaseMapMode('pale');
                }
              }}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition-all flex items-center justify-between ${
                showLandslide 
                  ? 'bg-amber-600 text-white shadow-2xs font-bold' 
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`text-[12px] leading-none ${showLandslide ? '' : 'grayscale opacity-70'}`}>⛰️</span>
                <span>土砂災害警戒</span>
              </span>
              <span className="text-[10px] font-mono opacity-80">{showLandslide ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowRailways(!showRailways)}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition-all flex items-center justify-between ${
                showRailways 
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold' 
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`text-[12px] leading-none ${showRailways ? '' : 'grayscale opacity-70'}`}>🚃</span>
                <span>鉄道路線網</span>
              </span>
              <span className="text-[10px] font-mono opacity-80">{showRailways ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {(showFlood || showLandslide) && (
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowLegend(v => !v)}
              className="w-full text-[10px] text-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 py-0.5 hover:underline"
            >
              {showLegend ? '▲ 凡例を閉じる' : '▼ ハザード凡例を表示'}
            </button>
          </div>
        )}
      </div>

      {/* Floating Legend Box */}
      {showLegend && (showFlood || showLandslide) && (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 shadow-xl rounded-lg p-2.5 w-48 text-[11px]">
          {showFlood && (
            <div className="mb-2">
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1.5 pb-1 border-b border-slate-100 dark:border-zinc-800">
                浸水想定区域 (最大規模)
              </div>
              <div className="flex flex-col gap-1">
                {floodLegend.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-2xs border border-black/10 shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-zinc-300 font-medium text-[10px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showLandslide && (
            <div>
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1.5 pb-1 border-b border-slate-100 dark:border-zinc-800">
                土砂災害警戒区域
              </div>
              <div className="flex flex-col gap-1">
                {landslideLegend.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-2xs border border-black/10 shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-zinc-300 font-medium text-[10px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
