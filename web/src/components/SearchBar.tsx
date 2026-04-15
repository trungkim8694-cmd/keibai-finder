'use client';

import { useState, Fragment, useEffect, useTransition, useRef } from 'react';
import { Combobox, Transition, Popover, Dialog, Portal } from '@headlessui/react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { MagnifyingGlassIcon, ChevronDownIcon, CheckIcon, MapPinIcon, FunnelIcon, XMarkIcon, CurrencyYenIcon, MapIcon, ArrowPathIcon, StarIcon } from '@heroicons/react/20/solid';
import { getRailLinesAndStations, getSearchSuggestions, getAuthorityStats, getTypeStats, SearchSuggestion } from '../actions/propertyActions';
import { useRouter, useSearchParams } from 'next/navigation';

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
  provider?: string;
  providers?: string[];
  maxWalkTime?: number;
  sortBy?: string;
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
    sort: 'newest' | 'views';
    selectedLine: string;
    selectedStation: string;
    selectedCourt: string;
    selectedNtaAuth: string;
  };
}

export default function SearchBar({ onSearch, areaStats = {} }: { onSearch: (f: SearchFilters) => void, areaStats?: Record<string, number> }) {
  const {refs, floatingStyles} = useFloating({
    placement: 'bottom-end',
    middleware: [offset(10), flip(), shift()],
  });

  const {refs: bitRefs, floatingStyles: bitStyles} = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const {refs: ntaRefs, floatingStyles: ntaStyles} = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const [keyword, setKeyword] = useState('');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Native debounce (replaces use-debounce package)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2) {
        getSearchSuggestions(keyword).then(setSuggestions).catch(() => setSuggestions([]));
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
    
    // Build overrides depending on type
    const overrides: any = { keyword: sugg.text };
    if (sugg.type === 'STATION') overrides.stationName = sugg.text;
    else if (sugg.type === 'CITY' && sugg.subtext) overrides.prefecture = sugg.subtext;
    else if (sugg.type === 'LINE') overrides.lineName = sugg.text;
    
    triggerSearch(overrides);
  };
  const [isPending, startTransition] = useTransition();

  // Search state
  const [types, setTypes] = useState<string[]>([]);
  const [typeStats, setTypeStats] = useState<Record<string, number>>({});
  
  // Drill down states (Simulated region logic)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [isNationwide, setIsNationwide] = useState(true);
  const [viewingRegion, setViewingRegion] = useState('');
  
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [isUrgent, setIsUrgent] = useState(false); // Time filter
  const [provider, setProvider] = useState<string>('ALL'); // Xoá dần hoặc giữ nguyên cho components cũ
  const [activeProviders, setActiveProviders] = useState<string[]>(['BIT', 'NTA']); // Master source toggle
  
  const [walkTime, setWalkTime] = useState<number | undefined>();
  const [minArea, setMinArea] = useState<number | undefined>();
  const [sort, setSort] = useState<'newest' | 'views'>('newest');
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Search collapse state
  const [isMounted, setIsMounted] = useState(false);

  const [railData, setRailData] = useState<{line: string, count: number, stations: string[]}[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');

  // Authority Dropdown state
  const [authorityData, setAuthorityData] = useState<{ bit: {name:string;count:number}[], nta: {name:string;count:number}[] }>({ bit: [], nta: [] });
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');
  const [selectedNtaAuth, setSelectedNtaAuth] = useState<string>('ALL');
  const [isBitOpen, setIsBitOpen] = useState(false);
  const [isNtaOpen, setIsNtaOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    getRailLinesAndStations().then(data => setRailData(data as any));
    getAuthorityStats().then(data => setAuthorityData(data));
    getTypeStats().then(data => setTypeStats(data));
  }, []);
  
  useEffect(() => {
     if (isMounted) {
        let initialOverrides: any = {};

        const lineParam = searchParams.get('line');
        const prefsParam = searchParams.get('prefs');
        const prefParam = searchParams.get('pref');
        const sortParam = searchParams.get('sort') as 'newest' | 'views' | null;
        if (lineParam) {
           setSelectedLine(lineParam);
           initialOverrides.lineName = lineParam;
        }
        if (prefsParam) {
           const arr = prefsParam.split(',').filter(Boolean);
           setSelectedPrefectures(arr);
           setIsNationwide(arr.length === 0);
           initialOverrides.prefectures = arr;
           const activeRegions = regions.filter(r => prefectures[r] && prefectures[r].some((p: string) => arr.includes(p)));
           setSelectedRegions(activeRegions);
        } else if (prefParam) {
           setSelectedPrefectures([prefParam]);
           setIsNationwide(false);
           initialOverrides.prefectures = [prefParam];
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

  useEffect(() => {
    if (isMounted && areaStats && Object.keys(areaStats).length > 0) {
      console.log(`[Debug] Real-time Area Stats Payload:`, Object.entries(areaStats).map(([k, v]) => `${k}:${v}`).join(', '));
      const regionSum = regions.reduce((acc, r) => acc + (prefectures[r] ? prefectures[r].reduce((sum: number, p: string) => sum + (areaStats[p] || 0), 0) : 0), 0);
      console.log(`[Debug] Sum of Regions (47 Prefectures):`, regionSum, `| National (全国):`, areaStats['全国'] || 0);
    }
  }, [areaStats, isMounted]);

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

  const handleApply = (overrides?: any) => {
    // Prevent React Synthetic Event from being treated as search filters array
    const actualOverrides = (overrides && overrides.nativeEvent) ? undefined : overrides;
    triggerSearch(actualOverrides);
    setMobileFiltersOpen(false);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setKeyword('');
    setTypes([]);
    setSelectedRegions([]);
    setSelectedPrefectures([]);
    setIsNationwide(true);
    setViewingRegion('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinArea(undefined);
    setIsUrgent(false);
    setProvider('ALL');
    setActiveProviders(['BIT', 'NTA']);
    setWalkTime(undefined);
    setSelectedLine('ALL');
    setSelectedStation('ALL');
    setSelectedCourt('ALL');
    setSelectedNtaAuth('ALL');
    setSort('newest');
    onSearch({});
    router.replace('/', { scroll: false });
  };

  useEffect(() => {
    const fn = () => handleClear();
    window.addEventListener('clear-all-filters', fn);
    return () => window.removeEventListener('clear-all-filters', fn);
  }, []);

  useEffect(() => {
    const collapseSearch = () => setIsExpanded(false);
    window.addEventListener('map-interaction', collapseSearch);
    return () => window.removeEventListener('map-interaction', collapseSearch);
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

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');

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

  const hasActiveFilters = 
    keyword !== '' ||
    types.length > 0 ||
    selectedRegions.length > 0 ||
    selectedPrefectures.length > 0 ||
    !isNationwide ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    minArea !== undefined ||
    isUrgent !== false ||
    activeProviders.length < 2 ||
    walkTime !== undefined ||
    selectedLine !== 'ALL' ||
    selectedStation !== 'ALL' ||
    selectedCourt !== 'ALL' ||
    selectedNtaAuth !== 'ALL' ||
    sort !== 'newest';

  const getFilterSummary = () => {
    const parts = [];
    if (!isNationwide && selectedPrefectures.length > 0) parts.push(selectedPrefectures.join('/'));
    else if (keyword) parts.push(`"${keyword}"`);
    else parts.push('全国');

    if (types.length > 0) parts.push(types[0] + (types.length > 1 ? '...' : ''));
    if (minPrice || maxPrice) parts.push('価格指定あり');
    if (isUrgent) parts.push('入札間近');
    if (provider && provider !== 'ALL') parts.push(provider === 'BIT' ? 'BITのみ' : 'NTAのみ');
    if (selectedLine && selectedLine !== 'ALL') parts.push(selectedLine);
    if (selectedStation && selectedStation !== 'ALL') parts.push(selectedStation);

    return parts.join(' / ');
  };

  const totalBit = authorityData?.bit.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const bitActiveCount = selectedCourt === 'ALL' 
    ? totalBit 
    : authorityData?.bit.find(x => x.name === selectedCourt)?.count || 0;

  const totalNta = authorityData?.nta.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const ntaActiveCount = selectedNtaAuth === 'ALL' 
    ? totalNta 
    : authorityData?.nta.find(x => x.name === selectedNtaAuth)?.count || 0;

  return (
    <div className={`w-full sticky top-0 z-[60] lg:relative lg:z-auto pointer-events-auto transition-all duration-500 ${isExpanded ? 'bg-white/95 dark:bg-zinc-950/95 lg:bg-transparent dark:lg:bg-transparent shadow-sm lg:shadow-none backdrop-blur-md lg:backdrop-blur-none border-b border-zinc-200 dark:border-zinc-800 lg:border-none' : 'bg-transparent border-transparent shadow-none pointer-events-none'}`}>
      
      {/* =========================================
          COLLAPSED SUMMARY PILL
          ========================================= */}
      <div className={`flex absolute top-1 w-full justify-center transition-all duration-300 z-[70]
         ${!isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
      `}>
         <button 
           onClick={() => setIsExpanded(true)}
           className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg border border-gray-200 dark:border-zinc-700 rounded-full px-5 py-2.5 flex items-center gap-2.5 hover:shadow-xl hover:bg-white transition-all transform hover:scale-105 pointer-events-auto"
         >
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 max-w-[200px] sm:max-w-xs truncate">
               {getFilterSummary()}
            </span>
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
         </button>
      </div>

      {/* =========================================
          EXPANDED SEARCH CONTAINER
          ========================================= */}
      <div className={`w-full transition-all duration-500 lg:bg-transparent lg:backdrop-blur-none
        origin-top flex flex-col items-center
        ${isExpanded ? 'max-h-[800px] opacity-100 scale-y-100 overflow-visible' : 'max-h-0 opacity-0 scale-y-95 pointer-events-none overflow-hidden'}
      `}>
        
        {/* UNIVERSAL TOOLBAR (Desktop + Mobile) */}
        <div className="flex flex-col w-full px-1 sm:px-4 lg:px-8 xl:px-12 pt-2 lg:pt-3 relative max-w-full">
          <div className="bg-white dark:bg-zinc-900 shadow-md rounded-xl border border-gray-200 dark:border-zinc-800 p-4 lg:p-3 transition-all duration-300">
            {/* Main Row: Unified Input */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center w-full gap-2 lg:gap-0 lg:rounded-lg lg:border lg:border-gray-200 dark:lg:border-zinc-700 p-0 lg:p-1 lg:focus-within:ring-2 lg:focus-within:ring-blue-500/50 lg:bg-white dark:lg:bg-zinc-950">
            
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
                  className="w-full border-none py-2.5 lg:py-1.5 text-sm lg:text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-0 outline-none font-bold relative z-10"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setIsSuggestionsOpen(true); }}
                  onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 200)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                  placeholder="エリア・駅名・キーワードを入力..."
                />
                {keyword && (
                  <button type="button" onClick={() => { setKeyword(''); triggerSearch({ keyword: '' }); }} className="absolute inset-y-0 right-0 flex items-center text-zinc-400 hover:text-zinc-600 font-bold px-2 z-20">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
                
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
                  <ul className="absolute z-[100] mt-3 lg:mt-2 w-full min-w-[280px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-xl py-1 focus:outline-none max-h-[300px] overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer select-none relative py-2.5 px-4 lg:px-3 text-sm lg:text-xs hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 group/item"
                        onClick={() => handleSuggestionSelect(s)}
                      >
                        <span className="text-base leading-none w-5 text-center">
                          {s.type === 'STATION' ? '🚆' : s.type === 'LINE' ? '🛤️' : s.type === 'CITY' ? '📍' : '🏠'}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 truncate">
                            {s.text}
                          </span>
                          {s.subtext && <span className="text-[10px] text-zinc-400 truncate">{s.subtext}</span>}
                        </div>
                        <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          {s.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Transition>
              </div>
            </div>
            </div>

            <div className="hidden lg:block w-px h-8 lg:h-6 bg-gray-200 dark:bg-zinc-700 mx-1 shrink-0"></div>

            {/* Bottom / Right */}
            <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto rounded-lg lg:rounded-none border border-gray-200 dark:border-zinc-700 lg:border-none p-1.5 lg:p-0 bg-white dark:bg-zinc-950 relative z-40">
            {/* Region Location Filter */}
            <Popover className="relative shrink-0 flex items-center">
              {({ open, close }) => (
                <>
                  <Popover.Button ref={refs.setReference} className={`flex items-center text-sm lg:text-xs font-bold px-4 lg:px-2 py-2.5 lg:py-1.5 rounded-md transition-colors ${open || !isNationwide ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'} outline-none`}>
                    <MapIcon className="w-5 h-5 lg:w-4 lg:h-4 mr-2 lg:mr-1 text-zinc-400" />
                    {isNationwide ? '全国' : selectedPrefectures.length > 2 ? `${selectedPrefectures[0]}... +${selectedPrefectures.length - 1}` : selectedPrefectures.length > 0 ? selectedPrefectures.join('/') : '都道府県'}
                  </Popover.Button>
                  {isMounted && (
                    <Portal>
                      <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                        <Popover.Panel ref={refs.setFloating} style={floatingStyles} className="w-[450px] bg-white dark:bg-zinc-900 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] ring-1 ring-black/5 z-[9999] border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col">
                        <div className="flex w-full">
                          {/* Left Column: Regions */}
                          <div className="w-5/12 bg-zinc-50 dark:bg-zinc-800/50 p-2 border-r border-zinc-100 dark:border-zinc-800 h-[300px] overflow-y-auto">
                            <p className="text-xs font-bold text-zinc-400 mb-2 px-2 pt-1 font-sans">地方</p>
                            
                            <button 
                              onClick={() => {
                                setIsNationwide(true);
                                setSelectedRegions([]);
                                setSelectedPrefectures([]);
                              }} 
                              className={`w-full text-left px-3 py-2 text-sm rounded flex justify-between items-center mb-1 transition-colors ${isNationwide ? 'bg-blue-100 text-blue-700 font-bold shadow-sm dark:bg-blue-900/30 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50'}`}>
                              <span>全国</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isNationwide ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                                {areaStats['全国'] || 0}
                              </span>
                            </button>
                            
                            {regions.map(r => {
                              const regionTotal = prefectures[r] ? prefectures[r].reduce((sum: number, p: string) => sum + (areaStats[p] || 0), 0) : 0;
                              const isSelected = selectedRegions.includes(r);
                              const isViewing = viewingRegion === r;
                              return (
                                <button 
                                  key={r} 
                                  onClick={() => {
                                     setIsNationwide(false);
                                     setViewingRegion(r);
                                     if (isSelected) {
                                       // Deselect
                                       setSelectedRegions(prev => prev.filter(x => x !== r));
                                       setSelectedPrefectures(prev => prev.filter(p => !prefectures[r].includes(p)));
                                     } else {
                                       // Select
                                       setSelectedRegions(prev => [...prev, r]);
                                       const newPrefs = new Set([...selectedPrefectures, ...prefectures[r]]);
                                       setSelectedPrefectures(Array.from(newPrefs));
                                     }
                                  }}
                                  onMouseEnter={() => setViewingRegion(r)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex justify-between items-center relative ${isSelected ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300' : isViewing ? 'bg-zinc-200/50 dark:bg-zinc-700/50' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50'}`}>
                                  <span>{r}</span>
                                  <span className="text-[10px] text-zinc-500">
                                    {isSelected ? '✓' : ''} ({regionTotal})
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Column: Prefectures */}
                          <div className="w-7/12 p-2 h-[300px] overflow-y-auto">
                            <p className="text-xs font-bold text-zinc-400 mb-2 px-2 pt-1 font-sans">都道府県</p>
                            
                            {viewingRegion && prefectures[viewingRegion] ? prefectures[viewingRegion].map(p => {
                              const count = areaStats[p] || 0;
                              const isSelected = selectedPrefectures.includes(p);
                              return (
                                <button key={p} 
                                  onClick={() => { 
                                    setIsNationwide(false);
                                    if (isSelected) {
                                       setSelectedPrefectures(prev => prev.filter(x => x !== p));
                                       // If user deselects a prefecture, the parent Region should visually un-select too
                                       setSelectedRegions(prev => prev.filter(x => x !== viewingRegion));
                                    } else {
                                       setSelectedPrefectures(prev => [...prev, p]);
                                    }
                                  }} 
                                  className={`w-full text-left px-3 py-2.5 text-sm rounded flex justify-between items-center transition-colors mb-0.5 ${isSelected ? 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                                  <span>{p}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            }) : (
                              <p className="text-sm text-zinc-400 px-3 py-4 text-center mt-10">
                                👈 左側から地方を<br/>選択してください
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Footer */}
                        <div className="flex items-center justify-between p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                           <button 
                             onClick={() => {
                                setIsNationwide(true);
                                setSelectedRegions([]);
                                setSelectedPrefectures([]);
                             }}
                             className="text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 px-3 py-2 transition-colors rounded hover:bg-zinc-200/50"
                           >
                             クリア
                           </button>
                           <button 
                             onClick={() => {
                                // Simulate close
                                const params = new URLSearchParams(searchParams.toString());
                                if (!isNationwide && selectedPrefectures.length > 0) {
                                  params.set('prefs', selectedPrefectures.join(','));
                                  params.delete('pref');
                                } else {
                                  params.delete('prefs');
                                  params.delete('pref');
                                }
                                router.replace(`/?${params.toString()}`, { scroll: false });
                                
                                handleApply({ prefectures: isNationwide ? undefined : selectedPrefectures });
                                
                                // Close HeadlessUI popover natively
                                close();
                             }}
                             className="text-sm font-bold bg-blue-100 hover:bg-blue-200 text-blue-700 px-6 py-2 rounded shadow-sm transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
                           >
                             決定
                           </button>
                        </div>
                        </Popover.Panel>
                      </Transition>
                    </Portal>
                  )}
                </>
              )}
            </Popover>

            {/* Action Buttons */}
            <div className="flex items-center pl-2 lg:pl-1 pr-1 lg:pr-0 gap-1 shrink-0">
                 <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-700 pr-2 mr-1">
                   <button 
                     onClick={handleSaveFilter} 
                     title="この条件を保存 (Save Filter)"
                     className="flex items-center justify-center gap-1 bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-yellow-500 hover:text-yellow-600 font-bold py-2.5 lg:py-1 px-3 lg:px-2 rounded-md transition-all text-sm lg:text-xs"
                   >
                     ⭐️ <span className="hidden sm:inline">保存</span>
                   </button>
                   <button 
                     onClick={handleClear} 
                     title="条件をクリア (Clear All)"
                     className="flex items-center gap-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 font-bold py-2.5 lg:py-1.5 px-3 lg:px-2 rounded-md transition-all text-sm lg:text-xs"
                   >
                     🔄 <span className="hidden sm:inline">クリア</span>
                   </button>
                 </div>
               <button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 py-3 lg:py-1.5 px-5 lg:px-6 rounded-md shadow-sm text-sm lg:text-xs transition-colors tracking-widest">
                 <MagnifyingGlassIcon className="w-5 h-5 sm:hidden" />
                 <span className="hidden sm:inline">検索</span>
               </button>
            </div>
          </div>
        </div>

          {/* Filter Row: Always Visible Inside Expanded View */}
          <div className="mt-4 lg:mt-2 relative w-full">
            {/* Horizontal Scroll Fade Indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 lg:w-16 bg-gradient-to-r from-white/90 dark:from-zinc-900/90 to-transparent pointer-events-none z-10 rounded-l-md"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 lg:w-16 bg-gradient-to-l from-white/90 dark:from-zinc-900/90 to-transparent pointer-events-none z-10 rounded-r-md"></div>

            <div className="flex items-center justify-between px-2 lg:px-4">
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-5 w-full overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 scrollbar-hide px-2">
                 {/* Property Types */}
                 <div className="flex items-center gap-1.5 lg:gap-1 shrink-0">
                   {propertyTypes.map(pt => {
                     const count = typeStats[pt] || 0;
                     return (
                       <button 
                         key={pt} 
                         onClick={() => {
                           setTypes(types.includes(pt) ? types.filter(t => t !== pt) : [...types, pt]);
                         }}
                         className={`px-3 lg:px-2 py-1.5 lg:py-1 text-sm lg:text-[11px] font-bold rounded-full transition-colors border flex items-center gap-1 whitespace-nowrap ${types.includes(pt) ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900' : 'bg-transparent text-zinc-600 hover:bg-zinc-100 border-gray-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}
                       >
                         <span>{pt}</span>
                         <span className={`text-[10px] font-normal leading-none ${types.includes(pt) ? 'opacity-80' : 'text-zinc-400 dark:text-zinc-500'}`}>({count})</span>
                       </button>
                     );
                   })}
                 </div>

                 <div className="w-px h-4 lg:h-3 bg-gray-200 dark:bg-zinc-700 shrink-0 mx-1"></div>

                 {/* Price Dropdowns */}
                 <div className="flex items-center gap-2 lg:gap-1 shrink-0">
                   <span className="text-lg lg:text-sm leading-none mr-1 lg:mr-0">💰</span>
                   <select value={minPrice || ''} onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)} className="text-sm lg:text-xs font-bold border-none bg-transparent outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none">
                     <option value="">下限なし</option>
                     <option value="5000000">500万円</option>
                     <option value="10000000">1000万円</option>
                     <option value="20000000">2000万円</option>
                   </select>
                   <span className="text-zinc-400 text-sm lg:text-xs">~</span>
                   <select value={maxPrice || ''} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)} className="text-sm lg:text-xs font-bold border-none bg-transparent outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none pl-1">
                     <option value="">上限なし</option>
                     <option value="5000000">500万円</option>
                     <option value="10000000">1000万円</option>
                     <option value="20000000">2000万円</option>
                   </select>
                 </div>
                 
                 <div className="w-px h-4 lg:h-3 bg-gray-200 dark:bg-zinc-700 shrink-0"></div>

                 {/* Authority Dropdowns: BIT Court + NTA Auth */}
                 <div className="flex items-center gap-2 shrink-0">
                   {/* BIT Court Dropdown */}
                   <div className="relative">
                     <div
                       className={`flex items-center rounded-lg border transition-all overflow-hidden ${
                         activeProviders.includes('BIT')
                           ? selectedCourt !== 'ALL' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-1 ring-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                           : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale'
                       }`}
                     >
                       <button
                         onClick={() => handleToggleProvider('BIT')}
                         className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                           activeProviders.includes('BIT') 
                             ? selectedCourt !== 'ALL' ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'
                             : 'text-zinc-400 dark:text-zinc-500'
                         }`}
                       >
                         <span>⚖️</span>
                         <span className="max-w-[80px] truncate">{selectedCourt !== 'ALL' ? selectedCourt : 'BIT 裁判所'}</span>
                         <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${
                           activeProviders.includes('BIT')
                             ? selectedCourt !== 'ALL' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                             : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500'
                         }`}>
                           {bitActiveCount}
                         </span>
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
                               onClick={() => { setSelectedCourt('ALL'); setProvider('ALL'); setIsBitOpen(false); triggerSearch({ courtName: undefined, provider: undefined }); }}
                               className={`w-full text-left px-3 py-2 text-xs font-bold flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                 selectedCourt === 'ALL' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-700 dark:text-zinc-300'
                               }`}
                             >
                               <span>すべての裁判所</span>
                               {selectedCourt === 'ALL' && <span className="text-blue-600">✓</span>}
                             </button>
                             {authorityData.bit.map(item => (
                               <button
                                 key={item.name}
                                 onClick={() => { setSelectedCourt(item.name); setProvider('BIT'); setIsBitOpen(false); triggerSearch({ courtName: item.name, provider: 'BIT' }); }}
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
                       className={`flex items-center rounded-lg border transition-all overflow-hidden ${
                         activeProviders.includes('NTA')
                           ? selectedNtaAuth !== 'ALL' ? 'bg-red-50 dark:bg-red-900/20 border-red-400 ring-1 ring-red-400' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                           : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale'
                       }`}
                     >
                       <button
                         onClick={() => handleToggleProvider('NTA')}
                         className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                           activeProviders.includes('NTA') 
                             ? selectedNtaAuth !== 'ALL' ? 'text-red-700 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'
                             : 'text-zinc-400 dark:text-zinc-500'
                         }`}
                       >
                         <span>🏛️</span>
                         <span className="max-w-[80px] truncate">{selectedNtaAuth !== 'ALL' ? selectedNtaAuth : 'NTA 税務署'}</span>
                         <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ${
                           activeProviders.includes('NTA')
                             ? selectedNtaAuth !== 'ALL' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                             : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500'
                         }`}>
                           {ntaActiveCount}
                         </span>
                       </button>
                       <button
                         ref={ntaRefs.setReference}
                         onClick={() => { setIsNtaOpen(v => !v); setIsBitOpen(false); }}
                         className={`px-1.5 py-1 border-l hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors ${
                           activeProviders.includes('NTA')
                             ? selectedNtaAuth !== 'ALL' ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                             : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
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
                               onClick={() => { setSelectedNtaAuth('ALL'); setProvider('ALL'); setIsNtaOpen(false); triggerSearch({ managingAuthority: undefined, provider: undefined }); }}
                               className={`w-full text-left px-3 py-2 text-xs font-bold flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                 selectedNtaAuth === 'ALL' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-zinc-700 dark:text-zinc-300'
                               }`}
                             >
                               <span>すべての税務署</span>
                               {selectedNtaAuth === 'ALL' && <span className="text-red-500">✓</span>}
                             </button>
                             {authorityData.nta.length === 0 && (
                               <p className="text-[10px] text-zinc-400 px-3 py-2 italic">データなし</p>
                             )}
                             {authorityData.nta.map(item => (
                               <button
                                 key={item.name}
                                 onClick={() => { setSelectedNtaAuth(item.name); setProvider('NTA'); setIsNtaOpen(false); triggerSearch({ managingAuthority: item.name, provider: 'NTA' }); }}
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
                 </div>

                 <div className="w-px h-4 lg:h-3 bg-gray-200 dark:bg-zinc-700 shrink-0"></div>

                 {/* Line Filter */}
                 <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">
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
                       router.replace(`/?${params.toString()}`, { scroll: false });
                       
                     }} 
                     className={`text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none cursor-pointer appearance-none max-w-[120px] truncate ${selectedLine !== 'ALL' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                   >
                     <option value="ALL">路線指定なし</option>
                     {railData.map(r => (
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
                         router.replace(`/?${params.toString()}`, { scroll: false });
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
                         {railData.find(r => r.line === selectedLine)?.stations.map(st => (
                           <option key={st} value={st}>{st}</option>
                         ))}
                       </select>
                     </div>
                   </>
                 )}


                 {/* Walk Time Filter */}
                 {walkTime && (
                   <div className="flex items-center gap-1 shrink-0">
                     <span className="text-xl lg:text-sm leading-none mr-1">🚶‍♂️</span>
                     <select value={walkTime || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setWalkTime(v); triggerSearch({ maxWalkTime: v }); }} className="text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer appearance-none">
                       <option value="">徒歩制限なし</option>
                       <option value="5">5分以内</option>
                       <option value="10">10分以内</option>
                       <option value="15">15分以内</option>
                     </select>
                   </div>
                 )}


                 {/* Area Filter */}
                 {minArea && (
                   <div className="flex items-center gap-1 shrink-0">
                     <select value={minArea || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : undefined; setMinArea(v); triggerSearch({ minArea: v }); }} className="text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none text-blue-600 dark:text-blue-400 cursor-pointer appearance-none">
                       <option value="">広さ指定なし</option>
                       <option value="50">50m²以上</option>
                       <option value="100">100m²以上</option>
                       <option value="150">150m²以上</option>
                     </select>
                   </div>
                 )}

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
                     router.replace(`/?${params.toString()}`, { scroll: false });
                   }} className="text-sm lg:text-[11px] font-bold border-none bg-transparent outline-none text-blue-600 dark:text-blue-400 cursor-pointer appearance-none">
                     <option value="newest">✨ 新着順</option>
                     <option value="views">🔥 人気順</option>
                     <option value="ending">⏳ 入札間近</option>
                     <option value="priceAsc">💴 安い順</option>
                     <option value="areaDesc">📐 広い順</option>
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

        {/* Desktop & Mobile Handle */}
        <div className={`flex justify-center w-full px-2 sm:px-4 max-w-4xl relative z-40 transition-all duration-500 overflow-hidden ${!isExpanded ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-12 opacity-100'}`}>
          <button 
            onClick={() => setIsExpanded(false)}
            className="w-[120px] h-[24px] bg-white dark:bg-zinc-900 border border-t-0 border-gray-200 dark:border-zinc-800 rounded-b-xl shadow-md lg:shadow-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group group-button pointer-events-auto cursor-pointer"
            title="検索を閉じる"
          >
             <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
          </button>
        </div>

    </div>
  );
}
