'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import SignupModal from './SignupModal';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>;
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <>
        <button 
          onClick={() => setShowSignup(true)}
          className="flex items-center justify-center w-[36px] h-[36px] sm:w-auto sm:h-auto sm:gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 sm:border sm:border-zinc-300 sm:dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:px-3 sm:py-1.5 rounded-full transition-colors"
          title="ログイン / 会員登録"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="hidden sm:inline">ログイン / 会員登録</span>
        </button>
        <SignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors focus:outline-none"
      >
        {session.user?.image ? (
          <Image src={session.user.image} alt="User Avatar" width={40} height={40} className="object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            {session.user?.name?.[0] || 'U'}
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <button 
            onClick={() => {
              setShowDropdown(false);
              window.location.href = '/dashboard';
            }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            👤 マイページ
          </button>
          
          <Link 
            href="/trade-find"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowDropdown(false)}
            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            📊 不動産取引価格検索
          </Link>
          
          <Link 
            href="/features/map-search"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowDropdown(false)}
            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ✨ 機能紹介
          </Link>
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
          <button 
            onClick={() => {
              setShowDropdown(false);
              signOut();
            }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            🚪 ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
