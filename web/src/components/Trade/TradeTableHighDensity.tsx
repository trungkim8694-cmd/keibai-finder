'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MlitTransaction } from '@/lib/mlitApi';
import { ChevronLeft, ChevronRight, Train, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin } from 'lucide-react';

interface TradeTableHighDensityProps {
  transactions: MlitTransaction[];
  totalCount: number;
  currentPage: number;
  perPage?: number;
}

type SortField = 'period' | 'price' | 'area';
type SortDirection = 'asc' | 'desc';

// Hàm tính tuổi nhà từ chuỗi niên hiệu Nhật (ví dụ: 昭和62年, 平成15年, 令和2年, 2018年)
function calculateBuildingAge(buildingYearStr?: string): { eraText: string; ageText: string } | null {
  if (!buildingYearStr) return null;

  const currentYear = new Date().getFullYear();
  let westernYear: number | null = null;

  // Xử lý niên hiệu
  if (buildingYearStr.includes('令和')) {
    const num = parseInt(buildingYearStr.replace(/[^\d]/g, '') || '1', 10);
    westernYear = 2018 + num;
  } else if (buildingYearStr.includes('平成')) {
    const num = parseInt(buildingYearStr.replace(/[^\d]/g, '') || '1', 10);
    westernYear = 1988 + num;
  } else if (buildingYearStr.includes('昭和')) {
    const num = parseInt(buildingYearStr.replace(/[^\d]/g, '') || '1', 10);
    westernYear = 1925 + num;
  } else if (buildingYearStr.includes('大正')) {
    const num = parseInt(buildingYearStr.replace(/[^\d]/g, '') || '1', 10);
    westernYear = 1911 + num;
  } else {
    const num = parseInt(buildingYearStr.replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num > 1900 && num <= currentYear) {
      westernYear = num;
    }
  }

  if (!westernYear) {
    return { eraText: buildingYearStr, ageText: '' };
  }

  const age = Math.max(0, currentYear - westernYear);
  return {
    eraText: buildingYearStr,
    ageText: age === 0 ? '新築' : `築${age}年`
  };
}

export default function TradeTableHighDensity({
  transactions,
  totalCount,
  currentPage,
  perPage = 20
}: TradeTableHighDensityProps) {
  const router = useRouter();

  const [sortField, setSortField] = useState<SortField>('period');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    params.set('page', newPage.toString());
    router.push(`/trade-find?${params.toString()}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sắp xếp dữ liệu giao dịch
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'price') {
        valA = Number(a.TradePrice || 0);
        valB = Number(b.TradePrice || 0);
      } else if (sortField === 'area') {
        valA = parseFloat((a.Area || '').replace(/[^\d.]/g, '')) || 0;
        valB = parseFloat((b.Area || '').replace(/[^\d.]/g, '')) || 0;
      } else {
        // Mặc định theo period (ví dụ: '2023年第3四半期')
        return sortDirection === 'desc'
          ? (b.Period || '').localeCompare(a.Period || '')
          : (a.Period || '').localeCompare(b.Period || '');
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [transactions, sortField, sortDirection]);

  // Client-side pagination cho danh sách transactions truyền vào
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedTransactions.slice(start, start + perPage);
  }, [sortedTransactions, currentPage, perPage]);

  const formatPriceMan = (yenStr?: string) => {
    if (!yenStr) return '-';
    const val = Math.round(Number(yenStr) / 10000);
    return `${val.toLocaleString('ja-JP')}万円`;
  };

  const formatUnitPrice = (yenStr?: string, areaStr?: string) => {
    if (!yenStr || !areaStr) return null;
    const cleanArea = parseFloat(areaStr.replace(/[^\d.]/g, ''));
    if (isNaN(cleanArea) || cleanArea <= 0) return null;
    const unitPriceMan = (Number(yenStr) / cleanArea / 10000).toFixed(1);
    const tsuboPriceMan = (Number(yenStr) / (cleanArea / 3.30578) / 10000).toFixed(1);
    return { unitPriceMan, tsuboPriceMan };
  };

  const getCategoryDot = (type?: string) => {
    if (!type) {
      return {
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
        label: 'その他'
      };
    }
    if (type.includes('マンション')) {
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
        dot: 'bg-sky-500',
        label: 'マンション'
      };
    }
    if (type.includes('建物') || type.includes('戸建')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        dot: 'bg-amber-500',
        label: '戸建て'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
      label: '土地'
    };
  };

  return (
    <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg overflow-hidden shadow-xs">
      {/* Header thanh công cụ & Thống kê số lượng */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#0D1117]/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            取引実績データ一覧
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
            {totalCount.toLocaleString('ja-JP')} 件
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>国土交通省 不動産取引情報ライブラリ 同期済</span>
          </span>
        </div>
      </div>

      {/* Desktop Table: Mật độ cao (High Density Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-[#0D1117] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('period')}
                className="py-2.5 px-3 font-semibold w-24 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>取引時期</span>
                  {sortField === 'period' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1B4F8A]" /> : <ArrowDown className="w-3 h-3 text-[#1B4F8A]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th className="py-2.5 px-3 font-semibold w-24">種別</th>
              <th className="py-2.5 px-3 font-semibold">所在地 / 最寄駅・交通</th>
              
              <th
                onClick={() => handleSort('area')}
                className="py-2.5 px-3 font-semibold w-44 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>面積・築年数</span>
                  {sortField === 'area' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1B4F8A]" /> : <ArrowDown className="w-3 h-3 text-[#1B4F8A]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 font-semibold text-right w-40 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>取引総額 / 単価</span>
                  {sortField === 'price' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1B4F8A]" /> : <ArrowDown className="w-3 h-3 text-[#1B4F8A]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-feature-palt">
            {paginatedTransactions.map((t, idx) => {
              const tag = getCategoryDot(t.Type);
              const unit = formatUnitPrice(t.TradePrice, t.Area);
              const cleanArea = t.Area ? parseFloat(t.Area.replace(/[^\d.]/g, '')) : null;
              const tsubo = cleanArea ? (cleanArea / 3.30578).toFixed(1) : null;
              const buildingInfo = calculateBuildingAge(t.BuildingYear);

              return (
                <tr key={idx} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors">
                  {/* 取引時期 */}
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 tabular-nums align-top">
                    {t.Period || '-'}
                  </td>

                  {/* 種別 */}
                  <td className="py-2.5 px-3 align-top">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tag.bg}`}>
                      <span className={`w-1 h-1 rounded-full ${tag.dot}`}></span>
                      {tag.label}
                    </span>
                  </td>

                  {/* 所在地 & Ga gần nhất */}
                  <td className="py-2.5 px-3 align-top">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-[13px] leading-snug">
                      {t.Prefecture || ''}{t.Municipality || ''}{t.DistrictName || ''}
                      {t.Type && <span className="text-xs font-normal text-slate-500 ml-1.5">({t.Type})</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {t.NearestStation && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Train className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                          <span>{t.NearestStation}駅</span>
                          {t.TimeToNearestStation && (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                              徒歩{t.TimeToNearestStation}分
                            </span>
                          )}
                        </span>
                      )}
                      {t.CityPlanning && (
                        <span className="text-slate-400">· {t.CityPlanning}</span>
                      )}
                      {t.FloorPlan && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                          {t.FloorPlan}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 面積・築年数 */}
                  <td className="py-2.5 px-3 align-top text-slate-600 dark:text-slate-300">
                    <div className="tabular-nums font-semibold text-[12px] text-slate-900 dark:text-slate-100">
                      {t.Area ? `${t.Area}㎡` : '-'}
                      {tsubo && <span className="text-[11px] font-normal text-slate-500 ml-1">({tsubo}坪)</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 space-x-1.5">
                      {buildingInfo && (
                        <span>
                          {buildingInfo.eraText}
                          {buildingInfo.ageText && (
                            <span className="text-slate-700 dark:text-slate-300 font-medium ml-1">
                              ({buildingInfo.ageText})
                            </span>
                          )}
                        </span>
                      )}
                      {t.Structure && <span>· {t.Structure}</span>}
                    </div>
                  </td>

                  {/* 取引価格 & Đơn giá */}
                  <td className="py-2.5 px-3 align-top text-right">
                    <div className="text-sm font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                      {formatPriceMan(t.TradePrice)}
                    </div>
                    {unit && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{unit.unitPriceMan}万/㎡</span>
                        <span className="text-slate-400 ml-1">({unit.tsuboPriceMan}万/坪)</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View: Hiển thị tối ưu dạng thẻ trên điện thoại */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
        {paginatedTransactions.map((t, idx) => {
          const tag = getCategoryDot(t.Type);
          const unit = formatUnitPrice(t.TradePrice, t.Area);
          const cleanArea = t.Area ? parseFloat(t.Area.replace(/[^\d.]/g, '')) : null;
          const tsubo = cleanArea ? (cleanArea / 3.30578).toFixed(1) : null;
          const buildingInfo = calculateBuildingAge(t.BuildingYear);

          return (
            <div key={idx} className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tag.bg}`}>
                  <span className={`w-1 h-1 rounded-full ${tag.dot}`}></span>
                  {tag.label}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">{t.Period || '-'}</span>
              </div>

              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {t.Prefecture || ''}{t.Municipality || ''}{t.DistrictName || ''}
              </div>

              {t.NearestStation && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Train className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{t.NearestStation}駅</span>
                  {t.TimeToNearestStation && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                      徒歩{t.TimeToNearestStation}分
                    </span>
                  )}
                </div>
              )}

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-end justify-between text-xs">
                <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div className="tabular-nums font-medium">
                    {t.Area ? `${t.Area}㎡` : '-'}
                    {tsubo && <span className="text-[10px] text-slate-400 ml-1">({tsubo}坪)</span>}
                  </div>
                  {buildingInfo && (
                    <div className="text-[10px] text-slate-500">
                      {buildingInfo.eraText} {buildingInfo.ageText && `(${buildingInfo.ageText})`}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums">
                    {formatPriceMan(t.TradePrice)}
                  </div>
                  {unit && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {unit.unitPriceMan}万円/㎡
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phân trang đồng bộ URL */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-[#0D1117]/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151B22] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>前へ</span>
          </button>

          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium tabular-nums">
            {currentPage} / {totalPages} ページ
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-3 inline-flex items-center gap-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151B22] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <span>次へ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
