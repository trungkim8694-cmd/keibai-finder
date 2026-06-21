'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import SignupModal from './SignupModal';
import { 
  Map, 
  TrendingUp, 
  Shield, 
  MapPin, 
  TramFront, 
  Layers, 
  Menu, 
  User, 
  LogOut,
  ChevronRight
} from 'lucide-react';

const maskName = (name: string | null): string => {
  if (!name) return '匿名ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '匿名ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    return <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>;
  }

  const handleLinkClick = () => {
    setShowDropdown(false);
  };

  const maskedName = session?.user?.name ? maskName(session.user.name) : '匿名ユーザー';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all focus:outline-none shadow-sm shrink-0 ${
          showDropdown 
            ? 'border-blue-500 bg-zinc-100 dark:bg-zinc-800' 
            : 'border-zinc-200 hover:border-blue-500 dark:border-zinc-800 dark:hover:border-blue-500 bg-white dark:bg-zinc-900'
        }`}
        aria-label="User menu and site navigation"
        aria-expanded={showDropdown}
      >
        {session?.user ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-sm">
            {Array.from(maskedName)[0]}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-450 dark:bg-zinc-800 dark:text-zinc-400">
            <User className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Unified Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 overflow-y-auto max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          
          {/* Section 1: User Account Header */}
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900">
            {session ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {Array.from(maskedName)[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {maskedName}
                    </div>
                    <div className="text-xs text-zinc-500 truncate font-mono">
                      {session.user?.email || ""}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      handleLinkClick();
                      window.location.href = '/dashboard';
                    }}
                    className="flex-1 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    👤 マイページ
                  </button>
                  <button 
                    onClick={() => {
                      handleLinkClick();
                      signOut();
                    }}
                    className="px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center"
                    title="ログアウト"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2.5">
                  お気に入り登録やサポート会社への相談には会員登録が必要です。
                </p>
                <button 
                  onClick={() => {
                    handleLinkClick();
                    setShowSignup(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  ログイン / 会員登録
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-5">
            
            {/* Section 2: Directories */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400 dark:text-zinc-500">ディレクトリ (Directories)</h4>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/" onClick={handleLinkClick}
                  className="flex items-center gap-2 text-xs bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-xl transition-all font-bold border border-blue-100/40 dark:border-blue-900/20"
                >
                  <div className="w-5 h-5 rounded-lg bg-white dark:bg-blue-800/30 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/30">
                    <Map className="w-3 h-3 text-blue-500" />
                  </div>
                  日本全国の物件マップ検索
                </Link>

                <Link 
                  href="/search/area" onClick={handleLinkClick}
                  className="flex items-center gap-2 text-xs bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-xl transition-all font-bold border border-rose-100/40 dark:border-rose-900/20"
                >
                  <div className="w-5 h-5 rounded-lg bg-white dark:bg-rose-800/30 flex items-center justify-center shrink-0 border border-rose-100/80 dark:border-rose-900/30">
                    <MapPin className="w-3 h-3 text-rose-500" />
                  </div>
                  地域・エリアから探す
                </Link>
                
                <Link 
                  href="/search/station" onClick={handleLinkClick}
                  className="flex items-center gap-2 text-xs bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl transition-all font-bold border border-emerald-100/40 dark:border-emerald-900/20"
                >
                  <div className="w-5 h-5 rounded-lg bg-white dark:bg-emerald-800/30 flex items-center justify-center shrink-0 border border-emerald-100/80 dark:border-emerald-900/30">
                    <TramFront className="w-3 h-3 text-emerald-500" />
                  </div>
                  路線・駅から探す
                </Link>
              </div>
            </div>

            {/* Section 3: Tools */}
            <div className="space-y-2 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50">
              <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400 dark:text-zinc-500">ツール (Tools)</h4>
              <div className="flex flex-col gap-1.5">
                <Link href="/extension" onClick={handleLinkClick} className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-105 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 border border-zinc-200/50 dark:border-zinc-800">
                    <img src="/extension-icon.png" alt="Keibai Lens" className="w-3.5 h-3.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  Keibai Lens 拡張機能
                </Link>
                <Link href="/trade-find" onClick={handleLinkClick} className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-105 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-xs opacity-80 group-hover:opacity-100">⚖️</span>
                  </div>
                  不動産取引価格検索 (MLIT)
                </Link>
                <Link href="/area-map" onClick={handleLinkClick} className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-105 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-xs opacity-80 group-hover:opacity-100">🌋</span>
                  </div>
                  エリア分析マップ
                </Link>
                <Link href="/market-insights" onClick={handleLinkClick} className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1">
                  <div className="w-6 h-6 shrink-0 rounded-lg bg-zinc-105 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-xs opacity-80 group-hover:opacity-100">📈</span>
                  </div>
                  市場分析ダッシュボード
                </Link>
              </div>
            </div>

            {/* Section 4: Features */}
            <div className="space-y-3 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50">
              <Link href="/features" onClick={handleLinkClick} className="flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition-colors">
                機能紹介 (FEATURES) <ChevronRight className="w-3 h-3" />
              </Link>
              
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-400">
                  <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/extension-icon.png" alt="Keibai Lens" className="w-3.5 h-3.5 rounded-full opacity-90" />
                  </div>
                  Keibai Lensについて
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  <Link onClick={handleLinkClick} href="/extension" className="text-[10px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/10 text-indigo-750 dark:text-indigo-350 px-2 py-0.5 rounded-lg">日本語</Link>
                  <Link onClick={handleLinkClick} href="/en/extension" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">EN</Link>
                  <Link onClick={handleLinkClick} href="/vi/extension" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">VI</Link>
                  <Link onClick={handleLinkClick} href="/zh/extension" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">ZH</Link>
                </div>
              </div>

              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-400">
                  <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                    <Map className="w-2.5 h-2.5 text-blue-500" />
                  </div>
                  地図検索について
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  <Link onClick={handleLinkClick} href="/features/map-search" className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 text-blue-705 dark:text-blue-350 px-2 py-0.5 rounded-lg">日本語</Link>
                  <Link onClick={handleLinkClick} href="/en/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">EN</Link>
                  <Link onClick={handleLinkClick} href="/vi/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">VI</Link>
                  <Link onClick={handleLinkClick} href="/zh/features/map-search" className="text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg">ZH</Link>
                </div>
              </div>
            </div>

            {/* Section 5: Insights */}
            <div className="space-y-2 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50">
              <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400 dark:text-zinc-500">📰 レポート & ガイド</h4>
              <div className="flex flex-col gap-1">
                <Link href="/insights" onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group p-1">
                  <span className="text-xs shrink-0">📰</span>
                  <span className="line-clamp-1">すべての市場レポートを見る</span>
                </Link>
                <Link href="/blogs" onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group p-1">
                  <span className="text-xs shrink-0">📖</span>
                  <span className="line-clamp-1">ナレッジ & ガイド (BLOGS)</span>
                </Link>
              </div>
            </div>

            {/* Section 6: Legal & Contact */}
            <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-2.5">
              <div className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold leading-relaxed space-y-1.5">
                <div>運営会社: <Link onClick={handleLinkClick} href="/company" className="hover:text-zinc-900 dark:hover:text-zinc-200 font-bold transition-colors">TQC株式会社</Link></div>
                <div>所在地: 〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F</div>
                <div>TEL: (03) 6907-1219 / FAX (03) 6701-2399</div>
                <div>Email: <a href="mailto:info@keibai-koubai.com" className="hover:text-blue-600 transition-colors">info@keibai-koubai.com</a></div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold mt-1 text-zinc-400 dark:text-zinc-500">
                <Link onClick={handleLinkClick} href="/company" className="hover:text-zinc-800 dark:hover:text-zinc-300">運営会社</Link>
                <Link onClick={handleLinkClick} href="/terms" className="flex items-center gap-0.5 hover:text-zinc-800 dark:hover:text-zinc-300">
                  <Shield className="w-2.5 h-2.5" /> 利用規約
                </Link>
                <Link onClick={handleLinkClick} href="/privacy" className="hover:text-zinc-800 dark:hover:text-zinc-300">プライバシー</Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Auth signup/login modal */}
      <SignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} />
    </div>
  );
}
