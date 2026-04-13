'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface TradeSearchFormProps {
  initialPref: string;
  initialCity: string;
  initialType: string;
}

const parsePrefecture = (q: string) => {
  const prefRegex = /^(.{2,3}[都道府県])/;
  const match = q.match(prefRegex);
  if (match) {
    const pref = match[1];
    const city = q.substring(pref.length).trim();
    return { pref, city };
  }
  return { pref: '', city: q.trim() };
};

export default function TradeSearchForm({ initialPref, initialCity, initialType }: TradeSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialPref && initialCity ? `${initialPref}${initialCity}` : (initialCity || ''));
  const [type, setType] = useState(initialType || '戸建て');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    // Phân tích "富山県富山市" thành pref=富山県, city=富山市
    const { pref, city } = parsePrefecture(query);

    const params = new URLSearchParams();
    if (pref) params.set('pref', pref);
    if (city) params.set('city', city);
    params.set('type', type);

    router.push(`/trade/find?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold text-zinc-500 mb-2">フリーワード (都道府県・市区町村)</label>
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: 富山県富山市"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-48 shrink-0">
          <label className="block text-xs font-bold text-zinc-500 mb-2">物件種別</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="戸建て">戸建て</option>
            <option value="マンション">マンション</option>
            <option value="土地">土地</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full md:w-auto bg-zinc-800 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black hover:-translate-y-0.5 transition-all font-bold px-8 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm"
        >
          <Search className="w-4 h-4" />
          検索する
        </button>

      </form>
    </div>
  );
}
