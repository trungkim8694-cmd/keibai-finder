'use client';
import { useEffect, useState } from 'react';
import { getTotalPropertiesCount } from '@/actions/propertyActions';

export default function HeaderTotalCount({ initialCount = 1568 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    getTotalPropertiesCount().then((c) => {
      if (c && c > 0) setCount(c);
    }).catch(() => {});

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setCount(customEvent.detail);
      }
    };
    window.addEventListener('update_property_count', handleUpdate);
    return () => window.removeEventListener('update_property_count', handleUpdate);
  }, []);

  if (count === 0) return null;

  return (
    <div 
      className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-2.5 sm:pr-3 mr-0.5 sm:mr-1 text-xs text-slate-500 dark:text-slate-400 group cursor-default"
      title="現在入札受付中の物件数です（過去落札・アーカイブ累計: 5,700件超）"
    >
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block"></span>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span className="hidden sm:inline">入札</span>受付中
        </span>
      </span>
      <span className="font-bold text-[#1B4F8A] dark:text-blue-400 tabular-nums text-xs sm:text-sm">
        {count.toLocaleString()}
      </span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">件</span>
    </div>
  );
}
