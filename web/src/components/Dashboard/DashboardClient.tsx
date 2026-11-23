'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Kanban, 
  MessageSquare, 
  Building2, 
  Inbox, 
  Settings, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  Save, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  FileText,
  User as UserIcon,
  Filter,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { 
  updateFavoriteStage, 
  saveUserMemo, 
  removeFavorite, 
  updateClaimedCompanyProfile, 
  updatePartnerLeadStatus, 
  updateUserAccountProfile 
} from '@/actions/userDashboardActions';
import { CompanyClaimModal } from '@/components/Agency/CompanyClaimModal';

interface DashboardClientProps {
  sessionUser: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
  initialFavorites: any[];
  userLeads: any[];
  claimedCompanies: any[];
  claimRequests: any[];
  partnerLeads: any[];
}

const STAGES: Record<string, { label: string; color: string; border: string; bg: string }> = {
  CONSIDERING: { label: '検討中', color: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  INSPECTED: { label: '現地調査済', color: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  BID_PREPARING: { label: '入札準備中', color: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  BID_SUBMITTED: { label: '入札済', color: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  SKIPPED: { label: '見送り', color: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-100 dark:bg-slate-800' },
};

const LEAD_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: '新規リード', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  DISPATCHED: { label: '配信済', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  CONTACTED: { label: '連絡済', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  IN_CONSULTATION: { label: '商談中', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  WON: { label: '成約・受任', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CLOSED: { label: '対応終了', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
};

const AVAILABLE_SPECIALTIES = [
  '競売入札代行',
  '明渡し交渉',
  '任意売却',
  '物件調査',
  'リフォーム',
  '賃貸管理',
  '収益物件仲介',
];

export function DashboardClient({
  sessionUser,
  initialFavorites,
  userLeads,
  claimedCompanies: initialClaimedCompanies,
  claimRequests: initialClaimRequests,
  partnerLeads: initialPartnerLeads,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('favorites');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('tab');
      if (t) setActiveTab(t);
    }
  }, []);

  // State
  const [favorites, setFavorites] = useState(initialFavorites);
  const [claimedCompanies, setClaimedCompanies] = useState(initialClaimedCompanies);
  const [partnerLeads, setPartnerLeads] = useState(initialPartnerLeads);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  
  // Memo editing state
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState<string>('');

  // Company Claim Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCompanyForClaim, setSelectedCompanyForClaim] = useState<any | null>(null);

  // Company Profile Editing state
  const activeCompany = claimedCompanies.length > 0 ? claimedCompanies[0] : null;
  const [editSpecialties, setEditSpecialties] = useState<string[]>(activeCompany?.specialties || []);
  const [editDescription, setEditDescription] = useState<string>(activeCompany?.description || '');
  const [editPhone, setEditPhone] = useState<string>(activeCompany?.phone || '');
  const [editEmail, setEditEmail] = useState<string>(activeCompany?.email || '');
  const [editWebsite, setEditWebsite] = useState<string>(activeCompany?.website || '');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  // Tab switcher
  const setTab = (tabName: string) => {
    setActiveTab(tabName);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    params.set('tab', tabName);
    router.push(`/dashboard?${params.toString()}`);
  };

  // Stage change handler
  const handleStageChange = async (sale_unit_id: string, newStage: string) => {
    setFavorites(prev => prev.map(f => f.propertyId === sale_unit_id ? { ...f, stage: newStage } : f));
    await updateFavoriteStage(sessionUser.id, sale_unit_id, newStage);
  };

  // Save memo handler
  const handleSaveMemo = async (sale_unit_id: string) => {
    setFavorites(prev => prev.map(f => f.propertyId === sale_unit_id ? { ...f, memo: memoText } : f));
    await saveUserMemo(sessionUser.id, sale_unit_id, memoText);
    setEditingMemoId(null);
  };

  // Remove favorite handler
  const handleRemoveFavorite = async (sale_unit_id: string) => {
    if (!confirm('この物件をお気に入りから削除しますか？')) return;
    setFavorites(prev => prev.filter(f => f.propertyId !== sale_unit_id));
    await removeFavorite(sessionUser.id, sale_unit_id);
  };

  // Company live search
  const handleCompanySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Save company profile
  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    setIsSavingCompany(true);
    setCompanySaveSuccess(false);

    try {
      const res = await updateClaimedCompanyProfile(activeCompany.id, sessionUser.id, {
        specialties: editSpecialties,
        description: editDescription,
        phone: editPhone,
        email: editEmail,
        website: editWebsite,
      });

      if (res.success) {
        setCompanySaveSuccess(true);
        setClaimedCompanies(prev => prev.map(c => c.id === activeCompany.id ? res.company : c));
        setTimeout(() => setCompanySaveSuccess(false), 4000);
      } else {
        alert(res.error || '保存に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Lead CRM status update
  const handleLeadStatusChange = async (leadId: string, newStatus: string, notes?: string) => {
    setPartnerLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, partnerNotes: notes ?? l.partnerNotes } : l));
    await updatePartnerLeadStatus(leadId, newStatus, notes);
  };

  const filteredFavorites = selectedStageFilter === 'ALL' 
    ? favorites 
    : favorites.filter(f => f.stage === selectedStageFilter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/" className="hover:underline">トップ</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">マイページ・管理ポータル</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>マイページ & 宅建パートナーポータル</span>
                {sessionUser.role === 'ADMIN' && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded font-bold">
                    管理者
                  </span>
                )}
                {claimedCompanies.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 公式認証企業
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">ログイン中:</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                {sessionUser.email}
              </span>
              {sessionUser.role === 'ADMIN' && (
                <Link 
                  href="/admin" 
                  className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> 管理者画面へ
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800 -mb-6 pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-lg'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>お気に入り・検討ボード ({favorites.length})</span>
            </button>

            <button
              onClick={() => setTab('leads')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'leads'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-lg'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>相談・問い合わせ履歴 ({userLeads.length})</span>
            </button>

            <button
              onClick={() => setTab('company')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'company'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-lg'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>自社プロファイル・認証申請 {claimedCompanies.length > 0 ? '(認証済)' : ''}</span>
            </button>

            <button
              onClick={() => setTab('partner-leads')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'partner-leads'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-lg'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>見込み客リード管理 (CRM) ({partnerLeads.length})</span>
            </button>

            <button
              onClick={() => setTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-lg'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>アカウント設定</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content Container (1280px standard) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ================= TAB 1: FAVORITES & KANBAN STAGES ================= */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            {/* Top Stage Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> 進捗フィルター:
                </span>
                <button
                  onClick={() => setSelectedStageFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStageFilter === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  すべて ({favorites.length})
                </button>
                {Object.entries(STAGES).map(([key, info]) => {
                  const count = favorites.filter(f => f.stage === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedStageFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedStageFilter === key
                          ? `${info.bg} ${info.color} ${info.border} ring-2 ring-blue-500/20 shadow-xs`
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{info.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white/80 dark:bg-slate-800 rounded font-semibold border border-slate-200 dark:border-slate-700">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>＋ 新しい物件を探す</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Empty State */}
            {filteredFavorites.length === 0 && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                <Kanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  該当する物件はありません
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  物件一覧や地図からハートアイコンを押してお気に入り登録すると、進捗ステージの管理や検討メモが保存できます。
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>全国の競売物件を検索する</span>
                </Link>
              </div>
            )}

            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFavorites.map((item) => {
                const prop = item.property;
                if (!prop) {
                  return (
                    <div key={item.propertyId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      物件情報が掲載終了または削除されました ({item.propertyId})
                    </div>
                  );
                }

                const currentStageInfo = STAGES[item.stage] || STAGES.CONSIDERING;

                return (
                  <div 
                    key={item.propertyId}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col hover:border-blue-400 dark:hover:border-blue-700 transition-all group"
                  >
                    {/* Card Header & Stage Pill */}
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {prop.court_name || '地方裁判所'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prop.case_number || prop.sale_unit_id}
                        </span>
                      </div>

                      {/* Stage Selector Dropdown */}
                      <select
                        value={item.stage}
                        onChange={(e) => handleStageChange(item.propertyId, e.target.value)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${currentStageInfo.bg} ${currentStageInfo.color} ${currentStageInfo.border} cursor-pointer focus:outline-none`}
                      >
                        {Object.entries(STAGES).map(([k, s]) => (
                          <option key={k} value={k}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Thumbnail & Key Info */}
                    <div className="p-4 flex gap-3.5">
                      <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 relative">
                        {prop.thumbnailUrl ? (
                          <img 
                            src={prop.thumbnailUrl} 
                            alt={prop.display_title || prop.address || '物件写真'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            画像準備中
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {prop.display_title || prop.asset_type || '競売不動産物件'}
                        </h4>
                        
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{prop.address || '住所情報'}</span>
                        </div>

                        <div className="mt-2">
                          <div className="text-[10px] text-slate-400">売却基準価額 / 目安</div>
                          <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                            {prop.standard_sales_price 
                              ? `${Number(prop.standard_sales_price).toLocaleString()} 円`
                              : (prop.benchmark_price ? `${Number(prop.benchmark_price).toLocaleString()} 円` : '価格非公開')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Memo Note Section */}
                    <div className="px-4 py-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-t border-b border-amber-100 dark:border-amber-900/40 text-xs">
                      {editingMemoId === item.propertyId ? (
                        <div className="space-y-2">
                          <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            placeholder="検討理由、現地調査メモ、入札想定価格などを記入..."
                            className="w-full text-xs p-2 rounded border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMemoId(null)}
                              className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => handleSaveMemo(item.propertyId)}
                              className="px-2.5 py-1 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> 保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] text-amber-900 dark:text-amber-200 italic line-clamp-2">
                            {item.memo ? `📝 ${item.memo}` : '＋ 検討メモを追加...'}
                          </p>
                          <button
                            onClick={() => {
                              setEditingMemoId(item.propertyId);
                              setMemoText(item.memo || '');
                            }}
                            className="text-amber-700 hover:text-amber-900 dark:text-amber-400 p-1 shrink-0"
                            title="メモを編集"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-3 bg-white dark:bg-slate-900 mt-auto flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleRemoveFavorite(item.propertyId)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="お気に入りから削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/property/${item.propertyId}`}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-md transition-colors flex items-center gap-1"
                        >
                          <span>詳細を見る</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: USER CONSULTATION LEADS HISTORY ================= */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>不動産会社へのご相談・問い合わせ履歴</span>
              </h3>
              <p className="text-xs text-slate-500">
                あなたが送信した「落札サポート・入札代行のご相談」の配信先および対応ステータスです。
              </p>
            </div>

            {userLeads.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  まだ送信した相談履歴はありません
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  物件詳細ページや不動産会社データベースから、入札代行や占有者明渡しの無料相談を行えます。
                </p>
                <Link
                  href="/agencies"
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-xs transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>全国不動産会社データベースを見る</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userLeads.map((lead: any) => {
                  const statusInfo = LEAD_STATUSES[lead.status] || LEAD_STATUSES.NEW;
                  return (
                    <div 
                      key={lead.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            ご相談種別: {lead.inquiryType || '入札代行・鑑定査定'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(lead.created_at).toLocaleDateString('ja-JP')} {new Date(lead.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-slate-400 font-semibold mb-1">お名前・連絡先:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{lead.customerName} 様</div>
                          <div className="text-slate-500 font-mono">{lead.contactMethod}: {lead.contactValue}</div>
                        </div>

                        {lead.sale_unit_id && (
                          <div>
                            <div className="text-slate-400 font-semibold mb-1">対象競売物件:</div>
                            <Link 
                              href={`/property/${lead.sale_unit_id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>物件詳細ページを開く ({lead.sale_unit_id})</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {lead.message && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
                          {lead.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: REAL ESTATE PARTNER PROFILE & CLAIM ================= */}
        {activeTab === 'company' && (
          <div className="space-y-8">
            {/* If user already claimed a company */}
            {activeCompany ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>国土交通省公的登録・公式認証パートナー</span>
                    </div>
                    <h2 className="text-xl font-black">{activeCompany.companyName}</h2>
                    <p className="text-xs text-blue-200 mt-1">
                      免許番号: {activeCompany.licenseNumber} ｜ 法人番号: {activeCompany.houjinNumber || '登録済'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/agencies"
                      className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <span>全国会社一覧で確認</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    {activeCompany.houjinNumber && (
                      <a
                        href={`https://kigyoulist.com/company/${activeCompany.houjinNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-lg bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span>kigyoulist.com プロフィール</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSaveCompanyProfile} className="p-6 space-y-6">
                  {companySaveSuccess && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>プロフィール情報を正常に更新しました。全国一覧ページおよび物件ページに即時反映されます。</span>
                    </div>
                  )}

                  {/* 1. Specialties Tag Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      🏷️ 得意分野・対応可能業務（全国一覧のカードに表示）
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      貴社が対応可能なサービスを選択してください（デフォルトは「宅建免許保有」のみ表示されています）。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_SPECIALTIES.map((spec) => {
                        const isChecked = editSpecialties.includes(spec);
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => {
                              if (isChecked) {
                                setEditSpecialties(prev => prev.filter(s => s !== spec));
                              } else {
                                setEditSpecialties(prev => [...prev, spec]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{spec}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Company Description (Max 200 chars) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        📝 自社PR・企業紹介文（最大200文字）
                      </label>
                      <span className={`text-[11px] font-mono ${
                        editDescription.length > 200 ? 'text-red-500 font-bold' : 'text-slate-400'
                      }`}>
                        {editDescription.length} / 200 文字
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      空欄の場合はデフォルトの公的登録免責文言が表示されます。貴社の競売実績やサポート強みをPRしてください。
                    </p>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                      placeholder="例: 東京・埼玉エリア特化の競売代行及びリノベーション同族会社。戸建て・マンションの立退き交渉ノウハウが豊富で、入札からリフォーム・賃貸付けまで一貫体制でご提案します。"
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    />
                  </div>

                  {/* 3. Contact Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        📞 お客様向け受付電話番号
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="例: 03-1234-5678"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        ✉️ リード通知・連絡用メールアドレス
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="例: info@company.co.jp"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* 4. Official Website */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      🌐 企業公式サイトURL（任意）
                    </label>
                    <input
                      type="url"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="例: https://www.company.co.jp"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingCompany || editDescription.length > 200}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingCompany ? '保存中...' : 'プロフィールを保存・反映'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {/* Submitted Claim Requests Status Tracking */}
            {initialClaimRequests.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>オーナー確認・認証申請の審査ステータス</span>
                </h3>
                
                <div className="space-y-3">
                  {initialClaimRequests.map((req: any) => {
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';

                    return (
                      <div 
                        key={req.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {req.company?.companyName || '申請対象企業'}
                            </span>
                            {isPending && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                審査中（1営業日以内）
                              </span>
                            )}
                            {isApproved && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                認証済
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                却下
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            申請方法: {req.verificationMethod === 'DOCUMENT' ? `書類提出 (${req.documentType || '名刺・謄本'})` : '会社ドメインメール認証'} ｜ 申請日: {new Date(req.created_at).toLocaleDateString('ja-JP')}
                          </div>

                          {isRejected && req.rejectionReason && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                              <span className="font-bold">却下理由: </span>{req.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div>
                          {isApproved && (
                            <button
                              onClick={() => window.location.reload()}
                              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100"
                            >
                              管理画面を更新
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* In-Page Company Live Search & Claim CTA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeCompany ? '他の管理対象会社を追加・認証申請' : '自社の宅建企業を検索してオーナー認証を申請する'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    全国12万件の国土交通省宅建業者DBから自社を検索し、名刺・登記簿謄本または会社ドメインメールで認証申請を行えます。
                  </p>
                </div>
              </div>

              {/* Live search input */}
              <form onSubmit={handleCompanySearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="会社名、免許番号（例: 17890）、または13桁の法人番号を入力..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold px-4 py-2.5 rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  {isSearching ? '検索中...' : '検索'}
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 mt-4">
                  {searchResults.map((comp) => (
                    <div 
                      key={comp.id}
                      className="p-4 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-900 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {comp.companyName}
                          </span>
                          {comp.isVerified && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              認証済
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {comp.prefecture} {comp.city} ｜ 免許: {comp.licenseNumber}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCompanyForClaim(comp)}
                        className="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                      >
                        オーナー確認・申請
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: PARTNER LEAD CRM ================= */}
        {activeTab === 'partner-leads' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    <span>見込み客リード管理 (CRM)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    貴社に直接指名された案件、および同一都道府県内の公式認証パートナーとして自動配信された顧客リードです。
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  総リード数: {partnerLeads.length} 件
                </div>
              </div>
            </div>

            {partnerLeads.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
                <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  現在、新しい見込み客リードはありません
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  顧客が該当エリアの競売物件について入札代行・明渡し相談を送信すると、ここに即時通知・表示されます。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {partnerLeads.map((lead: any) => {
                  const statusInfo = LEAD_STATUSES[lead.status] || LEAD_STATUSES.NEW;
                  return (
                    <div 
                      key={lead.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {lead.customerName} 様
                          </span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {lead.contactMethod}: {lead.contactValue}
                          </span>
                        </div>

                        {/* Status Updater */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-bold">ステータス更新:</span>
                          <select
                            value={lead.status}
                            onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                            className="text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                          >
                            {Object.entries(LEAD_STATUSES).map(([k, s]) => (
                              <option key={k} value={k}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Lead Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">ご相談種別:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            {lead.inquiryType || '入札代行・価格査定'}
                          </div>
                        </div>

                        {lead.sale_unit_id && (
                          <div>
                            <div className="text-slate-400 font-medium">対象競売物件:</div>
                            <Link 
                              href={`/property/${lead.sale_unit_id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 mt-0.5"
                            >
                              <span>{lead.sale_unit_id} (物件を開く)</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {lead.message && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
                          {lead.message}
                        </div>
                      )}

                      {/* Partner Internal Notes */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          🔒 社内メモ・商談進捗（貴社のみ閲覧可能）:
                        </label>
                        <input
                          type="text"
                          defaultValue={lead.partnerNotes || ''}
                          placeholder="例: 11/11 架電済、明日14時に内見同行アポイント確定"
                          onBlur={(e) => handleLeadStatusChange(lead.id, lead.status, e.target.value)}
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: ACCOUNT SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>アカウント設定・登録情報</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">メールアドレス</label>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>{sessionUser.email}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    認証済
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">アカウント権限</label>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {sessionUser.role === 'ADMIN' ? 'システム管理者 (ADMIN)' : '一般会員 / 宅建パートナー'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  keibai-koubai.com は安全なOTPワンタイムコードおよびGoogle認証によるパスワードレスログインを採用しています。
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Claim Modal for in-page claim search */}
      {selectedCompanyForClaim && (
        <CompanyClaimModal
          company={selectedCompanyForClaim}
          isOpen={true}
          onClose={() => setSelectedCompanyForClaim(null)}
          onSuccess={() => {
            setSelectedCompanyForClaim(null);
            alert('申請を受け付けました。運営事務局にて確認後、1営業日以内に認証結果をご案内します。');
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
