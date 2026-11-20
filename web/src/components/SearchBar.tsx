'use client';

import { useState, Fragment, useEffect, useTransition, useMemo } from 'react';
import { Transition, Popover, Portal } from '@headlessui/react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon, MapIcon, StarIcon } from '@heroicons/react/20/solid';
import { RotateCcw, Bookmark, Coins, Building2, Scale, Train, MapPin, Check } from 'lucide-react';
import { getSearchSuggestions, getFacetedStats, SearchSuggestion } from '../actions/propertyActions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import useSWR from 'swr';

export interface Station {
  id: string;
  name_ja: string;
  line_name: string | null;
  lat: number;
  lng: number;
}

export interface SearchFilters {
  radiusKm?: number;
  types?: string[];
  minPrice?: number;
  maxPrice?: number;
  newOnly?: boolean;
  prefecture?: string;
  prefectures?: string[];
  provider?: string;
  providers?: string[];
  maxWalkTime?: number;
  sortBy?: 'newest' | 'priceAsc' | 'areaDesc' | 'viewsDesc' | 'bid_start_asc' | 'bid_start_desc';
  sort?: string;
  keyword?: string;
  isClosingSoon?: boolean;
  minArea?: number;
  managingAuthority?: string;
  courtName?: string;
  lineName?: string;
  stationName?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  state: {
    keyword: string;
    types: string[];
    selectedRegions: string[];
    selectedPrefectures: string[];
    isNationwide: boolean;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    isUrgent: boolean;
    provider: string;
    activeProviders: string[];
    walkTime?: number;
    sort: 'newest' | 'views' | 'ending' | 'priceAsc' | 'areaDesc' | 'gap_desc';
    selectedLine: string;
    selectedStation: string;
    selectedCourt: string;
    selectedNtaAuth: string;
  };
}

export interface SearchBarProps {
  onSearch: (f: SearchFilters) => void;
  onMobileFilterOpenChange?: (isOpen: boolean) => void;
}

export default function SearchBar({ onSearch, onMobileFilterOpenChange }: SearchBarProps) {
  const {refs, floatingStyles} = useFloating({
    placement: 'bottom-end',
    middleware: [offset(10), flip(), shift({ padding: 16 })],
  });

  const {refs: bitRefs, floatingStyles: bitStyles} = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  });

  const {refs: ntaRefs, floatingStyles: ntaStyles} = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  });

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Native debounce (replaces use-debounce package)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = keyword.trim();
      setDebouncedKeyword(trimmed);
      if (trimmed.length >= 2) {
        getSearchSuggestions(trimmed).then(setSuggestions).catch(() => setSuggestions([]));
        setIsSuggestionsOpen(true);
      } else {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);
  const handleSuggestionSelect = (sugg: SearchSuggestion) => {
    setKeyword(sugg.text);
    setDebouncedKeyword(sugg.text);
    setIsSuggestionsOpen(false);
    setIsInputFocused(false);
    
    // Explicit Database Text Filter Fallback
    const overrides: any = { keyword: sugg.text };
    if (sugg.type === 'STATION') overrides.stationName = sugg.text;
    else if (sugg.type === 'CITY' && sugg.subtext) overrides.prefecture = sugg.subtext;
    else if (sugg.type === 'LINE') overrides.lineName = sugg.text;
    else if (sugg.type === 'COURT') {
      if (sugg.subtext?.includes('公売')) overrides.managingAuthority = sugg.text;
      else overrides.courtName = sugg.text;
    }
    
    triggerSearch(overrides);
  };
  const [, startTransition] = useTransition();

  // Search state
  const [types, setTypes] = useState<string[]>([]);
  
  // Drill down states (Region & Prefecture logic)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [isNationwide, setIsNationwide] = useState(true);
  const [viewingRegion, setViewingRegion] = useState('北海道・東北');
  
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [isUrgent, setIsUrgent] = useState(false); // Time filter
  const [provider, setProvider] = useState<string>('ALL'); // Xoá dần hoặc giữ nguyên cho components cũ
  const [activeProviders, setActiveProviders] = useState<string[]>(['BIT', 'NTA', 'KSI', 'MOF']); // Master source toggle
  
  const [walkTime, setWalkTime] = useState<number | undefined>();
  const [minArea, setMinArea] = useState<number | undefined>();
  const [sort, setSort] = useState<'newest' | 'views' | 'ending' | 'priceAsc' | 'areaDesc' | 'gap_desc'>('newest');
  

  const [isExpanded, setIsExpanded] = useState(true); // Search collapse state
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');

  // Authority Dropdown state
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');
  const [selectedNtaAuth, setSelectedNtaAuth] = useState<string>('ALL');
  const [isBitOpen, setIsBitOpen] = useState(false);
  const [isNtaOpen, setIsNtaOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleSetMobileFilterOpen = (open: boolean) => {
    setIsMobileFilterOpen(open);
    onMobileFilterOpenChange?.(open);
  };
  
  const router = useRouter();
  const pathname = usePathname() || '/map';
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeSearchFilters: SearchFilters = useMemo(() => {
    const filters: SearchFilters = { types };
    if (debouncedKeyword) filters.keyword = debouncedKeyword;
    filters.minPrice = minPrice;
    filters.maxPrice = maxPrice;
    filters.isClosingSoon = isUrgent;
    filters.prefectures = !isNationwide && selectedPrefectures.length > 0 ? selectedPrefectures : undefined;
    filters.provider = provider !== 'ALL' ? provider : undefined;
    filters.providers = activeProviders;
    filters.maxWalkTime = walkTime;
    filters.minArea = minArea;
    filters.lineName = selectedLine !== 'ALL' ? selectedLine : undefined;
    filters.stationName = selectedStation !== 'ALL' ? selectedStation : undefined;
    filters.courtName = selectedCourt !== 'ALL' ? selectedCourt : undefined;
    filters.managingAuthority = selectedNtaAuth !== 'ALL' ? selectedNtaAuth : undefined;
    return filters;
  }, [types, debouncedKeyword, minPrice, maxPrice, isUrgent, isNationwide, selectedPrefectures, provider, activeProviders, walkTime, minArea, selectedLine, selectedStation, selectedCourt, selectedNtaAuth]);

  const { data: stats } = useSWR(
    isMounted ? ['faceted', JSON.stringify(activeSearchFilters)] : null,
    () => getFacetedStats(activeSearchFilters),
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const railData = stats?.railData || [];
  const typeStats = stats?.typeStats || {};
  const areaStats: Record<string, number> = (stats?.areaStats as Record<string, number>) || {};
  const authorityData = stats?.authorityStats || { bit: [], nta: [] };
  
  useEffect(() => {
     if (isMounted) {
        const initialOverrides: any = {};

        const lineParam = searchParams.get('line') || searchParams.get('lineName');
        const prefsParam = searchParams.get('prefs');
        const prefParam = searchParams.get('pref') || searchParams.get('prefecture');
        const keywordParam = searchParams.get('keyword');
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const closingSoonParam = searchParams.get('isClosingSoon');
        const providerParam = searchParams.get('provider');
        const typesParam = searchParams.getAll('types[]').length > 0
          ? searchParams.getAll('types[]')
          : searchParams.getAll('types');
        const sortParam = searchParams.get('sort') as 'newest' | 'views' | 'ending' | 'priceAsc' | 'areaDesc' | 'gap_desc' | null;

        if (lineParam) {
           setSelectedLine(lineParam);
           initialOverrides.lineName = lineParam;
        }
        if (prefsParam) {
           const arr = prefsParam.split(',').filter(Boolean);
           setSelectedPrefectures(arr);
           setIsNationwide(arr.length === 0);
           initialOverrides.prefectures = arr;
           const fullRegions = regions.filter(r => prefectures[r] && prefectures[r].every((p: string) => arr.includes(p)));
           setSelectedRegions(fullRegions);
           const firstMatchedRegion = regions.find(r => prefectures[r] && prefectures[r].some((p: string) => arr.includes(p)));
           if (firstMatchedRegion) setViewingRegion(firstMatchedRegion);
        } else if (prefParam) {
           const arr = prefParam.split(',').filter(Boolean);
           setSelectedPrefectures(arr);
           setIsNationwide(arr.length === 0);
           initialOverrides.prefectures = arr;
           const fullRegions = regions.filter(r => prefectures[r] && prefectures[r].every((p: string) => arr.includes(p)));
           setSelectedRegions(fullRegions);
           const firstMatchedRegion = regions.find(r => prefectures[r] && prefectures[r].some((p: string) => arr.includes(p)));
           if (firstMatchedRegion) setViewingRegion(firstMatchedRegion);
        }
        if (keywordParam) {
           setKeyword(keywordParam);
           setDebouncedKeyword(keywordParam);
           initialOverrides.keyword = keywordParam;
        }
        if (minPriceParam && !isNaN(Number(minPriceParam))) {
           const val = Number(minPriceParam);
           setMinPrice(val);
           initialOverrides.minPrice = val;
        }
        if (maxPriceParam && !isNaN(Number(maxPriceParam))) {
           const val = Number(maxPriceParam);
           setMaxPrice(val);
           initialOverrides.maxPrice = val;
        }
        if (closingSoonParam === 'true') {
           setIsUrgent(true);
           initialOverrides.isClosingSoon = true;
        }
        if (providerParam && ['BIT', 'NTA', 'KSI', 'MOF'].includes(providerParam)) {
           setProvider(providerParam);
           setActiveProviders([providerParam]);
           initialOverrides.provider = providerParam;
           initialOverrides.providers = [providerParam];
        }
        if (typesParam && typesParam.length > 0) {
           const parsedTypes = typesParam.flatMap(t => t.split(',')).filter(Boolean);
           if (parsedTypes.length > 0) {
              setTypes(parsedTypes);
              initialOverrides.types = parsedTypes;
           }
        }
        if (sortParam) {
           setSort(sortParam);
           initialOverrides.sort = sortParam;
        }
        
        if (Object.keys(initialOverrides).length > 0) {
           triggerSearch(initialOverrides);
        }
     }
  }, [isMounted]);



  const triggerSearch = (overrides: Partial<SearchFilters> = {}) => {
    startTransition(() => {
      const filters: SearchFilters = { types };
      if (keyword) filters.keyword = keyword;
      filters.minPrice = minPrice;
      filters.maxPrice = maxPrice;
      filters.isClosingSoon = isUrgent;
      filters.prefectures = !isNationwide && selectedPrefectures.length > 0 ? selectedPrefectures : undefined;
      filters.provider = provider !== 'ALL' ? provider : undefined;
      filters.providers = activeProviders;
      filters.maxWalkTime = walkTime;
      filters.minArea = minArea;
      filters.sort = sort;
      filters.lineName = selectedLine !== 'ALL' ? selectedLine : undefined;
      filters.stationName = selectedStation !== 'ALL' ? selectedStation : undefined;
      filters.courtName = selectedCourt !== 'ALL' ? selectedCourt : undefined;
      filters.managingAuthority = selectedNtaAuth !== 'ALL' ? selectedNtaAuth : undefined;

      onSearch({ ...filters, ...overrides });
    });
  };

  const handleApply = async (overrides?: any) => {
    // Prevent React Synthetic Event from being treated as search filters array
    const actualOverrides = (overrides && overrides.nativeEvent) ? undefined : overrides;
    
    // Explicitly collect current state to avoid any transition/closure lag
    const currentFilters: SearchFilters = {
      types,
      keyword,
      minPrice,
      maxPrice,
      isClosingSoon: isUrgent,
      prefectures: !isNationwide && selectedPrefectures.length > 0 ? selectedPrefectures : undefined,
      provider: provider !== 'ALL' ? provider : undefined,
      providers: activeProviders,
      maxWalkTime: walkTime,
      minArea,
      sort,
      lineName: selectedLine !== 'ALL' ? selectedLine : undefined,
      stationName: selectedStation !== 'ALL' ? selectedStation : undefined,
      courtName: selectedCourt !== 'ALL' ? selectedCourt : undefined,
      managingAuthority: selectedNtaAuth !== 'ALL' ? selectedNtaAuth : undefined,
    };

    const finalFilters = { ...currentFilters, ...actualOverrides };

    onSearch(finalFilters);
  };

  const handleClear = () => {
    setKeyword('');
    setTypes([]);
    setSelectedRegions([]);
    setSelectedPrefectures([]);
    setIsNationwide(true);
    setViewingRegion('北海道・東北');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinArea(undefined);
    setIsUrgent(false);
    setProvider('ALL');
    setActiveProviders(['BIT', 'NTA', 'KSI', 'MOF']);
    setWalkTime(undefined);
    setSelectedLine('ALL');
    setSelectedStation('ALL');
    setSelectedCourt('ALL');
    setSelectedNtaAuth('ALL');
    setSort('newest');
    onSearch({});
    router.replace(pathname, { scroll: false });
  };

  useEffect(() => {
    const fn = () => handleClear();
    window.addEventListener('clear-all-filters', fn);
    return () => window.removeEventListener('clear-all-filters', fn);
  }, []);

  const handleToggleProvider = (prov: string) => {
    let newActive = [...activeProviders];
    if (newActive.includes(prov)) {
      if (newActive.length > 1) {
        newActive = newActive.filter(p => p !== prov);
      }
    } else {
      newActive.push(prov);
    }
    setActiveProviders(newActive);
    triggerSearch({ providers: newActive });
  };

  // --- Saved Filters Logic ---
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  useEffect(() => {
    if (isMounted) {
      try {
        const stored = localStorage.getItem('kb_saved_filters');
        if (stored) setSavedFilters(JSON.parse(stored));
      } catch (e) { console.error('Failed to load filters', e); }
    }
  }, [isMounted]);

  const updateSavedFilters = (newFilters: SavedFilter[]) => {
    setSavedFilters(newFilters);
    try {
      localStorage.setItem('kb_saved_filters', JSON.stringify(newFilters));
    } catch {}
  };



  const handleSaveFilter = () => {
    // getFilterSummary logic translated for preset name
    const parts = [];
    if (!isNationwide && selectedPrefectures.length > 0) parts.push(selectedPrefectures.join('/'));
    else if (keyword) parts.push(`"${keyword}"`);
    else parts.push('全国');
    if (types.length > 0) parts.push(types[0] + (types.length > 1 ? '...' : ''));
    if (minPrice || maxPrice) parts.push('価格指定あり');
    if (isUrgent) parts.push('入札間近');
    
    const filterNameDefault = parts.join(' / ') || '条件セット';
    
    const userName = window.prompt("この検索条件にわかりやすい名前を付けて保存します (例: 東京のボロ戸建て):", filterNameDefault);
    if (userName === null) return; // Cancelled
    const filterName = userName.trim() || filterNameDefault;

    const currentState = {
      keyword,
      types,
      selectedRegions,
      selectedPrefectures,
      isNationwide,
      minPrice,
      maxPrice,
      minArea,
      isUrgent,
      provider,
      activeProviders,
      walkTime,
      sort,
      selectedLine,
      selectedStation,
      selectedCourt,
      selectedNtaAuth
    };

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      state: currentState
    };

    const updated = [newFilter, ...savedFilters].slice(0, 10);
    updateSavedFilters(updated);
  };

  const handleLoadSavedFilter = (filter: SavedFilter) => {
    setKeyword(filter.state.keyword || '');
    setTypes(filter.state.types || []);
    setSelectedRegions(filter.state.selectedRegions || []);
    setSelectedPrefectures(filter.state.selectedPrefectures || []);
    setIsNationwide(filter.state.isNationwide ?? true);
    setMinPrice(filter.state.minPrice);
    setMaxPrice(filter.state.maxPrice);
    setMinArea(filter.state.minArea);
    setIsUrgent(filter.state.isUrgent || false);
    setProvider(filter.state.provider || 'ALL');
    setActiveProviders(filter.state.activeProviders || ['BIT', 'NTA']);
    setWalkTime(filter.state.walkTime);
    setSort(filter.state.sort || 'newest');
    setSelectedLine(filter.state.selectedLine || 'ALL');
    setSelectedStation(filter.state.selectedStation || 'ALL');
    setSelectedCourt(filter.state.selectedCourt || 'ALL');
    setSelectedNtaAuth(filter.state.selectedNtaAuth || 'ALL');

    triggerSearch({
      keyword: filter.state.keyword,
      types: filter.state.types,
      prefectures: !filter.state.isNationwide && filter.state.selectedPrefectures?.length > 0 ? filter.state.selectedPrefectures : undefined,
      minPrice: filter.state.minPrice,
      maxPrice: filter.state.maxPrice,
      isClosingSoon: filter.state.isUrgent,
      provider: filter.state.provider !== 'ALL' ? filter.state.provider : undefined,
      providers: filter.state.activeProviders,
      maxWalkTime: filter.state.walkTime,
      minArea: filter.state.minArea,
      sort: filter.state.sort,
      lineName: filter.state.selectedLine !== 'ALL' ? filter.state.selectedLine : undefined,
      stationName: filter.state.selectedStation !== 'ALL' ? filter.state.selectedStation : undefined,
      courtName: filter.state.selectedCourt !== 'ALL' ? filter.state.selectedCourt : undefined,
      managingAuthority: filter.state.selectedNtaAuth !== 'ALL' ? filter.state.selectedNtaAuth : undefined
    });
  };

  const handleDeleteSavedFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSavedFilters(savedFilters.filter(f => f.id !== id));
  };
  // -------------------------

  const propertyTypes = ['戸建て', 'マンション', '土地', '農地', 'その他'];
  
  const regions = ['北海道・東北', '関東', '中部', '関西', '中国', '四国', '九州・沖縄'];
  const prefectures: Record<string, string[]> = {
    '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
    '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
    '関西': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
    '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
    '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
  };



  const getFilterSummary = () => {
    const parts = [];
    if (!isNationwide && selectedPrefectures.length > 0) parts.push(selectedPrefectures.join('/'));
    else if (keyword) parts.push(`"${keyword}"`);
    else parts.push('全国');

    if (types.length > 0) parts.push(types[0] + (types.length > 1 ? '...' : ''));
    if (minPrice || maxPrice) parts.push('価格指定あり');
    if (isUrgent) parts.push('入札間近');
    if (provider && provider !== 'ALL') parts.push(provider === 'BIT' ? 'BITのみ' : provider === 'NTA' ? 'NTAのみ' : provider === 'KSI' ? 'KSI公売のみ' : '国有財産のみ');
    if (selectedLine && selectedLine !== 'ALL') parts.push(selectedLine);
    if (selectedStation && selectedStation !== 'ALL') parts.push(selectedStation);

    return parts.join(' / ');
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 relative z-[60] pointer-events-auto shrink-0">
      <div className="w-full flex flex-col">
        {/* DOCKED B2B TOOLBAR (SUUMO / LIFULL HOME'S / KENBIYA Standard) */}
        <div className="flex flex-col w-full px-2.5 sm:px-4 lg:px-5 py-2 relative max-w-full">
          <div className="bg-white dark:bg-zinc-900">
            {/* Main Row: Unified Input */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center w-full gap-2 lg:gap-0 lg:rounded-md lg:border lg:border-slate-300 dark:lg:border-zinc-700 p-0 lg:p-1 lg:focus-within:ring-2 lg:focus-within:ring-[#1B4F8A]/30 lg:focus-within:border-[#1B4F8A] lg:bg-white dark:lg:bg-zinc-950 transition-colors">
            
            {/* Search Top / Left */}
            <div className="flex-1 flex items-center w-full rounded-lg lg:rounded-none border border-gray-200 dark:border-zinc-700 lg:border-none p-1.5 lg:p-0 bg-white dark:bg-zinc-950 focus-within:ring-2 lg:focus-within:ring-0 focus-within:ring-blue-500/50 relative z-50">
            {/* Keyword Search Input (flex-1) */}
            <div className="relative z-50 flex-1 flex items-center pr-3 group">
              <div className="pl-3 lg:pl-2 pr-2 lg:pr-1">
                <MagnifyingGlassIcon className="w-5 h-5 lg:w-4 lg:h-4 text-zinc-400" />
              </div>
              <div className="relative w-full overflow-visible bg-transparent text-left sm:text-sm lg:text-xs">
                <input
                  type="text"
                  className="w-full border-none py-1.5 lg:py-1.5 text-xs lg:text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-0 outline-none font-bold relative z-10"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                  placeholder="エリア・駅名・キーワード（例: 新宿 マンション 2000万以下）..."
                />
                {keyword && (
                  <button type="button" onClick={() => { setKeyword(''); triggerSearch({ keyword: '' }); }} className="absolute inset-y-0 right-0 flex items-center text-zinc-400 hover:text-zinc-600 font-bold px-2 z-20">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}

                {/* Popular Search Intent Chips for Quick Access */}
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
                  <div className="absolute z-[100] mt-3 lg:mt-2 w-full min-w-[320px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-xl p-3 focus:outline-none">
                    <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
                      <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#1B4F8A]" />
                      <span>人気の検索条件・スマート入力例</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '東京 マンション',
                        '駅徒歩10分以内',
                        '2000万円以下',
                        '土地 50坪以上',
                        '戸建て 1000万以下',
                        '山手線 駅近'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setKeyword(chip);
                            triggerSearch({ keyword: chip });
                            setIsInputFocused(false);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 hover:text-[#1B4F8A] dark:text-zinc-200 font-medium transition-colors border border-transparent hover:border-blue-200"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </Transition>
                
                {/* Suggestions Dropdown */}
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
                  <ul className="absolute z-[100] mt-3 lg:mt-2 w-full min-w-[300px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-xl py-1 focus:outline-none max-h-[320px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
                    {suggestions.map((s, idx) => {
                      const getBadgeInfo = () => {
                        switch (s.type) {
                          case 'STATION':
                            return { label: '駅', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: <Train className="w-3.5 h-3.5 text-blue-500" /> };
                          case 'LINE':
                            return { label: '路線', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <Train className="w-3.5 h-3.5 text-emerald-500" /> };
                          case 'CITY':
                            return { label: 'エリア', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: <MapPin className="w-3.5 h-3.5 text-amber-500" /> };
                          case 'COURT':
                            return { label: '裁判所/税務署', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <Scale className="w-3.5 h-3.5 text-purple-500" /> };
                          case 'CASE':
                            return { label: '事件番号', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', icon: <Bookmark className="w-3.5 h-3.5 text-indigo-500" /> };
                          default:
                            return { label: '住所', bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300', icon: <Building2 className="w-3.5 h-3.5 text-slate-500" /> };
                        }
                      };
                      const badge = getBadgeInfo();

                      return (
                        <li
                          key={idx}
                          className="cursor-pointer select-none relative py-2.5 px-4 lg:px-3 text-sm lg:text-xs hover:bg-blue-50/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2.5 group/item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionSelect(s);
                          }}
                        >
                          <span className="w-5 flex items-center justify-center shrink-0">
                            {badge.icon}
                          </span>
                          <div className="flex flex-col truncate min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover/item:text-[#1B4F8A] dark:group-hover/item:text-blue-400 truncate">
                                {s.text}
                              </span>
                              {typeof s.count === 'number' && (
                                <span className="text-[11px] text-zinc-400 font-mono font-medium shrink-0">
                                  ({s.count}件)
                                </span>
                              )}
                            </div>
                            {s.subtext && <span className="text-[10px] text-zinc-400 truncate">{s.subtext}</span>}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Transition>
              </div>
            </div>
            </div>

            <div className="hidden lg:block w-px h-8 lg:h-6 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0"></div>

            {/* Bottom / Right */}
            <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto rounded-lg lg:rounded-none border border-gray-200 dark:border-zinc-700 lg:border-none p-1.5 lg:p-0 bg-white dark:bg-zinc-950 relative z-40">
            {/* Region Location Filter (B2B Redesigned Popover) */}
            <Popover className="relative shrink-0 flex items-center">
              {({ open, close }) => {
                const activeRegion = viewingRegion && prefectures[viewingRegion] ? viewingRegion : '北海道・東北';
                const currentRegionPrefs = prefectures[activeRegion] || [];
                const allInViewingSelected = currentRegionPrefs.length > 0 && currentRegionPrefs.every(p => selectedPrefectures.includes(p));
                const nationwideTotal = areaStats['全国'] ?? Object.entries(areaStats).reduce((sum, [k, v]) => k === '全国' ? sum : sum + (v || 0), 0);

                const handleToggleRegionAll = (r: string, e?: React.MouseEvent) => {
                  if (e) e.stopPropagation();
                  const rPrefs = prefectures[r] || [];
                  const isAllSelected = rPrefs.every(p => selectedPrefectures.includes(p));
                  setViewingRegion(r);

                  if (isAllSelected) {
                    const nextPrefs = selectedPrefectures.filter(p => !rPrefs.includes(p));
                    const nextRegions = selectedRegions.filter(x => x !== r);
                    setSelectedPrefectures(nextPrefs);
                    setSelectedRegions(nextRegions);
                    if (nextPrefs.length === 0) setIsNationwide(true);
                  } else {
                    setIsNationwide(false);
                    const nextPrefs = Array.from(new Set([...selectedPrefectures, ...rPrefs]));
                    const nextRegions = Array.from(new Set([...selectedRegions, r]));
                    setSelectedPrefectures(nextPrefs);
                    setSelectedRegions(nextRegions);
                  }
                };

                const handleTogglePrefecture = (p: string, r: string) => {
                  const rPrefs = prefectures[r] || [];
                  const isSelected = selectedPrefectures.includes(p);
                  if (isSelected) {
                    const nextPrefs = selectedPrefectures.filter(x => x !== p);
                    setSelectedPrefectures(nextPrefs);
                    setSelectedRegions(prev => prev.filter(x => x !== r));
                    if (nextPrefs.length === 0) setIsNationwide(true);
                  } else {
                    setIsNationwide(false);
                    const nextPrefs = [...selectedPrefectures, p];
                    setSelectedPrefectures(nextPrefs);
                    if (rPrefs.every(rp => nextPrefs.includes(rp))) {
                      setSelectedRegions(prev => Array.from(new Set([...prev, r])));
                    }
                  }
                };

                return (
                <>
                  <Popover.Button
                    ref={refs.setReference}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors outline-none ${
                      open || (!isNationwide && selectedPrefectures.length > 0)
                        ? 'bg-[#F0F4F9] text-[#1B4F8A] border-[#1B4F8A]/40 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700'
                        : 'bg-white text-slate-700 border-transparent hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <MapIcon className={`w-3.5 h-3.5 shrink-0 ${open || (!isNationwide && selectedPrefectures.length > 0) ? 'text-[#1B4F8A] dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate max-w-[130px]">
                      {isNationwide || selectedPrefectures.length === 0
                        ? '全国'
                        : selectedPrefectures.length <= 2
                        ? selectedPrefectures.join('・')
                        : `${selectedPrefectures[0]} ほか${selectedPrefectures.length - 1}県`}
                    </span>
                    {!isNationwide && selectedPrefectures.length > 0 && (
                      <span className="bg-[#1B4F8A] text-white text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-sm font-bold">
                        {selectedPrefectures.length}
                      </span>
                    )}
                    <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180 text-[#1B4F8A]' : ''}`} />
                  </Popover.Button>
                  {isMounted && (
                    <Portal>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                        <Popover.Panel ref={refs.setFloating} style={floatingStyles} className="w-[calc(100vw-24px)] sm:w-[520px] max-w-[520px] bg-white dark:bg-zinc-900 rounded-lg shadow-[0_12px_32px_-4px_rgba(15,23,42,0.16)] z-[9999] border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                        
                        {/* Popover Header Bar */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5">
                            <MapIcon className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">対象エリア・都道府県を選択</span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                            {isNationwide || selectedPrefectures.length === 0
                              ? `全国すべて (${nationwideTotal.toLocaleString()}件)`
                              : `選択中: ${selectedPrefectures.length}都道府県`}
                          </span>
                        </div>

                        <div className="flex w-full h-[340px]">
                          {/* Left Column: Regions (Click to inspect, checkbox to select all in region) */}
                          <div className="w-[45%] bg-slate-50/70 dark:bg-zinc-950/60 p-2 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto flex flex-col gap-0.5">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1 px-2 pt-0.5 tracking-wider">地方区分</p>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setIsNationwide(true);
                                setSelectedRegions([]);
                                setSelectedPrefectures([]);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs rounded-md flex justify-between items-center transition-colors border ${
                                isNationwide || selectedPrefectures.length === 0
                                  ? 'bg-[#1B4F8A] text-white font-bold border-[#1B4F8A] shadow-2xs'
                                  : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                                  isNationwide || selectedPrefectures.length === 0
                                    ? 'bg-white text-[#1B4F8A] border-white'
                                    : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                                }`}>
                                  {(isNationwide || selectedPrefectures.length === 0) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span>全国すべて</span>
                              </span>
                              <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-xs font-bold ${
                                isNationwide || selectedPrefectures.length === 0
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}>
                                {nationwideTotal.toLocaleString()}
                              </span>
                            </button>

                            <div className="my-1 border-t border-slate-200/80 dark:border-zinc-800" />
                            
                            {regions.map(r => {
                              const rPrefs = prefectures[r] || [];
                              const regionTotal = rPrefs.reduce((sum: number, p: string) => sum + (areaStats[p] || 0), 0);
                              const selectedCountInRegion = rPrefs.filter(p => selectedPrefectures.includes(p)).length;
                              const isAllRegionSelected = rPrefs.length > 0 && selectedCountInRegion === rPrefs.length && !isNationwide;
                              const isPartialRegionSelected = selectedCountInRegion > 0 && selectedCountInRegion < rPrefs.length && !isNationwide;
                              const isViewing = activeRegion === r;

                              return (
                                <div
                                  key={r}
                                  onClick={() => setViewingRegion(r)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setViewingRegion(r); }}
                                  className={`w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors flex justify-between items-center cursor-pointer border ${
                                    isViewing
                                      ? 'bg-white dark:bg-zinc-800 text-[#1B4F8A] dark:text-blue-300 font-bold border-[#1B4F8A]/40 dark:border-blue-500/40 shadow-2xs'
                                      : isAllRegionSelected || isPartialRegionSelected
                                      ? 'bg-[#F0F4F9]/70 dark:bg-blue-950/20 text-slate-800 dark:text-zinc-200 font-semibold border-transparent'
                                      : 'text-slate-700 dark:text-zinc-300 border-transparent hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      title={`${r}全域を選択・解除`}
                                      onClick={(e) => handleToggleRegionAll(r, e)}
                                      className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 transition-colors ${
                                        isAllRegionSelected
                                          ? 'bg-[#1B4F8A] border-[#1B4F8A] text-white'
                                          : isPartialRegionSelected
                                          ? 'bg-[#1B4F8A]/20 border-[#1B4F8A] text-[#1B4F8A] dark:text-blue-300'
                                          : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-[#1B4F8A]'
                                      }`}
                                    >
                                      {isAllRegionSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      {isPartialRegionSelected && <span className="w-1.5 h-0.5 bg-[#1B4F8A] dark:bg-blue-400 rounded-full" />}
                                    </button>
                                    <span className="truncate">{r}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {selectedCountInRegion > 0 && !isNationwide && (
                                      <span className="text-[10px] font-mono tabular-nums bg-[#1B4F8A] text-white px-1 rounded-xs font-bold">
                                        {selectedCountInRegion}
                                      </span>
                                    )}
                                    <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
                                      ({regionTotal.toLocaleString()})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Right Column: 2-Column B2B Prefecture Grid */}
                          <div className="w-[55%] p-3 bg-white dark:bg-zinc-900 overflow-y-auto flex flex-col">
                            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100 dark:border-zinc-800">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                {activeRegion}の都道府県
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleRegionAll(activeRegion)}
                                className="text-[11px] font-semibold text-[#1B4F8A] hover:text-[#143D6C] dark:text-blue-400 dark:hover:text-blue-300 px-2 py-0.5 rounded hover:bg-[#F0F4F9] dark:hover:bg-zinc-800 transition-colors"
                              >
                                {allInViewingSelected && !isNationwide ? '全域を解除' : '全域を選択'}
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1.5">
                              {currentRegionPrefs.map(p => {
                                const count = areaStats[p] || 0;
                                const isSelected = !isNationwide && selectedPrefectures.includes(p);
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleTogglePrefecture(p, activeRegion)}
                                    className={`text-left px-2.5 py-2 text-xs rounded-md border flex justify-between items-center transition-all ${
                                      isSelected
                                        ? 'bg-[#F0F4F9] border-[#1B4F8A] text-[#1B4F8A] font-bold dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 shadow-2xs'
                                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border shrink-0 ${
                                        isSelected
                                          ? 'bg-[#1B4F8A] border-[#1B4F8A] text-white'
                                          : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                                      }`}>
                                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      </span>
                                      <span className="truncate">{p}</span>
                                    </span>
                                    <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-xs font-semibold shrink-0 ${
                                      isSelected
                                        ? 'bg-[#1B4F8A] text-white'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                                    }`}>
                                      {count.toLocaleString()}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Footer */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                           <button
                             type="button"
                             onClick={() => {
                                setIsNationwide(true);
                                setSelectedRegions([]);
                                setSelectedPrefectures([]);
                             }}
                             className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 px-2.5 py-1.5 transition-colors rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                           >
                             クリア (全国に戻す)
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                const effectiveNationwide = isNationwide || selectedPrefectures.length === 0;
                                if (!effectiveNationwide && selectedPrefectures.length > 0) {
                                  params.set('prefs', selectedPrefectures.join(','));
                                  params.delete('pref');
                                  params.delete('prefecture');
                                } else {
                                  params.delete('prefs');
                                  params.delete('pref');
                                  params.delete('prefecture');
                                }
                                const queryStr = params.toString();
                                router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false });
                                
                                handleApply({ prefectures: effectiveNationwide ? undefined : selectedPrefectures });
                                close();
                             }}
                             className="text-xs font-semibold bg-[#1B4F8A] hover:bg-[#143D6C] text-white px-5 py-1.5 rounded-md shadow-2xs transition-colors"
                           >
                             この条件で決定
                           </button>
                        </div>
                        </Popover.Panel>
                      </Transition>
                    </Portal>
                  )}
                </>
                );
              }}
            </Popover>

            {/* Action Buttons */}
            <div className="flex items-center pl-2 lg:pl-1 pr-1 lg:pr-0 gap-1.5 shrink-0">
                 <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-0.5">
                   {/* Mobile Filter Button (SUUMO / HOME'S Style Sheet Launcher) */}
                   <button 
                     type="button"
                     onClick={() => handleSetMobileFilterOpen(true)}
                     className="lg:hidden flex items-center justify-center gap-1.5 bg-[#F0F4F9] hover:bg-blue-100 dark:bg-blue-950/60 border border-[#1B4F8A]/30 text-[#1B4F8A] dark:text-blue-300 font-bold py-1.5 px-2.5 rounded-md text-xs shadow-2xs"
                     title="詳細条件で絞り込み"
                   >
                     <span className="text-xs">⚙️</span>
                     <span>絞り込み</span>
                     {(types.length > 0 || minPrice || maxPrice || walkTime || minArea || selectedLine !== 'ALL' || selectedCourt !== 'ALL' || selectedNtaAuth !== 'ALL') && (
                       <span className="w-4 h-4 rounded-full bg-[#1B4F8A] text-white text-[10px] font-mono flex items-center justify-center">
                         {(types.length > 0 ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (walkTime ? 1 : 0) + (minArea ? 1 : 0) + (selectedLine !== 'ALL' ? 1 : 0) + (selectedCourt !== 'ALL' || selectedNtaAuth !== 'ALL' ? 1 : 0)}
                       </span>
                     )}
                   </button>

                   <button 
                     onClick={handleSaveFilter} 
                     title="この条件を保存 (Save Filter)"
                     className="hidden sm:flex items-center justify-center gap-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 font-medium py-1.5 px-2.5 rounded-md transition-colors text-xs shadow-2xs"
                   >
                     <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                     <span className="hidden sm:inline">保存</span>
                   </button>
                   <button 
                     onClick={handleClear} 
                     title="条件をクリア (Clear All)"
                     className="flex items-center gap-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium py-1.5 px-2 rounded-md transition-colors text-xs shadow-2xs"
                   >
                     <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                     <span className="hidden sm:inline">クリア</span>
                   </button>
                 </div>
               <button onClick={handleApply} className="bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-semibold flex items-center justify-center gap-1.5 py-1.5 lg:py-1.5 px-4 lg:px-5 rounded-md shadow-2xs text-xs transition-colors tracking-wide">
                 <MagnifyingGlassIcon className="w-4 h-4 sm:hidden" />
                 <span className="hidden sm:inline">検索</span>
               </button>
            </div>
          </div>
        </div>

          {/* Filter Row: Always Visible Docked B2B Filter Strip */}
          <div className="mt-2 relative w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5 w-full overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 scrollbar-hide">
                 {/* Property Types */}
                 <div className="flex items-center gap-1.5 shrink-0">
                   {propertyTypes.map(pt => {
                     const count = typeStats[pt] || 0;
                     return (
                       <button 
                         key={pt} 
                         onClick={() => {
                           const newTypes = types.includes(pt) ? types.filter(t => t !== pt) : [...types, pt];
                           setTypes(newTypes);
                           triggerSearch({ types: newTypes });
                         }}
                         className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                           types.includes(pt) 
                             ? 'bg-[#1B4F8A] text-white border-[#1B4F8A] dark:bg-blue-600 dark:border-blue-600' 
                             : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                         }`}
                       >
                         <span>{pt}</span>
                         <span className={`text-[10px] tabular-nums font-semibold ${types.includes(pt) ? 'text-white/80' : 'text-slate-400'}`}>({count})</span>
                       </button>
                     );
                   })}
                 </div>

                 <div className="w-px h-4 lg:h-3 bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5"></div>

                 {/* Price Dropdowns */}
                 <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 shadow-2xs">
                   <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <select value={minPrice || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setMinPrice(v); triggerSearch({ minPrice: v }); }} className="text-xs font-medium border-none bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer appearance-none">
                     <option value="">下限なし</option>
                     <option value="5000000">500万円</option>
                     <option value="10000000">1000万円</option>
                     <option value="20000000">2000万円</option>
                   </select>
                   <span className="text-slate-400 text-xs">〜</span>
                   <select value={maxPrice || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setMaxPrice(v); triggerSearch({ maxPrice: v }); }} className="text-xs font-medium border-none bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer appearance-none pl-0.5">
                     <option value="">上限なし</option>
                     <option value="5000000">500万円</option>
                     <option value="10000000">1000万円</option>
                     <option value="20000000">2000万円</option>
                   </select>
                 </div>
                 
                 <div className="w-px h-4 lg:h-3 bg-slate-200 dark:bg-slate-700 shrink-0"></div>

                 {/* Authority Dropdowns: BIT Court + NTA Auth */}
                 <div className="flex items-center gap-2 shrink-0">
                   {/* BIT Court Dropdown */}
                   <div className="relative">
                     <div
                       className={`flex items-center rounded-md border transition-all overflow-hidden shadow-2xs ${
                         activeProviders.includes('BIT')
                           ? selectedCourt !== 'ALL' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-1 ring-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                           : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale'
                       }`}
                     >
                       <button
                         onClick={() => handleToggleProvider('BIT')}
                         className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                           activeProviders.includes('BIT') 
                             ? selectedCourt !== 'ALL' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
                             : 'text-slate-400 dark:text-slate-500'
                         }`}
                       >
                         <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                         <span className="max-w-[120px] sm:max-w-[160px] truncate">{selectedCourt !== 'ALL' ? selectedCourt : `BIT 裁判所(${(authorityData?.bit || []).reduce((acc: any, curr: any) => acc + curr.count, 0)})`}</span>
                        </button>
                       <button
                         ref={bitRefs.setReference}
                         onClick={() => { setIsBitOpen(v => !v); setIsNtaOpen(false); }}
                         className={`px-1.5 py-1 border-l hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors ${
                           activeProviders.includes('BIT')
                             ? selectedCourt !== 'ALL' ? 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                             : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
                         }`}
                       >
                         <svg className={`w-3 h-3 transition-transform ${isBitOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                       </button>
                     </div>
                     {isBitOpen && (
                       <Portal>
                         <div ref={bitRefs.setFloating} style={bitStyles} className="z-[9999] w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                           <div className="max-h-52 overflow-y-auto">
                             <button
                               onClick={() => { setSelectedCourt('ALL'); setProvider('ALL'); setActiveProviders(['BIT', 'NTA', 'KSI', 'MOF']); setIsBitOpen(false); triggerSearch({ courtName: undefined, provider: undefined, providers: ['BIT', 'NTA', 'KSI', 'MOF'] }); }}
                               className={`w-full text-left px-3 py-2 text-xs font-bold flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                 selectedCourt === 'ALL' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-700 dark:text-zinc-300'
                               }`}
                             >
                               <span>すべての裁判所</span>
                               {selectedCourt === 'ALL' && <span className="text-blue-600">✓</span>}
                             </button>
                             {(authorityData?.bit || []).map((item: any) => (
                               <button
                                 key={item.name}
                                 onClick={() => { setSelectedCourt(item.name); setSelectedNtaAuth('ALL'); setProvider('BIT'); setActiveProviders(['BIT']); setIsBitOpen(false); triggerSearch({ courtName: item.name, managingAuthority: undefined, provider: 'BIT', providers: ['BIT'] }); }}
                                 className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                   selectedCourt === item.name ? 'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-700 dark:text-zinc-300'
                                 }`}
                               >
                                 <span className="truncate flex-1">{item.name}</span>
                                 <span className="shrink-0 flex items-center gap-1">
                                   <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold">{item.count}</span>
                                   {selectedCourt === item.name && <span className="text-blue-600">✓</span>}
                                 </span>
                               </button>
                             ))}
                           </div>
                         </div>
                       </Portal>
                     )}
                   </div>

                   {/* NTA Auth Dropdown */}
                   <div className="relative">
                     <div
                       className={`flex items-center rounded-md border transition-all overflow-hidden shadow-2xs ${
                         activeProviders.includes('NTA')
                           ? selectedNtaAuth !== 'ALL' ? 'bg-red-50 dark:bg-red-900/20 border-red-400 ring-1 ring-red-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                           : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale'
                       }`}
                     >
                       <button
                         onClick={() => handleToggleProvider('NTA')}
                         className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                           activeProviders.includes('NTA') 
                             ? selectedNtaAuth !== 'ALL' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
                             : 'text-slate-400 dark:text-slate-500'
                         }`}
                       >
                         <Building2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                         <span className="max-w-[120px] sm:max-w-[160px] truncate">{selectedNtaAuth !== 'ALL' ? selectedNtaAuth : `NTA 税務署(${(authorityData?.nta || []).reduce((acc: any, curr: any) => acc + curr.count, 0)})`}</span>
                        </button>
                       <button
                         ref={ntaRefs.setReference}
                         onClick={() => { setIsNtaOpen(v => !v); setIsBitOpen(false); }}
                         className={`px-1.5 py-1 border-l hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors ${
                           activeProviders.includes('NTA')
                             ? selectedNtaAuth !== 'ALL' ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                             : 'border-slate-200 dark:border-slate-800 text-slate-400'
                         }`}
                       >
                         <svg className={`w-3 h-3 transition-transform ${isNtaOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                       </button>
                     </div>
                     {isNtaOpen && (
                       <Portal>
                         <div ref={ntaRefs.setFloating} style={ntaStyles} className="z-[9999] w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                           <div className="max-h-52 overflow-y-auto">
                             <button
                               onClick={() => { setSelectedNtaAuth('ALL'); setProvider('ALL'); setActiveProviders(['BIT', 'NTA', 'KSI', 'MOF']); setIsNtaOpen(false); triggerSearch({ managingAuthority: undefined, provider: undefined, providers: ['BIT', 'NTA', 'KSI', 'MOF'] }); }}
                               className={`w-full text-left px-3 py-2 text-xs font-bold flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                 selectedNtaAuth === 'ALL' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-zinc-700 dark:text-zinc-300'
                               }`}
                             >
                               <span>すべての税務署</span>
                               {selectedNtaAuth === 'ALL' && <span className="text-red-500">✓</span>}
                             </button>
                             {(authorityData?.nta || []).length === 0 && (
                               <p className="text-[10px] text-zinc-400 px-3 py-2 italic">データなし</p>
                             )}
                             {(authorityData?.nta || []).map((item: any) => (
                               <button
                                 key={item.name}
                                 onClick={() => { setSelectedNtaAuth(item.name); setSelectedCourt('ALL'); setProvider('NTA'); setActiveProviders(['NTA']); setIsNtaOpen(false); triggerSearch({ managingAuthority: item.name, courtName: undefined, provider: 'NTA', providers: ['NTA'] }); }}
                                 className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                   selectedNtaAuth === item.name ? 'text-red-600 font-bold bg-red-50 dark:bg-red-900/20' : 'text-zinc-700 dark:text-zinc-300'
                                 }`}
                               >
                                 <span className="truncate flex-1">{item.name}</span>
                                 <span className="shrink-0 flex items-center gap-1">
                                   <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold">{item.count}</span>
                                   {selectedNtaAuth === item.name && <span className="text-red-500">✓</span>}
                                 </span>
                               </button>
                             ))}
                           </div>
                         </div>
                       </Portal>
                     )}
                   </div>

                   {/* KSI (官公庁公売) Toggle */}
                   <button
                     onClick={() => handleToggleProvider('KSI')}
                     className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all shadow-2xs shrink-0 ${
                       activeProviders.includes('KSI')
                         ? 'bg-white dark:bg-slate-900 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50/50 dark:hover:bg-teal-950/30'
                         : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60 grayscale'
                     }`}
                   >
                     <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0" />
                     <span>官公庁公売</span>
                   </button>

                   {/* MOF (国有財産売却) Toggle */}
                   <button
                     onClick={() => handleToggleProvider('MOF')}
                     className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all shadow-2xs shrink-0 ${
                       activeProviders.includes('MOF')
                         ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                         : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60 grayscale'
                     }`}
                   >
                     <span className="w-2 h-2 rounded-full bg-[#B45309] shrink-0" />
                     <span>国有財産売却</span>
                   </button>
                 </div>

                 <div className="w-px h-4 lg:h-3 bg-gray-200 dark:bg-zinc-700 shrink-0"></div>

                 {/* Line Filter */}
                 <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 shadow-2xs">
                   <Train className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <select 
                     value={selectedLine} 
                     onChange={(e) => { 
                       const val = e.target.value; 
                       setSelectedLine(val); 
                       setSelectedStation('ALL'); // Reset station when line changes
                       triggerSearch({ lineName: val, stationName: undefined }); 
                       
                       // URL Sync
                       const params = new URLSearchParams(searchParams.toString());
                       if (val !== 'ALL') {
                          params.set('line', val);
                       } else {
                          params.delete('line');
                       }
                       const queryStr = params.toString();
                       router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false });
                       
                     }} 
                     className={`text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none cursor-pointer appearance-none max-w-[120px] truncate ${selectedLine !== 'ALL' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                   >
                     <option value="ALL">路線指定なし</option>
                     {railData.map((r: any) => (
                       <option key={r.line} value={r.line}>{r.line} ({r.count})</option>
                     ))}
                   </select>
                   {selectedLine !== 'ALL' && (
                     <button 
                       onClick={() => {
                         setSelectedLine('ALL');
                         setSelectedStation('ALL');
                         triggerSearch({ lineName: undefined, stationName: undefined });
                         const params = new URLSearchParams(searchParams.toString());
                         params.delete('line');
                         const queryStr = params.toString();
                         router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false });
                       }}
                       className="text-zinc-400 hover:text-red-500 rounded-full bg-zinc-200 dark:bg-zinc-700 p-0.5 ml-1 transition-colors"
                       title="路線をクリア"
                     >
                       <XMarkIcon className="w-3 h-3" />
                     </button>
                   )}
                 </div>

                 {selectedLine !== 'ALL' && (
                   <>
                     <span className="text-zinc-400 text-sm lg:text-xs">/</span>
                     {/* Station Filter */}
                     <div className="flex items-center gap-1 shrink-0">
                       <select 
                         value={selectedStation} 
                         onChange={(e) => { const val = e.target.value; setSelectedStation(val); triggerSearch({ stationName: val }); }} 
                         className="text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none max-w-[100px] truncate"
                       >
                         <option value="ALL">駅指定なし</option>
                         {(railData.find((r: any) => r.line === selectedLine)?.stations || []).map((st: any) => (
                           <option key={st} value={st}>{st}</option>
                         ))}
                       </select>
                     </div>
                   </>
                 )}


                 {/* Walk Time Filter */}
                 <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 shadow-2xs">
                   <select
                     value={walkTime || ''}
                     onChange={(e) => {
                       const v = e.target.value ? Number(e.target.value) : undefined;
                       setWalkTime(v);
                       triggerSearch({ maxWalkTime: v });
                     }}
                     className={`text-xs lg:text-[11px] font-medium border-none bg-transparent outline-none cursor-pointer appearance-none ${walkTime ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                   >
                     <option value="">徒歩指定なし</option>
                     <option value="5">徒歩5分以内</option>
                     <option value="10">徒歩10分以内</option>
                     <option value="15">徒歩15分以内</option>
                     <option value="20">徒歩20分以内</option>
                   </select>
                 </div>

                 {/* Area Filter */}
                 <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 shadow-2xs">
                   <select
                     value={minArea || ''}
                     onChange={(e) => {
                       const v = e.target.value ? Number(e.target.value) : undefined;
                       setMinArea(v);
                       triggerSearch({ minArea: v });
                     }}
                     className={`text-xs lg:text-[11px] font-medium border-none bg-transparent outline-none cursor-pointer appearance-none ${minArea ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                   >
                     <option value="">面積指定なし</option>
                     <option value="50">50m²以上</option>
                     <option value="100">100m²以上</option>
                     <option value="150">150m²以上</option>
                     <option value="200">200m²以上</option>
                   </select>
                 </div>

                 <div className="w-px h-4 lg:h-3 bg-gray-200 dark:bg-zinc-700 shrink-0"></div>

                 {/* Sort Order */}
                 <div className="flex items-center gap-1 shrink-0">
                   <select value={sort} onChange={(e) => { 
                     const v = e.target.value as any; 
                     setSort(v); 
                     triggerSearch({ sort: v }); 
                     // Sync URL
                     const params = new URLSearchParams(searchParams.toString());
                     params.set('sort', v);
                     router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                   }} className="text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none text-blue-600 dark:text-blue-400 cursor-pointer appearance-none">
                     <option value="gap_desc">割安順 (市場相場比)</option>
                     <option value="newest">新着順</option>
                     <option value="views">閲覧数順</option>
                     <option value="ending">入札締切が近い順</option>
                     <option value="priceAsc">価格が安い順</option>
                     <option value="areaDesc">面積が広い順</option>
                   </select>
                 </div>
              </div>
            </div>
          </div>

          {/* Saved Filters Row */}
          {savedFilters.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 px-2 lg:px-4 pointer-events-auto items-center pb-2">
              <span className="text-xs font-bold text-zinc-400 self-center flex items-center gap-1 shrink-0"><StarIcon className="w-3 h-3" /> 保存済み</span>
              {savedFilters.map(sf => (
                <div key={sf.id} onClick={() => handleLoadSavedFilter(sf)} className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-full cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                  <span className="text-[11px] text-yellow-700 dark:text-yellow-500 font-bold whitespace-nowrap overflow-hidden max-w-[150px] text-ellipsis">{sf.name}</span>
                  <button onClick={(e) => handleDeleteSavedFilter(sf.id, e)} className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-600 dark:hover:text-yellow-400 rounded-full hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50 p-0.5 ml-0.5">
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
        </div>
      </div>

      {/* SUUMO / LIFULL HOME'S Style Mobile Filter Bottom Sheet Modal */}
      {isMobileFilterOpen && (
        <Portal>
          <div 
            className="lg:hidden fixed inset-0 z-[999999] flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleSetMobileFilterOpen(false);
              }
            }}
          >
            <div className="mt-auto w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border-t border-slate-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-250">
              {/* Sheet Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚙️</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">詳細条件で絞り込み</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSetMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-bold text-sm hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  ✕
                </button>
              </div>

            {/* Sheet Body: Touch-friendly Thumb-Zone Controls */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* 1. 物件種別 */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">物件種別 (複数選択可)</label>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map(pt => {
                    const isSelected = types.includes(pt);
                    const count = typeStats[pt] || 0;
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? types.filter(t => t !== pt) : [...types, pt];
                          setTypes(next);
                        }}
                        className={`h-11 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                            : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <span>{pt}</span>
                        <span className={`text-[11px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 価格帯 */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">売却基準価額 (価格帯)</label>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <select
                    value={minPrice || ''}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="h-11 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                  >
                    <option value="">下限なし</option>
                    <option value="3000000">300万円以上</option>
                    <option value="5000000">500万円以上</option>
                    <option value="10000000">1000万円以上</option>
                    <option value="20000000">2000万円以上</option>
                    <option value="30000000">3000万円以上</option>
                  </select>
                  <select
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="h-11 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                  >
                    <option value="">上限なし</option>
                    <option value="5000000">500万円以下</option>
                    <option value="10000000">1000万円以下</option>
                    <option value="20000000">2000万円以下</option>
                    <option value="30000000">3000万円以下</option>
                    <option value="50000000">5000万円以下</option>
                  </select>
                </div>
              </div>

              {/* 3. 駅徒歩時間 & 面積 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">駅徒歩</label>
                  <select
                    value={walkTime || ''}
                    onChange={(e) => setWalkTime(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                  >
                    <option value="">指定なし</option>
                    <option value="5">徒歩5分以内</option>
                    <option value="10">徒歩10分以内</option>
                    <option value="15">徒歩15分以内</option>
                    <option value="20">徒歩20分以内</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">専有/土地面積</label>
                  <select
                    value={minArea || ''}
                    onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                  >
                    <option value="">指定なし</option>
                    <option value="50">50m²以上</option>
                    <option value="100">100m²以上</option>
                    <option value="150">150m²以上</option>
                    <option value="200">200m²以上</option>
                  </select>
                </div>
              </div>

              {/* 4. 出典機関 (BIT / NTA / KSI / MOF) */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">公示元・情報源</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BIT', label: 'BIT 裁判所競売' },
                    { id: 'NTA', label: 'NTA 国税庁公売' },
                    { id: 'KSI', label: 'KSI 官公庁公売' },
                    { id: 'MOF', label: 'MOF 国有財産売却' }
                  ].map(prov => {
                    const isChecked = activeProviders.includes(prov.id);
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => handleToggleProvider(prov.id)}
                        className={`h-11 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200'
                            : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-400 opacity-70'
                        }`}
                      >
                        <span>{prov.label}</span>
                        <span>{isChecked ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. 沿線・駅 */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-2">主要鉄道路線</label>
                <select
                  value={selectedLine}
                  onChange={(e) => {
                    setSelectedLine(e.target.value);
                    setSelectedStation('ALL');
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 outline-none"
                >
                  <option value="ALL">全国すべての路線</option>
                  {(railData as any[]).map((r: any) => (
                    <option key={r.line} value={r.line}>{r.line} ({r.count})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sheet Footer: Apply & Reset Actions */}
            <div 
              className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center gap-2"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
            >
              <button
                type="button"
                onClick={() => {
                  setTypes([]);
                  setMinPrice(undefined);
                  setMaxPrice(undefined);
                  setWalkTime(undefined);
                  setMinArea(undefined);
                  setSelectedLine('ALL');
                  setSelectedStation('ALL');
                  setActiveProviders(['BIT', 'NTA', 'KSI', 'MOF']);
                }}
                className="w-1/3 h-12 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                全条件リセット
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerSearch({
                    types,
                    minPrice,
                    maxPrice,
                    maxWalkTime: walkTime,
                    minArea,
                    lineName: selectedLine !== 'ALL' ? selectedLine : undefined,
                    stationName: selectedStation !== 'ALL' ? selectedStation : undefined,
                    providers: activeProviders,
                  });
                  handleSetMobileFilterOpen(false);
                }}
                className="w-2/3 h-12 rounded-xl bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>この条件で検索する</span>
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
