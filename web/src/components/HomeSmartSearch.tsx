'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transition } from '@headlessui/react';
import { Search, X, Train, MapPin, Scale, Bookmark, Building2, Sparkles, Flame, ArrowUpRight } from 'lucide-react';
import { getSearchSuggestions, SearchSuggestion } from '@/actions/propertyActions';

interface HomeSmartSearchProps {
  prefCountMap?: Record<string, number>;
}

export default function HomeSmartSearch({ prefCountMap = {} }: HomeSmartSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Debounced autocomplete suggestions lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = keyword.trim();
      if (trimmed.length >= 2) {
        getSearchSuggestions(trimmed)
          .then(setSuggestions)
          .catch(() => setSuggestions([]));
        setIsSuggestionsOpen(true);
      } else {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSuggestionSelect = (sugg: SearchSuggestion) => {
    setKeyword(sugg.text);
    setIsSuggestionsOpen(false);
    setIsInputFocused(false);

    const params = new URLSearchParams();
    params.set('keyword', sugg.text);

    if (sugg.type === 'STATION') {
      params.set('stationName', sugg.text);
    } else if (sugg.type === 'LINE') {
      params.set('lineName', sugg.text);
    } else if (sugg.type === 'CITY' && sugg.subtext) {
      params.set('prefecture', sugg.subtext);
    } else if (sugg.type === 'COURT') {
      if (sugg.subtext?.includes('公売')) {
        params.set('managingAuthority', sugg.text);
      } else {
        params.set('courtName', sugg.text);
      }
    }

    router.push(`/map?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      router.push(`/map?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/map');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-4 space-y-3 relative z-30">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => {
              setIsInputFocused(true);
              if (suggestions.length > 0) setIsSuggestionsOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsInputFocused(false);
                setIsSuggestionsOpen(false);
              }, 200);
            }}
            placeholder="エリア・駅名・キーワード（例: 新宿 マンション 2000万以下）..."
            className="w-full pl-10 pr-9 py-3 text-xs sm:text-sm border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] shadow-sm font-medium transition-all"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-20 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Quick Popular Intent Chips on Empty Focus */}
          <Transition
            show={isInputFocused && !keyword.trim()}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-xl p-3 z-50 text-left">
              <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>人気のスマート検索・条件例（クリックですぐ検索）</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '東京 マンション',
                  '駅徒歩10分以内',
                  '2000万円以下',
                  '土地 50坪以上',
                  '戸建て 1000万以下',
                  '山手線 駅近',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setKeyword(chip);
                      setIsInputFocused(false);
                      router.push(`/map?keyword=${encodeURIComponent(chip)}`);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 hover:text-[#1B4F8A] dark:text-zinc-200 font-medium transition-colors border border-transparent hover:border-blue-200"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </Transition>

          {/* Autocomplete Suggestions Dropdown */}
          <Transition
            show={isSuggestionsOpen && suggestions.length > 0}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <ul className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-xl py-1 z-50 max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 text-left">
              {suggestions.map((s, idx) => {
                const getBadge = () => {
                  switch (s.type) {
                    case 'STATION':
                      return {
                        label: '駅',
                        bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                        icon: <Train className="w-3.5 h-3.5 text-blue-500" />,
                      };
                    case 'LINE':
                      return {
                        label: '路線',
                        bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                        icon: <Train className="w-3.5 h-3.5 text-emerald-500" />,
                      };
                    case 'CITY':
                      return {
                        label: 'エリア',
                        bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                        icon: <MapPin className="w-3.5 h-3.5 text-amber-500" />,
                      };
                    case 'COURT':
                      return {
                        label: '裁判所/税務署',
                        bg: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                        icon: <Scale className="w-3.5 h-3.5 text-purple-500" />,
                      };
                    case 'CASE':
                      return {
                        label: '事件番号',
                        bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
                        icon: <Bookmark className="w-3.5 h-3.5 text-indigo-500" />,
                      };
                    default:
                      return {
                        label: '住所',
                        bg: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
                        icon: <Building2 className="w-3.5 h-3.5 text-slate-500" />,
                      };
                  }
                };
                const badge = getBadge();

                return (
                  <li
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionSelect(s);
                    }}
                    onClick={() => {
                      handleSuggestionSelect(s);
                    }}
                    className="cursor-pointer select-none py-2.5 px-4 text-xs sm:text-sm hover:bg-blue-50/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2.5 group"
                  >
                    <span className="w-5 flex items-center justify-center shrink-0">
                      {badge.icon}
                    </span>
                    <div className="flex flex-col truncate min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 truncate">
                          {s.text}
                        </span>
                        {typeof s.count === 'number' && (
                          <span className="text-[11px] text-slate-400 dark:text-zinc-400 font-mono font-medium shrink-0">
                            ({s.count}件)
                          </span>
                        )}
                      </div>
                      {s.subtext && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                          {s.subtext}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Transition>
        </div>

        <button
          type="submit"
          className="px-6 py-3 text-xs sm:text-sm font-semibold bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow active:scale-[0.99] flex items-center gap-1.5 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>検索する</span>
        </button>
      </form>

      {/* Quick Trending Keywords & Hot Deals */}
      <div className="space-y-1.5 pt-0.5">
        {/* Row 1: AI Trending Keywords */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0">
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>急上昇トレンド:</span>
          </span>
          <Link
            href="/map?types[]=%E6%88%B8%E5%BB%BA%E3%81%A6&maxPrice=5000000"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60 hover:border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium transition-colors"
          >
            <span>#500万以下戸建て</span>
            <span className="text-[9px] font-bold px-1 rounded bg-rose-200/60 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300">HOT</span>
          </Link>
          <Link
            href="/map?types[]=%E3%83%9E%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%B3"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 hover:border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium transition-colors"
          >
            <span>#区分マンション</span>
            <span className="text-[9px] font-bold px-1 rounded bg-amber-200/60 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300">格安</span>
          </Link>
          <Link
            href="/map?minGap=30"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium transition-colors"
          >
            <span>#相場比+30%割安</span>
            <span className="text-[9px] font-bold px-1 rounded bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">高利回り</span>
          </Link>
          <Link
            href="/map?provider=NTA"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60 hover:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-medium transition-colors"
          >
            <span>#国税局公売</span>
          </Link>
          <Link
            href="/features/keyword-trends"
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-slate-500 hover:text-[#1B4F8A] font-medium transition-colors text-[10px] ml-1"
          >
            <span>トレンド一覧</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Row 2: Popular Prefectures & Conditions */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">主要地域:</span>
          <Link
            href="/search/area/%E6%9D%B1%E4%BA%AC%E9%83%BD"
            className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 hover:border-[#1B4F8A] hover:text-[#1B4F8A] bg-slate-50/80 dark:bg-zinc-800 transition-colors"
          >
            東京都 ({prefCountMap['東京都'] || 0})
          </Link>
          <Link
            href="/search/area/%E5%A4%A7%E9%98%AA%E5%BA%9C"
            className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 hover:border-[#1B4F8A] hover:text-[#1B4F8A] bg-slate-50/80 dark:bg-zinc-800 transition-colors"
          >
            大阪府 ({prefCountMap['大阪府'] || 0})
          </Link>
          <Link
            href="/search/area/%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C"
            className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 hover:border-[#1B4F8A] hover:text-[#1B4F8A] bg-slate-50/80 dark:bg-zinc-800 transition-colors"
          >
            神奈川県 ({prefCountMap['神奈川県'] || 0})
          </Link>
          <Link
            href="/map?maxPrice=3000000"
            className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 hover:border-[#1B4F8A] hover:text-[#1B4F8A] bg-slate-50/80 dark:bg-zinc-800 transition-colors"
          >
            300万円以下
          </Link>
        </div>
      </div>
    </div>
  );
}
