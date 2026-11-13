'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  ExternalLink,
  CheckCircle2, 
  Info,
  FileText,
  UserCheck,
  Sparkles,
  Scale,
  Award,
  Globe,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { CompanyClaimModal } from './CompanyClaimModal';
import { CompanyDelistModal } from './CompanyDelistModal';
import { AgencyLeadModal } from '@/components/Detail/AgencyLeadModal';
import { getRealEstateCompanies } from '@/actions/companyActions';

export interface RealEstateCompanyItem {
  id: string;
  houjinNumber?: string | null;
  companyName: string;
  licenseNumber: string;
  prefecture: string;
  city: string;
  address: string;
  postalCode?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isClaimed: boolean;
  isVerified: boolean;
  specialties: string[];
  status: string;
  created_at?: string | Date;
}

interface AgenciesDirectoryClientProps {
  initialCompanies: RealEstateCompanyItem[];
  prefectureCounts?: { prefecture: string; count: number }[];
  initialTotal?: number;
}

const REGION_MAP: Record<string, string[]> = {
  '関東': ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'],
  '関西': ['大阪府', '兵庫県', '京都府', '滋賀県', '奈良県', '和歌山県'],
  '東海・中部': ['愛知県', '静岡県', '岐阜県', '三重県', '新潟県', '長野県', '山梨県', '富山県', '石川県', '福井県'],
  '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
  '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '中国・四国': ['広島県', '岡山県', '山口県', '鳥取県', '島根県', '香川県', '愛媛県', '徳島県', '高知県'],
};

// All 47 Prefectures in standard JIS geographical order (North to South)
const ALL_47_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const SPECIALTIES_LIST = [
  'すべて',
  '宅建免許保有',
  '競売入札代行',
  '明渡し交渉',
  '任意売却',
  '物件調査',
  'リフォーム'
];

export function AgenciesDirectoryClient({ 
  initialCompanies, 
  prefectureCounts = [],
  initialTotal = 26035,
}: AgenciesDirectoryClientProps) {
  const [companies, setCompanies] = useState<RealEstateCompanyItem[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('すべて');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAgenciesCount, setTotalAgenciesCount] = useState<number>(initialTotal);

  // Modals state
  const [claimTarget, setClaimTarget] = useState<RealEstateCompanyItem | null>(null);
  const [delistTarget, setDelistTarget] = useState<RealEstateCompanyItem | null>(null);
  const [leadTarget, setLeadTarget] = useState<{ id: string; name: string } | null>(null);

  // Auto-verification URL toast state
  const [showVerifiedSuccess, setShowVerifiedSuccess] = useState(false);
  const [verifiedCompanyName, setVerifiedCompanyName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verifiedSuccess') === 'true') {
        setShowVerifiedSuccess(true);
        setVerifiedCompanyName(params.get('companyName') || '');
      }
    }
  }, []);

  // Dynamic fetch when user changes prefecture, region, or enters search query
  useEffect(() => {
    let active = true;
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const res = await getRealEstateCompanies({
          prefecture: selectedPrefecture !== 'ALL' ? selectedPrefecture : undefined,
          region: selectedRegion !== 'ALL' && selectedPrefecture === 'ALL' ? selectedRegion : undefined,
          query: searchQuery,
          limit: 60,
        });

        if (active && res.success && res.companies) {
          setCompanies(res.companies);
          if (res.total) setTotalAgenciesCount(res.total);
        }
      } catch (err) {
        console.error('Failed to fetch agencies:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    // Debounce to avoid excessive API calls on rapid keystrokes
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedPrefecture, selectedRegion, searchQuery]);

  // Available prefectures: when a region is selected, show that region's prefectures.
  // When "全国" (ALL) is selected, show all 47 prefectures nationwide in standard JIS order!
  const availablePrefectures = useMemo(() => {
    if (selectedRegion !== 'ALL') {
      return REGION_MAP[selectedRegion] || [];
    }
    return ALL_47_PREFECTURES;
  }, [selectedRegion]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // 1. Status Filter
      if (statusFilter === 'VERIFIED' && !company.isVerified) return false;
      if (statusFilter === 'UNVERIFIED' && company.isVerified) return false;

      // 2. Specialty Filter
      if (selectedSpecialty !== 'すべて') {
        if (!company.specialties || !company.specialties.some(s => s.includes(selectedSpecialty))) {
          return false;
        }
      }

      // 3. Prefecture Filter (client refinement if needed)
      if (selectedPrefecture !== 'ALL') {
        if (company.prefecture !== selectedPrefecture) return false;
      }

      return true;
    });
  }, [companies, statusFilter, selectedSpecialty, selectedPrefecture]);

  // Counts summary
  const verifiedCount = useMemo(() => companies.filter(c => c.isVerified).length, [companies]);
  const unverifiedCount = useMemo(() => companies.filter(c => !c.isVerified).length, [companies]);

  // Accurate total count matching selected area/filters
  const displayTotalCount = useMemo(() => {
    if (searchQuery.trim()) {
      return totalAgenciesCount;
    }
    if (selectedPrefecture !== 'ALL') {
      const match = prefectureCounts.find(p => p.prefecture === selectedPrefecture);
      if (match) return match.count;
      return totalAgenciesCount;
    }
    if (selectedRegion !== 'ALL') {
      const regPrefs = REGION_MAP[selectedRegion] || [];
      const sum = prefectureCounts
        .filter(p => regPrefs.includes(p.prefecture))
        .reduce((acc, curr) => acc + curr.count, 0);
      if (sum > 0) return sum;
      return totalAgenciesCount;
    }
    const allSum = prefectureCounts.reduce((acc, curr) => acc + curr.count, 0);
    return allSum > 0 ? allSum : totalAgenciesCount;
  }, [searchQuery, selectedPrefecture, selectedRegion, prefectureCounts, totalAgenciesCount]);

  return (
    <div className="w-full space-y-6">
      {/* 0. AUTO-VERIFIED CELEBRATORY BANNER */}
      {showVerifiedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                🎉【公式認証完了】{verifiedCompanyName} のオーナー確認が完了しました！
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                公式認証マーク（宅建免許確認済）、選択された専門分野タグ、および企業PR文が即座に反映されました。
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowVerifiedSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1.5 rounded-md hover:bg-emerald-100/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. PUBLIC COMPLIANCE & CLAIM BANNER */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300">
                <ShieldCheck className="w-3 h-3" />
                公的登記・宅建免許データベース連携
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                全国 {totalAgenciesCount.toLocaleString()} 社掲載中
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
              国土交通省・都道府県公開の宅地建物取引業者名簿および国税庁法人番号公的データに基づき掲載しています。不動産事業者様は無料のオーナー認証手続きを行うことで、公式認証マークの獲得や企業情報の更新、競売物件ページでの優先推薦表示が可能です。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const sampleUnverified = initialCompanies.find(c => !c.isVerified) || initialCompanies[0];
                setClaimTarget(sampleUnverified);
              }}
              className="px-3.5 py-2 rounded-md bg-[#1B4F8A] hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>無料オーナー確認申請</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = initialCompanies[0];
                setDelistTarget(sample);
              }}
              className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              掲載修正・削除申請
            </button>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & FILTER SECTION */}
      <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="会社名、宅建免許番号、法人番号（13桁）、所在地（区市町村）、得意分野で検索..."
            className="w-full pl-10 pr-16 py-2.5 text-xs bg-slate-50/70 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded transition-colors"
            >
              クリア
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">表示区分:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              すべて ({displayTotalCount.toLocaleString()})
            </button>
            {verifiedCount > 0 && (
              <>
                <button
                  onClick={() => setStatusFilter('VERIFIED')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                    statusFilter === 'VERIFIED'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>公式認証企業（{verifiedCount}）</span>
                </button>
                <button
                  onClick={() => setStatusFilter('UNVERIFIED')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                    statusFilter === 'UNVERIFIED'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Info className="w-3 h-3" />
                  <span>公的登記・未確認（{unverifiedCount}）</span>
                </button>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {isLoading && <Loader2 className="w-3 h-3 text-[#1B4F8A] animate-spin" />}
            該当: <span className="font-bold text-[#1B4F8A] dark:text-blue-400 text-xs">{displayTotalCount.toLocaleString()}</span> 社
            {displayTotalCount > filteredCompanies.length && (
              <span className="text-slate-400 text-[10px]">（上位{filteredCompanies.length}社表示）</span>
            )}
          </div>
        </div>

        {/* Region & Prefecture Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">地方・都道府県:</span>
          <button
            onClick={() => {
              setSelectedRegion('ALL');
              setSelectedPrefecture('ALL');
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              selectedRegion === 'ALL' && selectedPrefecture === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            全国
          </button>
          {Object.keys(REGION_MAP).map((region) => {
            const isRegActive = selectedRegion === region;
            return (
              <button
                key={region}
                onClick={() => {
                  setSelectedRegion(region);
                  setSelectedPrefecture('ALL');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  isRegActive && selectedPrefecture === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

        {/* Prefecture pills if a region or all is active */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">都道府県:</span>
          {availablePrefectures.map((pref) => {
            const countObj = prefectureCounts.find(p => p.prefecture === pref);
            const countLabel = countObj ? ` (${countObj.count})` : '';
            const isActive = selectedPrefecture === pref;
            return (
              <button
                key={pref}
                onClick={() => {
                  setSelectedPrefecture(isActive ? 'ALL' : pref);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  isActive
                    ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                {pref}{countLabel}
              </button>
            );
          })}
        </div>

        {/* Specialties filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">専門分野:</span>
          {SPECIALTIES_LIST.map((spec) => {
            const isSpecActive = selectedSpecialty === spec;
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isSpecActive
                    ? 'bg-blue-100 dark:bg-blue-900/60 text-[#1B4F8A] dark:text-blue-200 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. COMPANIES LIST GRID */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            条件に一致する不動産会社が見つかりませんでした
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            検索条件を緩めるか、「クリア」ボタンを押して全件一覧をご確認ください。
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPrefecture('ALL');
              setSelectedRegion('ALL');
              setStatusFilter('ALL');
              setSelectedSpecialty('すべて');
            }}
            className="mt-2 px-4 py-1.5 rounded-md bg-[#1B4F8A] text-white text-xs font-medium hover:bg-blue-800 transition-colors"
          >
            フィルターをリセット
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company) => {
            return (
              <div
                key={company.id}
                className={`flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-lg border transition-all hover:shadow-md ${
                  company.isVerified
                    ? 'border-blue-200 dark:border-blue-900/60 shadow-xs ring-1 ring-blue-500/10'
                    : 'border-slate-200 dark:border-zinc-800 shadow-none'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  {/* Status Badge & Region */}
                  <div className="flex items-center justify-between gap-2">
                    {company.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        公式認証企業（宅建免許確認済）
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        公的登記・宅建免許情報
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {company.prefecture} {company.city}
                    </span>
                  </div>

                  {/* Company Name & Houjin Number */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {company.companyName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>免許: {company.licenseNumber}</span>
                      {company.houjinNumber && (
                        <span>| 法人番号: {company.houjinNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span className="line-clamp-1">{company.address}</span>
                  </div>

                  {/* Specialties Pills */}
                  {(() => {
                    const displaySpecialties = company.isVerified
                      ? (company.specialties && company.specialties.length > 0 ? company.specialties : ['宅建免許保有'])
                      : ['宅建免許保有'];
                    return (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {displaySpecialties.map((spec, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              spec === '宅建免許保有'
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-300'
                                : 'bg-slate-50 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Description snippet */}
                  {company.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed pt-1">
                      {company.description}
                    </p>
                  )}

                  {/* Contacts */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {company.phone ? (
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${company.phone}`} className="hover:underline font-mono">
                          {company.phone}
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">電話番号: 登記情報参照</span>
                    )}

                    {/* Kigyoulist Corporate Profile & SEO Backlink */}
                    {company.houjinNumber ? (
                      <a
                        href={`https://kigyoulist.com/ja/company/${company.houjinNumber}`}
                        target="_blank"
                        rel="noopener"
                        title={`${company.companyName}の法人登記・信用・企業評点をkigyoulist.comで確認`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4F8A] dark:text-blue-400 hover:underline group/link"
                      >
                        <Building2 className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                        <span>企業詳細（登記・評点）</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <a
                        href={`https://kigyoulist.com/ja/search?q=${encodeURIComponent(company.companyName)}`}
                        target="_blank"
                        rel="noopener"
                        title={`${company.companyName}をkigyoulist.comで検索`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4F8A] dark:text-blue-400 hover:underline group/link"
                      >
                        <Building2 className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                        <span>企業詳細（登記・評点）</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                  {company.isVerified ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setLeadTarget({ id: company.id, name: company.companyName })}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1B4F8A] hover:bg-blue-800 text-white font-semibold text-xs py-2 rounded-md transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>入札・売買の無料相談</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelistTarget(company)}
                        className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 block transition-colors"
                      >
                        掲載情報の修正・削除申請
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setClaimTarget(company)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-[#1B4F8A] dark:text-blue-300 font-semibold text-xs py-2 rounded-md transition-colors shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                        <span>オーナー確認（無料）</span>
                      </button>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>公的登記に基づく自動掲載</span>
                        <button
                          type="button"
                          onClick={() => setDelistTarget(company)}
                          className="hover:underline text-slate-500 dark:text-slate-400"
                        >
                          修正・削除申請
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. FOOTER DISCLAIMER & OPT-OUT NOTICE */}
      <section className="bg-slate-100/70 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>掲載データおよび免責事項・オプトアウト（削除）について</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          当データベースに掲載されている企業情報は、国土交通省の宅地建物取引業者名簿・各都道府県の許認可情報および国税庁法人番号公的データ等の一般に公開されている情報に基づいて作成されています。当社は各企業との提携関係や推薦を保証するものではありません。情報の最新性には配慮しておりますが、万一事実と異なる情報が含まれる場合や掲載停止をご希望の場合は、各カード下部の「掲載情報の修正・削除申請」よりご連絡いただければ速やかに対応いたします。
        </p>
      </section>

      {/* MODALS */}
      <CompanyClaimModal
        isOpen={Boolean(claimTarget)}
        onClose={() => setClaimTarget(null)}
        company={claimTarget}
      />

      <CompanyDelistModal
        isOpen={Boolean(delistTarget)}
        onClose={() => setDelistTarget(null)}
        company={delistTarget}
      />

      {leadTarget && (
        <AgencyLeadModal
          isOpen={Boolean(leadTarget)}
          onClose={() => setLeadTarget(null)}
          saleUnitId={undefined}
          agencyProfileId={leadTarget.id}
          agencyName={leadTarget.name}
        />
      )}
    </div>
  );
}
