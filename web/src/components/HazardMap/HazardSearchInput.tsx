'use client';
import { useState, useRef, useEffect } from 'react';

export default function HazardSearchInput({
  onLocationSelected,
  onFlyOnlySelected
}: {
  onLocationSelected: (lat: number, lng: number, title?: string) => void;
  onFlyOnlySelected: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAddressData = async (val: string): Promise<any[]> => {
    if (!val || val.trim().length < 2) return [];
    
    // Abort previous in-flight requests to eliminate race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(val.trim())}`, {
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('GSI Address Search Error:', err);
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (val: string) => {
    const data = await fetchAddressData(val);
    if (data && data.length > 0) {
      setSuggestions(data.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setErrorMsg(null);
    setWarningMsg(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 350);
  };

  const handleSelect = (item: any) => {
    setQuery(item.properties.title);
    setSuggestions([]);
    
    // Geometry logic
    if (item.geometry && item.geometry.coordinates && item.geometry.coordinates.length === 2) {
      const lng = item.geometry.coordinates[0];
      const lat = item.geometry.coordinates[1];
      const title = item.properties.title;

      // Precision Validator Regex
      // Check if it's a broad area (ends with Prefecture/City/Ward/Town and contains no numbers or Chome)
      const isBroadArea = /(?:都|道|府|県|市|区|郡|町|村)$/.test(title) && !/[0-9０-９一二三四五六七八九十百丁番号]/.test(title);

      if (isBroadArea) {
        setWarningMsg("詳細な住所（番地など）を入力するか、マップを直接クリックして詳細解析を有効にしてください。");
        onFlyOnlySelected(lat, lng);
      } else {
        setWarningMsg(null);
        onLocationSelected(lat, lng, title);
      }
    } else {
      setErrorMsg("座標データが取得できませんでした。");
    }
  };

  // One-click/Enter Instant Direct Search Handler
  const handleExecuteSearch = async () => {
    if (!query || query.trim().length < 2) return;
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }
    const results = await fetchAddressData(query);
    if (results.length > 0) {
      handleSelect(results[0]);
    } else {
      setErrorMsg("該当する住所が見つかりませんでした。別のキーワード（都道府県や市区町村名）をお試しください。");
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setErrorMsg(null);
    setWarningMsg(null);
  };

  return (
    <div className="w-full relative">
      <div className="relative flex items-center shadow-sm bg-white dark:bg-[#151B22] rounded-lg border border-slate-200 dark:border-slate-800 transition-all focus-within:border-[#1B4F8A] dark:focus-within:border-[#2B6CB0] focus-within:ring-1 focus-within:ring-[#1B4F8A] z-50">
        <div className="pl-3 text-slate-400 dark:text-slate-500 shrink-0">
           <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {loading ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="animate-spin" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              )}
           </svg>
        </div>
        <input 
          type="text" 
          placeholder="住所・市区町村を検索... (例: 東京都渋谷区代々木)" 
          className="w-full bg-transparent px-3 py-2 text-slate-900 dark:text-slate-100 text-xs md:text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          value={query}
          onChange={handleInputChange}
          onKeyDown={(e) => {
             if (e.key === 'Enter') {
               e.preventDefault();
               handleExecuteSearch();
             }
          }}
        />
        {query.length > 0 && (
          <button 
            type="button"
            onClick={handleClear} 
            className="pr-2 pl-1 h-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            title="入力をクリア"
          >
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
        <button 
          type="button"
          onClick={handleExecuteSearch}
          className="bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-medium text-xs px-3.5 h-[32px] mr-1 rounded-md transition-colors flex items-center shrink-0 cursor-pointer active:scale-95"
        >
          検索
        </button>
      </div>

      {/* Warning/Error Output */}
      {(warningMsg || errorMsg) && (
        <div className={`mt-2 p-2 rounded-lg text-[11px] font-medium shadow-sm items-center flex gap-1.5 animate-in fade-in slide-in-from-top-1 ${
          warningMsg 
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
        }`}>
           <span className="text-xs leading-none shrink-0">⚠️</span> 
           <span className="leading-tight">{warningMsg || errorMsg}</span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-[44px] left-0 w-full bg-white dark:bg-[#151B22] rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-40 animate-in fade-in slide-in-from-top-1">
          {suggestions.map((item, idx) => (
            <div 
              key={idx} 
              className="px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-0 flex flex-col justify-center transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs md:text-sm">{item.properties.title}</span>
            </div>
          ))}
          <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 text-right w-full font-medium">
             国土地理院 住所検索API（完全無料・高精度）
          </div>
        </div>
      )}
    </div>
  );
}
