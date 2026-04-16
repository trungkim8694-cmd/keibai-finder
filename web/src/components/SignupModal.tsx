'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-[400px] w-full mx-4 p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors z-[10000]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ❤️
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            お気に入りを保存しましょう
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            お気に入りを登録するには、無料会員登録が必要です。登録すると、別のデバイスからもお気に入りを確認できます。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); signIn('google'); }}
             className="w-full bg-white border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-3"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Googleでログイン
          </button>
          
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
             className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl transition-colors"
          >
             閉じる
          </button>
        </div>
        
        <p className="text-[10px] text-center text-zinc-400 mt-4">
           個人情報は厳重に管理されます
        </p>
      </div>
    </div>,
    document.body
  );
}
