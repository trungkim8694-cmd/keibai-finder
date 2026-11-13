'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Bookmark } from 'lucide-react';

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-app-client': 'keibai-finder-client'
  }
}).then(res => res.json());

export default function HeaderFavLink() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // Determine if we need to fetch Data from DB based on whether user is logged in
  const { data: serverFavs, mutate } = useSWR(
    status === 'authenticated' ? '/api/favorites' : null, 
    fetcher
  );

  // Sync Logic
  useEffect(() => {
    if (status === 'authenticated') {
      try {
        const favs = JSON.parse(localStorage.getItem('keibai_favorites') || '[]');
        if (favs.length > 0) {
          // Send all Local favorites to Server API bulk insertion
          fetch('/api/favorites/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-app-client': 'keibai-finder-client'
            },
            body: JSON.stringify({ ids: favs })
          }).then(res => res.json())
          .then(data => {
             if(data.success) {
               // Wipe localStorage to complete the migration
               localStorage.removeItem('keibai_favorites');
               // Refresh the Global SWR to reflect the merged hearts
               mutate();
               // Soft refresh the active page just in case we are looking at Property cards
               router.refresh(); 
             }
          });
        }
      } catch (e) {
        console.error('Error during Favorite Sync', e);
      }
    }
  }, [status, mutate, router]);

  // Actual display count calculation
  const currentFavs = status === 'authenticated' ? (serverFavs?.favorites || []) : [];
  const favCount = currentFavs.length;
  const hasFavs = favCount > 0;

  // Auth gate: intercept click for unauthenticated users
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') {
      setShowModal(true);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-850 shadow-2xs"
        title="お気に入り物件"
      >
        <Bookmark className={`w-3.5 h-3.5 transition-colors ${hasFavs ? 'fill-blue-600 text-blue-600' : 'text-slate-500'}`} />
        <span className="hidden sm:inline font-medium">お気に入り</span>
        {hasFavs && (
          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold text-[10px] rounded tabular-nums border border-blue-100 dark:border-blue-800">
            {favCount}
          </span>
        )}
      </button>

      {/* Auth-gate modal for unauthenticated users */}
      {showModal && (
        <FavAuthModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// Auth-gate modal component — shown when unauthenticated user clicks お気に入り
function FavAuthModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-[400px] w-full mx-4 p-6 relative border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-[10000]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6 mt-1">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-800">
            <Bookmark className="w-5 h-5 fill-blue-600 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
            お気に入り物件の保存
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            保存した物件はマイページで一元管理できます。ご利用には無料会員登録またはログインが必要です。
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); signIn('google'); }}
             className="w-full bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-2.5"
          >
             <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Googleアカウントでログイン
          </button>
          
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
             className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs py-2 px-4 rounded-lg transition-colors"
          >
             閉じる
          </button>
        </div>
        
        <p className="text-[10px] text-center text-slate-400 mt-3.5">
           SSL暗号化通信により個人情報は厳重に保護されます
        </p>
      </div>
    </div>,
    document.body
  );
}
