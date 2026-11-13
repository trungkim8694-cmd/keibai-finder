'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Droplets, 
  MountainSnow, 
  Waves, 
  LineChart, 
  TrendingDown, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  Globe,
  Check
} from 'lucide-react';

interface PresetProperty {
  id: string;
  portal: string;
  siteName: string;
  portalTag: string;
  label: string;
  address: string;
  priceNote: string;
  flood: { text: string; safe: boolean };
  landslide: { text: string; safe: boolean };
  tsunami: { text: string; safe: boolean };
  valuation: string;
  valuationRange: string;
  keibaiAlert: string;
  keibaiDiscount: string;
}

const PRESETS: PresetProperty[] = [
  {
    id: 'yoyogi',
    portal: 'suumo.jp/chintai/jnc_000012345678/',
    siteName: 'SUUMO',
    portalTag: '都心マンション',
    label: '東京都渋谷区代々木',
    address: '東京都渋谷区代々木1丁目25-5',
    priceNote: '売り出し価格：9,800万円（坪480万円）',
    flood: { text: '浸水想定外（安全）', safe: true },
    landslide: { text: '警戒区域外（安全）', safe: true },
    tsunami: { text: '浸水影響なし（安全）', safe: true },
    valuation: '約452万円/坪',
    valuationRange: '国交省成約レンジ：420万〜475万円/坪',
    keibaiAlert: '周辺300m以内に公売案件あり（相場比 -32%）',
    keibaiDiscount: '-32%'
  },
  {
    id: 'tamagawa',
    portal: 'homes.co.jp/mansion/b-123456789/',
    siteName: 'LIFULL HOME\'S',
    portalTag: '河川近接エリア',
    label: '東京都世田谷区玉川',
    address: '東京都世田谷区玉川3丁目12-8',
    priceNote: '売り出し価格：7,400万円（坪310万円）',
    flood: { text: '浸水想定 1.5m〜3.0m（多摩川）', safe: false },
    landslide: { text: '警戒区域外（安全）', safe: true },
    tsunami: { text: '浸水影響なし（安全）', safe: true },
    valuation: '約285万円/坪',
    valuationRange: '国交省成約レンジ：260万〜295万円/坪',
    keibaiAlert: '世田谷区内競売案件（戸建・相場比 -28%）',
    keibaiDiscount: '-28%'
  },
  {
    id: 'kamakura',
    portal: 'kenbiya.com/re/detail/123456/',
    siteName: '健美家',
    portalTag: '収益アパート',
    label: '神奈川県鎌倉市極楽寺',
    address: '神奈川県鎌倉市極楽寺2丁目8-1',
    priceNote: '売り出し価格：3,980万円（利回り 8.2%）',
    flood: { text: '浸水想定外（安全）', safe: true },
    landslide: { text: '土砂災害警戒区域（イエロー）', safe: false },
    tsunami: { text: '津波影響なし（海抜28m）', safe: true },
    valuation: '約138万円/坪',
    valuationRange: '国交省成約レンジ：120万〜145万円/坪',
    keibaiAlert: '鎌倉市内競売案件あり（土地・相場比 -35%）',
    keibaiDiscount: '-35%'
  }
];

export default function ExtensionSimulator() {
  const [activePreset, setActivePreset] = useState<PresetProperty>(PRESETS[0]);
  const [isScanning, setIsScanning] = useState(false);

  const handleSelectPreset = (preset: PresetProperty) => {
    if (preset.id === activePreset.id) return;
    setIsScanning(true);
    setActivePreset(preset);
    setTimeout(() => {
      setIsScanning(false);
    }, 380);
  };

  return (
    <div className="w-full space-y-6">
      {/* Preset Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((p) => {
          const isActive = p.id === activePreset.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-xs'
                  : 'bg-white dark:bg-[#151B22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-[#1B4F8A]'}`} />
              <span>{p.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {p.siteName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Simulator Frame (Simulated Browser Screen) */}
      <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Browser Top Navigation Bar */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">https://www.{activePreset.portal}</span>
          </div>

          {/* Extension Icon in Browser Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 border border-[#1B4F8A]/30 text-[11px] font-semibold">
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Keibai Lens 起動中</span>
            </div>
          </div>
        </div>

        {/* Browser Content & Simulated Extension Overlay */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Simulated Real Estate Listing Page */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {activePreset.siteName} 掲載物件
              </span>
              <span className="text-xs text-slate-500 font-mono">物件ID: #KB-89210</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                【{activePreset.portalTag}】投資用区分・収益不動産
              </h3>
              <p className="text-xs text-slate-500 font-medium">{activePreset.priceNote}</p>
            </div>

            {/* Highlighting Address Box */}
            <div className="p-3.5 rounded-lg border-2 border-dashed border-[#1B4F8A]/60 dark:border-sky-500/60 bg-[#1B4F8A]/5 dark:bg-sky-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-sky-400" />
                  所在地（ポータル上の表示テキスト）
                </span>
                <span className="text-[11px] font-medium text-[#1B4F8A] dark:text-sky-400">
                  ハイライト選択中
                </span>
              </div>
              
              <div className="p-2 rounded bg-white dark:bg-[#151B22] border border-[#1B4F8A]/30 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 select-all">
                {activePreset.address}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                👆 住所テキストをカーソルでドラッグ選択すると、Keibai Lensが自動でキャプチャします。
              </p>
            </div>

            {/* Property Overview Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">交通アクセス</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">最寄駅より徒歩4分</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">建物構造・築年数</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">RC造 2012年築</span>
              </div>
            </div>
          </div>

          {/* Right Column: Keibai Lens Extension Popup Live Simulator */}
          <div className="lg:col-span-6">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#151B22] shadow-sm">
              {/* Extension Top Header */}
              <div className="px-4 py-3 bg-[#1B4F8A] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-xs tracking-tight">Keibai Lens</span>
                    <span className="text-[10px] opacity-80 ml-1.5 font-mono">v1.0.0</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    即時解析完了
                  </span>
                </div>
              </div>

              {/* Extension Body Content */}
              <div className="p-4 space-y-4">
                {/* Target Address Display in Extension */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium">解析対象住所</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> 座標確定済
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                    {activePreset.address}
                  </div>
                </div>

                {/* Loading / Refresh State */}
                {isScanning ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <RotateCw className="w-5 h-5 animate-spin text-[#1B4F8A]" />
                    <span className="text-xs font-medium">国交省・国土地理院APIと通信中...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    
                    {/* 1. Hazard Map Analysis Matrix */}
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-sky-400" />
                          国土地理院・重層ハザード自動照会
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">GSI Tile API</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Flood */}
                        <div className={`p-2 rounded border text-center ${
                          activePreset.flood.safe 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                        }`}>
                          <div className="text-[10px] flex items-center justify-center gap-1 opacity-80 mb-0.5">
                            <Droplets className="w-3 h-3" /> 洪水
                          </div>
                          <div className="text-[11px] font-bold leading-tight">
                            {activePreset.flood.safe ? '浸水外' : '警戒区域'}
                          </div>
                        </div>

                        {/* Landslide */}
                        <div className={`p-2 rounded border text-center ${
                          activePreset.landslide.safe 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                        }`}>
                          <div className="text-[10px] flex items-center justify-center gap-1 opacity-80 mb-0.5">
                            <MountainSnow className="w-3 h-3" /> 土砂
                          </div>
                          <div className="text-[11px] font-bold leading-tight">
                            {activePreset.landslide.safe ? '区域外' : '土砂警戒'}
                          </div>
                        </div>

                        {/* Tsunami */}
                        <div className="p-2 rounded border text-center bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                          <div className="text-[10px] flex items-center justify-center gap-1 opacity-80 mb-0.5">
                            <Waves className="w-3 h-3" /> 津波
                          </div>
                          <div className="text-[11px] font-bold leading-tight">
                            影響なし
                          </div>
                        </div>
                      </div>

                      {/* Detail Warning Note if any hazard found */}
                      {(!activePreset.flood.safe || !activePreset.landslide.safe) && (
                        <div className="flex items-center gap-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] border border-amber-200 dark:border-amber-800/60">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>注意：{activePreset.flood.safe ? activePreset.landslide.text : activePreset.flood.text}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Public Valuation Card (MLIT) */}
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <LineChart className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-sky-400" />
                          国土交通省 成約実勢相場
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {activePreset.valuationRange}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1B4F8A] dark:text-sky-400 font-mono tabular-nums">
                          {activePreset.valuation}
                        </span>
                        <span className="block text-[9px] text-slate-400 font-medium">直近10年推移</span>
                      </div>
                    </div>

                    {/* 3. Keibai & Koubai Opportunity */}
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                          周辺 競売・公売割安案件
                        </div>
                        <div className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                          {activePreset.keibaiAlert}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#1B4F8A] dark:text-sky-400 hover:underline flex items-center gap-0.5 shrink-0">
                        照会 <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>

                  </div>
                )}

                {/* Extension Footer Note */}
                <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400 font-sans">
                    ※ ポータルサイトの閲覧を妨げず、軽量なポップアップのみで瞬時に表示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
