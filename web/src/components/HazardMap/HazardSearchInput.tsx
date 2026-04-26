'use client';
import { useState, useRef } from 'react';

export default function HazardSearchInput({
  onLocationSelected,
  onFlyOnlySelected
}: {
  onLocationSelected: (lat: number, lng: number) => void;
  onFlyOnlySelected: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (val: string) => {
    if (!val || val.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSuggestions(data.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    }, 400);
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
        setWarningMsg("詳細な住所（番地など）を入力するか、マップを直接クリックして解析を有効にしてください。");
        onFlyOnlySelected(lat, lng);
      } else {
        setWarningMsg(null);
        onLocationSelected(lat, lng);
      }
    } else {
      setErrorMsg("座標データが取得できませんでした。");
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
      <div className="relative flex items-center shadow-md bg-white rounded-lg border-2 border-transparent transition-all focus-within:border-blue-500 z-50">
        <div className="pl-3 text-zinc-400 shrink-0">
           <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {loading ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="animate-spin" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              )}
           </svg>
        </div>
        <input 
          type="text" 
          placeholder="住所を検索... (例: 東京都渋谷区代々木1-2-3)" 
          className="w-full bg-transparent px-3 py-3.5 text-zinc-800 text-[15px] font-medium outline-none placeholder:text-zinc-400 placeholder:font-normal"
          value={query}
          onChange={handleInputChange}
          onKeyDown={(e) => {
             if(e.key === 'Enter' && suggestions.length > 0) {
                 handleSelect(suggestions[0]);
             }
          }}
        />
        {query.length > 0 && (
          <button onClick={handleClear} className="pr-3 pl-2 h-full text-zinc-300 hover:text-zinc-500 transition-colors shrink-0">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
        <button 
          onClick={() => query && suggestions.length > 0 ? handleSelect(suggestions[0]) : fetchSuggestions(query)}
          className="bg-zinc-800 text-white font-bold text-[13px] px-4 h-[36px] mr-1.5 rounded-md hover:bg-zinc-700 transition-colors flex items-center shrink-0"
        >
          検索
        </button>
      </div>

      {/* Warning/Error Output */}
      {(warningMsg || errorMsg) && (
        <div className={`mt-2 p-2.5 rounded-lg text-[11px] font-bold shadow-sm items-center flex gap-1.5 animate-in fade-in slide-in-from-top-1 ${warningMsg ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
           <span className="text-[14px] leading-none shrink-0">⚠️</span> 
           <span className="leading-tight">{warningMsg || errorMsg}</span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-[52px] left-0 w-full bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-1">
          {suggestions.map((item, idx) => (
            <div 
              key={idx} 
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex flex-col justify-center"
              onClick={() => handleSelect(item)}
            >
              <span className="font-bold text-zinc-800 text-[13px]">{item.properties.title}</span>
            </div>
          ))}
          <div className="bg-gray-50 px-3 py-1.5 text-[10px] text-zinc-400 text-right w-full font-medium">
             GSI 国土地理院 API
          </div>
        </div>
      )}
    </div>
  );
}
