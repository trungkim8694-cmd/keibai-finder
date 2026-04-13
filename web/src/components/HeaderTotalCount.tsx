'use client';
import { useEffect, useState } from 'react';

export default function HeaderTotalCount({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
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
    <div className="flex items-center gap-1 sm:gap-1.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 sm:pr-4 mr-0 sm:mr-1 h-6 sm:h-8">
      {/* Mobile view: purely small number with light background */}
      <span className="sm:hidden text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-full">
        {count}件
      </span>
      
      {/* Desktop view: "44 件の物件" */}
      <span className="hidden sm:inline font-bold text-zinc-800 dark:text-zinc-200 text-sm">
        {count}
      </span>
      <span className="hidden sm:inline text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        件の物件
      </span>
    </div>
  );
}
