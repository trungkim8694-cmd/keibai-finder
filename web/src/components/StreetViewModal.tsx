'use client';

import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ExternalLink, Compass, Satellite, MapPin } from 'lucide-react';

export interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat?: number | null;
  lng?: number | null;
  title?: string;
  address?: string;
}

export function StreetViewModal({
  isOpen,
  onClose,
  lat,
  lng,
  title,
  address
}: StreetViewModalProps) {
  const [activeTab, setActiveTab] = useState<'streetview' | 'satellite' | 'googlemap'>('streetview');

  if (!lat || !lng) return null;

  const streetViewUrl = `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed`;
  const satelliteUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=18&output=embed`;
  const googleMapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=m&z=17&output=embed`;
  const externalGoogleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-left align-middle shadow-2xl transition-all flex flex-col h-[85vh] max-h-[720px]">
                
                {/* Modal Header */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title as="h3" className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {title || '現地・周辺ビュー確認'}
                    </Dialog.Title>
                    {address && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        📍 {address}
                      </p>
                    )}
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-zinc-800 p-0.5 rounded-md shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('streetview')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                        activeTab === 'streetview'
                          ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ストリートビュー</span>
                      <span className="sm:hidden">360°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('satellite')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                        activeTab === 'satellite'
                          ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
                      }`}
                    >
                      <Satellite className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Google航空写真</span>
                      <span className="sm:hidden">航空写真</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('googlemap')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                        activeTab === 'googlemap'
                          ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Googleマップ</span>
                      <span className="sm:hidden">マップ</span>
                    </button>
                  </div>

                  {/* Actions: External & Close */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-200 dark:border-zinc-800">
                    <a
                      href={externalGoogleUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-[#1B4F8A] dark:text-zinc-400 dark:hover:text-blue-400 rounded-md hover:bg-slate-200/60 transition-colors"
                      title="Google Mapsアプリで開く"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md hover:bg-slate-200/60 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Viewport (Zero-cost Embed) */}
                <div className="flex-1 w-full bg-slate-950 relative overflow-hidden">
                  {activeTab === 'streetview' && (
                    <iframe
                      src={streetViewUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Street View 360"
                    />
                  )}
                  {activeTab === 'satellite' && (
                    <iframe
                      src={satelliteUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps Satellite"
                    />
                  )}
                  {activeTab === 'googlemap' && (
                    <iframe
                      src={googleMapUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps Standard"
                    />
                  )}
                </div>

                {/* Modal Footer Note */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 shrink-0">
                  <span>💡 ドラッグして360°回転、矢印キーで前後の道路へ移動できます（Google Street View連携）</span>
                  <a
                    href={externalGoogleUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Google Mapsで全画面表示</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
