'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import SignupModal from './SignupModal';
import { 
  User, 
  Bookmark, 
  Clock, 
  Building2, 
  HelpCircle, 
  LayoutDashboard, 
  MessageSquare, 
  Inbox, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Kanban
} from 'lucide-react';

const maskName = (name: string | null): string => {
  if (!name) return 'ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (session) {
      setShowSignup(false);
      // Clean up ?login=true, callbackUrl, error from URL if present
      if (params.get('login') || params.get('callbackUrl') || params.get('error')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('login');
        url.searchParams.delete('callbackUrl');
        url.searchParams.delete('error');
        const cleanPath = url.pathname + (url.search ? url.search : '');
        window.history.replaceState({}, '', cleanPath);
      }
    } else if (status !== 'loading' && params.get('login') === 'true') {
      setShowSignup(true);
    }
  }, [session, status]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800"></div>;
  }

  const handleLinkClick = () => {
    setShowDropdown(false);
  };

  const maskedName = session?.user?.name ? maskName(session.user.name) : 'ユーザー';
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button - Clean Japanese B2B Avatar */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none shadow-2xs shrink-0 border ${
          showDropdown 
            ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40 bg-slate-50 dark:bg-slate-800' 
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
        }`}
        aria-label="ユーザーメニュー"
        aria-expanded={showDropdown}
      >
        {session?.user ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold text-xs rounded-full">
            {Array.from(maskedName)[0]}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400">
            <User className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Unified Compact B2B User Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 font-sans text-xs">
          
          {session ? (
            /* ================= 1. Authenticated User State ================= */
            <div>
              {/* Profile Header */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                    {Array.from(maskedName)[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {maskedName} 様
                      </span>
                      {isAdmin ? (
                        <span className="px-1.5 py-0.2 bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] font-bold rounded border border-red-200 dark:border-red-800">
                          管理者
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-semibold rounded border border-blue-100 dark:border-blue-800">
                          会員
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {session.user?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Navigation Items */}
              <div className="p-1.5 space-y-0.5 text-slate-700 dark:text-slate-300">
                {/* Investor Portal */}
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                  投資家・マイページ
                </div>
                <Link 
                  href="/dashboard?tab=favorites"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Kanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>お気に入り・検討ボード</span>
                </Link>

                <Link 
                  href="/dashboard?tab=leads"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>相談・問い合わせ履歴</span>
                </Link>

                {/* Real Estate Partner Portal */}
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider border-t border-slate-100 dark:border-slate-800">
                  宅建会社・パートナー管理
                </div>
                <Link 
                  href="/dashboard?tab=company"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>自社プロファイル・認証申請</span>
                </Link>

                <Link 
                  href="/dashboard?tab=partner-leads"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Inbox className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>見込み客リード管理 (CRM)</span>
                </Link>

                {/* Admin Portal if Admin */}
                {isAdmin && (
                  <>
                    <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-red-500 tracking-wider border-t border-slate-100 dark:border-slate-800">
                      運営管理
                    </div>
                    <Link 
                      href="/admin"
                      onClick={handleLinkClick}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-red-50/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-300 transition-colors font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-600" />
                      <span>管理者ダッシュボード</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Logout Action */}
              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => {
                    handleLinkClick();
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors text-xs font-medium text-left"
                >
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= 2. Unauthenticated (Guest) State ================= */
            <div>
              {/* Member Benefit Header */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">会員機能</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  無料会員登録でお気に入り物件の保存や、周辺不動産会社への相談が可能になります。
                </p>
                <button 
                  onClick={() => {
                    handleLinkClick();
                    setShowSignup(true);
                  }}
                  className="w-full bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-semibold py-2 px-3 rounded-md transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>ログイン / 会員登録</span>
                </button>
              </div>

              {/* Quick Member Shortcuts */}
              <div className="p-1.5 space-y-0.5 text-slate-700 dark:text-slate-300">
                <button 
                  onClick={() => {
                    handleLinkClick();
                    setShowSignup(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    お気に入り・検討ボード
                  </span>
                  <span className="text-[10px] text-slate-400">要ログイン</span>
                </button>

                <Link 
                  href="/agencies"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>全国宅建会社・入札代行</span>
                </Link>

                <Link 
                  href="/blogs"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>競売ナレッジ & ガイド</span>
                </Link>
              </div>

              {/* Footer Meta */}
              <div className="p-2.5 bg-slate-50/80 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <Link href="/company" onClick={handleLinkClick} className="hover:text-slate-600 dark:hover:text-slate-300">
                  運営: TQC株式会社
                </Link>
                <div className="flex gap-2">
                  <Link href="/terms" onClick={handleLinkClick} className="hover:text-slate-600 dark:hover:text-slate-300">
                    利用規約
                  </Link>
                  <span>•</span>
                  <Link href="/privacy" onClick={handleLinkClick} className="hover:text-slate-600 dark:hover:text-slate-300">
                    プライバシー
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Auth signup/login modal */}
      <SignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} />
    </div>
  );
}
