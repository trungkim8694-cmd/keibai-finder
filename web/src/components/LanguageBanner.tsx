'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';

const LANG_CONFIG = [
  { code: 'vi', prefix: '/vi', name: 'Tiếng Việt', message: 'Bạn muốn xem trang này bằng Tiếng Việt?' },
  { code: 'en', prefix: '/en', name: 'English', message: 'Would you like to read this page in English?' },
  { code: 'zh', prefix: '/zh', name: '中文', message: '您想用中文阅读此页面吗？' }
];

export default function LanguageBanner() {
  const [suggestion, setSuggestion] = useState<typeof LANG_CONFIG[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Basic language detection
    const browserLang = navigator.language.toLowerCase();
    let suggestedLang = null;

    if (browserLang.startsWith('vi')) suggestedLang = LANG_CONFIG.find(l => l.code === 'vi');
    else if (browserLang.startsWith('zh')) suggestedLang = LANG_CONFIG.find(l => l.code === 'zh');
    else if (browserLang.startsWith('en')) suggestedLang = LANG_CONFIG.find(l => l.code === 'en');
    
    // Check if we are already on a localized route
    const isAlreadyLocalized = LANG_CONFIG.some(l => pathname.startsWith(l.prefix));
    
    if (suggestedLang && !isAlreadyLocalized) {
       setSuggestion(suggestedLang);
       setIsVisible(true);
    }
  }, [pathname]);

  if (!isVisible || !suggestion) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 pr-10 relative max-w-sm flex items-start gap-4">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">{suggestion.message}</p>
          <Link 
            href={`${suggestion.prefix}${pathname}`} 
            className="inline-flex text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Switch to {suggestion.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
