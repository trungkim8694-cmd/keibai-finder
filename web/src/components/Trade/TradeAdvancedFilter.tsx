'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RotateCcw, SlidersHorizontal, ChevronDown, Building2, MapPin } from 'lucide-react';

export const JAPAN_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

interface TradeAdvancedFilterProps {
  initialPref?: string;
  initialCity?: string;
  initialType?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialMaxWalk?: string;
  initialBuildingAge?: string;
}

export default function TradeAdvancedFilter({
  initialPref = '',
  initialCity = '',
  initialType = '戸建て',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialMaxWalk = '',
  initialBuildingAge = '',
}: TradeAdvancedFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pref, setPref] = useState(initialPref || searchParams.get('pref') || '');
  const [city, setCity] = useState(initialCity || searchParams.get('city') || '');
  const [type, setType] = useState(initialType || searchParams.get('type') || '戸建て');
  const [minPrice, setMinPrice] = useState(initialMinPrice || searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice || searchParams.get('maxPrice') || '');
  const [maxWalk, setMaxWalk] = useState(initialMaxWalk || searchParams.get('maxWalk') || '');
  const [buildingAge, setBuildingAge] = useState(initialBuildingAge || searchParams.get('buildingAge') || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync state if searchParams change externally
  useEffect(() => {
    setPref(searchParams.get('pref') || initialPref || '');
    setCity(searchParams.get('city') || initialCity || '');
    setType(searchParams.get('type') || initialType || '戸建て');
    setMinPrice(searchParams.get('minPrice') || initialMinPrice || '');
    setMaxPrice(searchParams.get('maxPrice') || initialMaxPrice || '');
    setMaxWalk(searchParams.get('maxWalk') || initialMaxWalk || '');
    setBuildingAge(searchParams.get('buildingAge') || initialBuildingAge || '');
  }, [searchParams, initialPref, initialCity, initialType, initialMinPrice, initialMaxPrice, initialMaxWalk, initialBuildingAge]);

  // Expand filter section automatically if any sub-filter is active
  useEffect(() => {
    if (minPrice || maxPrice || maxWalk || buildingAge) {
      setIsExpanded(true);
    }
  }, [minPrice, maxPrice, maxWalk, buildingAge]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    let resolvedPref = pref;
    let resolvedCity = city.trim();

    // Tự động phân tách nếu người dùng nhập cả tỉnh vào ô thành phố (VD: "東京都新宿区")
    if (!resolvedPref && resolvedCity) {
      const match = resolvedCity.match(/^(.{2,3}[都道府県])(.*)$/);
      if (match) {
        resolvedPref = match[1];
        resolvedCity = match[2].trim();
      }
    }

    const params = new URLSearchParams();
    if (resolvedPref) params.set('pref', resolvedPref);
    if (resolvedCity) params.set('city', resolvedCity);
    if (type) params.set('type', type);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (maxWalk) params.set('maxWalk', maxWalk);
    if (buildingAge) params.set('buildingAge', buildingAge);
    params.set('page', '1');

    router.push(`/trade-find?${params.toString()}`);
  };

  const handleReset = () => {
    setPref('');
    setCity('');
    setType('戸建て');
    setMinPrice('');
    setMaxPrice('');
    setMaxWalk('');
    setBuildingAge('');
    router.push('/trade-find');
  };

  const hasSubFilters = Boolean(minPrice || maxPrice || maxWalk || buildingAge);

  return (
    <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-4 sm:p-5 shadow-xs">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Hàng 1: Bộ lọc chính (Tỉnh, Quận Huyện, Loại BĐS, Nút tìm kiếm) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* 都道府県 */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>都道府県</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <select
              value={pref}
              onChange={(e) => setPref(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1B4F8A] dark:focus:ring-blue-500 transition-all cursor-pointer font-medium"
            >
              <option value="">都道府県を選択</option>
              {JAPAN_PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 市区町村 */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>市区町村名</span>
              <span className="text-slate-400 font-normal text-[11px]">(例: 新宿区, 富山市)</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="市区町村名を入力"
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1B4F8A] dark:focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* 物件種別 */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              物件種別
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1B4F8A] dark:focus:ring-blue-500 transition-all cursor-pointer font-medium"
            >
              <option value="戸建て">一戸建て (土地と建物)</option>
              <option value="マンション">中古マンション等</option>
              <option value="土地">土地 (更地・宅地)</option>
            </select>
          </div>

          {/* Nút hành động Submit */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-4 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] active:bg-[#0F2D52] rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>条件で検索</span>
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi mở rộng bộ lọc nâng cao */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>詳細絞り込み (価格帯・駅徒歩・築年数 / 耐震基準)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {hasSubFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>条件をクリア</span>
            </button>
          )}
        </div>

        {/* Hàng 2: Bộ lọc mở rộng (Chi tiết B2B) */}
        {isExpanded && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-dashed border-slate-200 dark:border-slate-800">
            {/* Khoảng giá */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                価格帯 (万円)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="下限なし"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-8 px-2 text-xs tabular-nums bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                />
                <span className="text-slate-400 text-xs shrink-0">〜</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="上限なし"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-8 px-2 text-xs tabular-nums bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                />
              </div>
            </div>

            {/* Khoảng cách tới ga */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                最寄駅からの徒歩分数
              </label>
              <select
                value={maxWalk}
                onChange={(e) => setMaxWalk(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#1B4F8A] cursor-pointer"
              >
                <option value="">指定なし</option>
                <option value="5">徒歩5分以内 (駅近)</option>
                <option value="10">徒歩10分以内</option>
                <option value="15">徒歩15分以内</option>
                <option value="20">徒歩20分以内</option>
              </select>
            </div>

            {/* Tuổi nhà / Tiêu chuẩn động đất */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                築年数 / 耐震基準
              </label>
              <select
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-slate-50 dark:bg-[#0D1117] border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#1B4F8A] cursor-pointer"
              >
                <option value="">指定なし</option>
                <option value="5">新築・築5年以内</option>
                <option value="10">築10年以内</option>
                <option value="20">築20年以内</option>
                <option value="30">築30年以内 (新耐震基準)</option>
                <option value="old_quake">昭和56年以前 (旧耐震基準の目安)</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
