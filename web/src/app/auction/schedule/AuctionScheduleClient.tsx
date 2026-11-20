'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  Building2, 
  MapPin, 
  ExternalLink, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { ScheduleDataResponse, getAuctionSchedule, getScheduleDayProperties } from '@/actions/scheduleActions';

interface Props {
  initialData: ScheduleDataResponse;
}

export default function AuctionScheduleClient({ initialData }: Props) {
  const [data, setData] = useState<ScheduleDataResponse>(initialData);
  const [year, setYear] = useState<number>(initialData.year);
  const [month, setMonth] = useState<number>(initialData.month);
  const [provider, setProvider] = useState<'ALL' | 'BIT' | 'NTA' | 'KSI' | 'MOF'>(initialData.provider);
  const [mode, setMode] = useState<'end_date' | 'start_date'>(initialData.mode);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  
  // Selected day properties list
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayProperties, setDayProperties] = useState<any[]>([]);
  const [loadingDayProps, setLoadingDayProps] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'calendar' | 'list'>('calendar');
  const [isPending, startTransition] = useTransition();

  // Fetch month data when year, month, provider, mode changes
  const handleFetchMonth = (newYear: number, newMonth: number, newProvider = provider, newMode = mode) => {
    startTransition(async () => {
      const res = await getAuctionSchedule(newYear, newMonth, newProvider, newMode);
      setData(res);
      setYear(newYear);
      setMonth(newMonth);
      setProvider(newProvider);
      setMode(newMode);
      setSelectedDate(null);
      setDayProperties([]);
    });
  };

  const handlePrevMonth = () => {
    let prevM = month - 1;
    let prevY = year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    handleFetchMonth(prevY, prevM);
  };

  const handleNextMonth = () => {
    let nextM = month + 1;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    handleFetchMonth(nextY, nextM);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    handleFetchMonth(curY, curM);
  };

  // Click on a day cell
  const handleSelectDay = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setLoadingDayProps(true);
    try {
      const props = await getScheduleDayProperties(
        dateStr, 
        provider, 
        selectedPrefecture || undefined,
        mode
      );
      setDayProperties(props);
    } catch (e) {
      console.error(e);
      setDayProperties([]);
    } finally {
      setLoadingDayProps(false);
    }
  };

  // Calendar Day of week calculation for grid padding
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  // Current Date String in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Tabs */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                <CalendarDays className="w-3.5 h-3.5" />
                全国競売・公売スケジュール
              </span>
              <span className="text-[11px] text-slate-500">
                {year}年{month}月期
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              不動産売却スケジュールカレンダー
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              地方裁判所の競売（BIT）および国税庁公売（NTA）の入札締切日・開札期日を日別に網羅。
            </p>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCurrentMonth}
              className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              今月
            </button>
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5">
              <button
                onClick={handlePrevMonth}
                disabled={isPending}
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
                title="前月"
                aria-label="前月"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[100px] text-center font-mono tabular-nums">
                {year}年 {month}月
              </span>
              <button
                onClick={handleNextMonth}
                disabled={isPending}
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
                title="次月"
                aria-label="次月"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Provider Tabs with Horizontal Scroll on Mobile */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-1 whitespace-nowrap min-w-full sm:min-w-0">
              <button
                onClick={() => handleFetchMonth(year, month, 'ALL')}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  provider === 'ALL'
                    ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                すべて表示 ({data.stats.totalProperties}件)
              </button>
              <button
                onClick={() => handleFetchMonth(year, month, 'BIT')}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  provider === 'BIT'
                    ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                競売スケジュール ({data.stats.bitCount}件)
              </button>
              <button
                onClick={() => handleFetchMonth(year, month, 'NTA')}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  provider === 'NTA'
                    ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                国税公売 ({data.stats.ntaCount}件)
              </button>
              <button
                onClick={() => handleFetchMonth(year, month, 'KSI')}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  provider === 'KSI'
                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                官公庁公売 ({data.stats.ksiCount || 0}件)
              </button>
              <button
                onClick={() => handleFetchMonth(year, month, 'MOF')}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                  provider === 'MOF'
                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                国有財産 ({data.stats.mofCount || 0}件)
              </button>
            </div>
          </div>

          {/* Mode Switch (End Date vs Start Date) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              基準期日:
            </span>
            <div className="inline-flex rounded-md border border-slate-200 dark:border-zinc-700 p-0.5 text-xs bg-slate-50 dark:bg-zinc-800/80">
              <button
                onClick={() => handleFetchMonth(year, month, provider, 'end_date')}
                className={`min-h-[38px] px-3 py-1.5 rounded font-medium transition-colors ${
                  mode === 'end_date'
                    ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                入札締切日基準 (推奨)
              </button>
              <button
                onClick={() => handleFetchMonth(year, month, provider, 'start_date')}
                className={`min-h-[38px] px-3 py-1.5 rounded font-medium transition-colors ${
                  mode === 'start_date'
                    ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                入札開始日基準
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT (2 COLUMNS: SIDEBAR STATS + CALENDAR GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN ON DESKTOP, SECOND ON MOBILE: FILTERS & DISTRIBUTION (1 Col) */}
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-4">
          {/* Monthly KPI Overview Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <TrendingUp className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              {month}月期 スケジュール概況
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">月間総出品</span>
                <span className="text-base font-extrabold text-[#1B4F8A] dark:text-blue-400 tabular-nums font-mono">
                  {data.stats.totalProperties} <span className="text-xs font-normal">件</span>
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">実施都道府県</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 tabular-nums font-mono">
                  {data.stats.activePrefecturesCount} <span className="text-xs font-normal">都府県</span>
                </span>
              </div>
            </div>
            {data.stats.peakDate && (
              <div className="text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 p-2 rounded-lg border border-amber-200/60 flex items-center justify-between">
                <span>入札ピーク日</span>
                <span className="font-bold tabular-nums font-mono">
                  {data.stats.peakDate.slice(5).replace('-', '/')} ({data.stats.peakCount}件)
                </span>
              </div>
            )}
          </div>

          {/* Region Distribution Filter */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                エリアから探す
              </p>
              {selectedPrefecture && (
                <button
                  onClick={() => setSelectedPrefecture(null)}
                  className="text-[10px] text-[#1B4F8A] hover:underline"
                >
                  解除
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              {Object.entries(data.stats.regionCounts).map(([regName, count]) => (
                <div
                  key={regName}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200"
                >
                  <span className="text-[11px] font-medium">{regName}</span>
                  <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded font-semibold ${
                    count > 0 ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-zinc-600'
                  }`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Property Types */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              物件種別内訳
            </p>
            <div className="space-y-1.5 text-xs">
              {Object.entries(data.stats.typeCounts).map(([tName, count]) => (
                <div
                  key={tName}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200"
                >
                  <span className="text-[11px]">{tName}</span>
                  <span className="text-[11px] font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Distribution */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              価格帯別
            </p>
            <div className="space-y-1 text-xs">
              {Object.entries(data.stats.priceRanges).map(([pName, count]) => (
                <div
                  key={pName}
                  className="flex items-center justify-between py-0.5 px-2 text-slate-600 dark:text-slate-300 text-[11px]"
                >
                  <span>{pName}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN ON DESKTOP, FIRST ON MOBILE: CALENDAR GRID (3 Cols) */}
        <div className="order-1 lg:order-2 lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-3 sm:p-5 shadow-sm overflow-hidden">
            {/* View Switcher on Mobile (< sm) */}
            <div className="sm:hidden flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {year}年{month}月の売却予定
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMobileView('calendar')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors min-h-[32px] ${
                    mobileView === 'calendar'
                      ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  カレンダー
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors min-h-[32px] ${
                    mobileView === 'list'
                      ? 'bg-white dark:bg-zinc-900 text-[#1B4F8A] dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  予定リスト
                </button>
              </div>
            </div>

            {/* Mobile List View */}
            {mobileView === 'list' ? (
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-zinc-800">
                {data.days.filter(d => d.total > 0).length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    今月の売却予定案件はありません。
                  </div>
                ) : (
                  data.days
                    .filter(d => d.total > 0)
                    .map(dayItem => {
                      const isSelected = selectedDate === dayItem.date;
                      const isToday = dayItem.date === todayStr;
                      const dateObj = new Date(dayItem.date);
                      const dayOfWeek = dateObj.getDay();
                      const isSun = dayOfWeek === 0;
                      const isSat = dayOfWeek === 6;
                      const dayName = weekdays[dayOfWeek];

                      return (
                        <div
                          key={`list-${dayItem.date}`}
                          onClick={() => handleSelectDay(dayItem.date)}
                          className={`p-3 transition-colors cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-[#1B4F8A]'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold font-mono tabular-nums ${
                                isSun ? 'text-rose-600 dark:text-rose-400' : isSat ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-100'
                              }`}>
                                {month}月{dayItem.dayNumber}日 ({dayName})
                              </span>
                              {isToday && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                                  本日
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dayItem.prefectures.slice(0, 3).map(p => (
                                <span
                                  key={p.prefecture}
                                  className="text-[10px] text-slate-500 dark:text-slate-400"
                                >
                                  {p.prefecture} ({p.count})
                                </span>
                              ))}
                              {dayItem.prefectures.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  +{dayItem.prefectures.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#1B4F8A] text-white tabular-nums font-mono">
                              {dayItem.total} 件
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            ) : null}

            {/* Calendar Grid Container (hidden on mobile if in list view) */}
            <div className={mobileView === 'list' ? 'hidden sm:block' : 'block'}>
              {/* Calendar Weekday Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 pb-2 mb-2 text-center text-xs font-bold">
                <div className="text-rose-600 dark:text-rose-400">日</div>
                <div className="text-slate-700 dark:text-slate-300">月</div>
                <div className="text-slate-700 dark:text-slate-300">火</div>
                <div className="text-slate-700 dark:text-slate-300">水</div>
                <div className="text-slate-700 dark:text-slate-300">木</div>
                <div className="text-slate-700 dark:text-slate-300">金</div>
                <div className="text-sky-600 dark:text-sky-400">土</div>
              </div>

              {/* Calendar Cells Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
                {/* Blank pad cells for the first week */}
                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                  <div
                    key={`blank-${idx}`}
                    className="min-h-[52px] sm:min-h-[115px] p-1 sm:p-1.5 rounded-lg bg-slate-50/50 dark:bg-zinc-900/40 border border-dashed border-slate-100 dark:border-zinc-800/40 opacity-40"
                  />
                ))}

                {/* Real month days */}
                {data.days.map((dayItem) => {
                  const isToday = dayItem.date === todayStr;
                  const isSelected = selectedDate === dayItem.date;
                  const hasAuctions = dayItem.total > 0;
                  const dateObj = new Date(dayItem.date);
                  const dayOfWeek = dateObj.getDay();
                  const isSun = dayOfWeek === 0;
                  const isSat = dayOfWeek === 6;

                  return (
                    <div
                      key={dayItem.date}
                      onClick={() => hasAuctions && handleSelectDay(dayItem.date)}
                      className={`min-h-[52px] sm:min-h-[115px] p-1 sm:p-2 rounded-lg border flex flex-col justify-between transition-all select-none ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#1B4F8A] shadow-md ring-2 ring-[#1B4F8A]/30'
                          : isToday
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                          : hasAuctions
                          ? 'bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 hover:border-[#1B4F8A] hover:shadow-sm cursor-pointer'
                          : 'bg-slate-50/30 dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800/50 text-slate-300 dark:text-zinc-600'
                      }`}
                    >
                      {/* Day Top Bar */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                          isSun ? 'text-rose-600 dark:text-rose-400' : isSat ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          {dayItem.dayNumber}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold px-1 rounded bg-amber-500 text-white">
                            本日
                          </span>
                        )}
                      </div>

                      {/* Day Content Badges */}
                      <div className="mt-1 flex-1 flex flex-col justify-end">
                        {hasAuctions ? (
                          <>
                            {/* Desktop view */}
                            <div className="hidden sm:block space-y-1">
                              <div className="w-full text-center py-0.5 px-1 rounded text-[10px] font-bold bg-[#1B4F8A] text-white dark:bg-blue-600 truncate shadow-xs font-mono tabular-nums">
                                全国 {dayItem.total}
                              </div>

                              {/* Prefecture Chips (Show up to 2-3) */}
                              <div className="flex flex-wrap gap-0.5 max-h-[46px] overflow-hidden">
                                {dayItem.prefectures.slice(0, 2).map(p => (
                                  <span
                                    key={p.prefecture}
                                    className="inline-block text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 truncate max-w-full font-medium font-mono tabular-nums"
                                  >
                                    {p.prefecture.replace(/都|府|県/g, '')} {p.count}
                                  </span>
                                ))}
                                {dayItem.prefectures.length > 2 && (
                                  <span className="text-[8px] text-slate-400 font-mono px-0.5 tabular-nums">
                                    +{dayItem.prefectures.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mobile compact dot badge with count */}
                            <div className="sm:hidden flex items-center justify-center pt-0.5">
                              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold bg-[#1B4F8A] text-white font-mono tabular-nums shadow-2xs">
                                {dayItem.total}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-300 dark:text-zinc-600 text-center py-0.5 sm:py-2">
                            -
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. SELECTED DAY PROPERTIES ACCORDION / DRAWER */}
          {selectedDate && (
            <div className="bg-white dark:bg-zinc-900 border border-[#1B4F8A]/30 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1B4F8A] dark:bg-blue-900/60 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedDate.replace(/-/g, '/')}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {mode === 'end_date' ? '入札締切日' : '入札開始日'}の出品物件一覧
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    該当物件数: <strong className="text-[#1B4F8A] dark:text-blue-400">{dayProperties.length}</strong> 件
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/?keyword=&isClosingSoon=false`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  >
                    <span>条件指定で全件検索</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
                  >
                    閉じる ✕
                  </button>
                </div>
              </div>

              {loadingDayProps ? (
                <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
                  物件データを読み込んでいます...
                </div>
              ) : dayProperties.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  該当する物件は見つかりませんでした。
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {dayProperties.map(prop => (
                    <div
                      key={prop.sale_unit_id}
                      className="border border-slate-200/80 dark:border-zinc-800 rounded-lg p-3 hover:border-[#1B4F8A] hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors flex gap-3"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden shrink-0 relative">
                        {prop.thumbnailUrl ? (
                          <img
                            src={prop.thumbnailUrl}
                            alt={prop.address}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            No Image
                          </div>
                        )}
                        <span className={`absolute top-1 left-1 text-[8px] font-bold px-1 rounded ${
                          prop.source_provider === 'BIT'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {prop.source_provider}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                              {prop.property_type}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {prop.court_name || prop.managing_authority}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {prop.address}
                          </p>
                          {prop.nearest_station && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {prop.nearest_station} {prop.walk_time_to_station ? `(徒歩${prop.walk_time_to_station}分)` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                          <div>
                            <span className="text-[9px] text-slate-400 block leading-none">売却基準価額</span>
                            <span className="font-extrabold text-sm text-[#1B4F8A] dark:text-blue-400 font-mono">
                              {prop.starting_price ? `¥${prop.starting_price.toLocaleString()}` : '価額未定'}
                            </span>
                          </div>
                          <Link
                            href={`/property/${prop.sale_unit_id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                          >
                            詳細を見る
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. SEO & KNOWLEDGE HUB SILO (Bottom Explanation & Backlinks) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 sm:p-7 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
            不動産競売・公売の売却スケジュールと入札の流れ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            競売（地方裁判所 BIT）および公売（国税庁 NTA）に参加するにあたって、知っておくべき重要期日とスケジュール管理の基本を解説します。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              1. 入札期間 (入札締切)
            </h3>
            <p className="leading-relaxed">
              裁判所または税務署に入札書を提出する期間（通常1〜2週間）。期間内に入札保証金を振込み、必要書類を提出する必要があります。締切日を1日でも過ぎると入札は無効となります。
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-emerald-600" />
              2. 開札期日 (結果発表)
            </h3>
            <p className="leading-relaxed">
              入札締切から約1週間後に開かれた法廷で開札が行われ、最高価買受申出人（最高落札者）が決定されます。落札結果データベースでは落札率や入札社数を分析可能です。
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              3. 特別売却期間
            </h3>
            <p className="leading-relaxed">
              期間入札で入札者が現れなかった場合、一定期間先着順で売却基準価額にて購入申し込みができる制度です。格安物件を競合なしで獲得できるチャンスがあります。
            </p>
          </div>
        </div>

        {/* Internal Backlink Silos Matrix */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">
            全国主要エリアの競売・公売物件一覧
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {['東京都', '神奈川県', '埼玉県', '千葉県', '大阪府', '兵庫県', '愛知県', '福岡県', '北海道', '静岡県', '広島県', '宮城県'].map(pref => (
              <Link
                key={pref}
                href={`/search/area/${encodeURIComponent(pref)}`}
                className="px-2.5 py-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 hover:border-[#1B4F8A] hover:text-[#1B4F8A] text-slate-700 dark:text-slate-300 transition-colors"
              >
                {pref}の物件一覧
              </Link>
            ))}
            <Link
              href="/auction-results"
              className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[#1B4F8A] dark:text-blue-300 font-semibold hover:underline"
            >
              過去の落札結果相場 →
            </Link>
            <Link
              href="/map"
              className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[#1B4F8A] dark:text-blue-300 font-semibold hover:underline"
            >
              全国物件マップで探す →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
