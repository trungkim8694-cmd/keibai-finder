'use client';

import { useState, useEffect } from "react";
import { 
  MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon, 
  TrashIcon, 
  PhotoIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";

interface Agency {
  id: string;
  userId: string;
  companyName: string;
  licenseNumber: string;
  phone: string;
  fax: string | null;
  email: string | null;
  website: string | null;
  prefectures: string[];
  description: string | null;
  logoUrl: string | null;
  licenseImageUrl: string | null;
  isVerified: boolean;
  rejectionReason: string | null;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  _count: {
    reviews: number;
    reports: number;
  };
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal for license image viewing
  const [selectedLicenseImage, setSelectedLicenseImage] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  const fetchAgencies = async (searchTerm = "", status = "all") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agencies?search=${encodeURIComponent(searchTerm)}&status=${status}`);
      if (!res.ok) throw new Error("サポート会社一覧を取得できませんでした。");
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies(search, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAgencies(search, statusFilter);
  };

  const handleToggleVerify = async (agencyId: string, currentVerified: boolean) => {
    const nextVerified = !currentVerified;
    const actionText = nextVerified ? "承認" : "承認解除";
    
    if (!confirm(`このサポート会社を${actionText}しますか？`)) {
      return;
    }

    setUpdatingId(agencyId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, isVerified: nextVerified })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新に失敗しました。");
      }

      setAgencies(agencies.map(a => a.id === agencyId ? { ...a, isVerified: nextVerified, rejectionReason: nextVerified ? null : a.rejectionReason } : a));
      setSuccess(`「${data.agency.companyName}」を正常に${actionText}しました。`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectAgency = async (agencyId: string, companyName: string) => {
    const defaultReason = "ご提出いただいた宅建業免許等の情報に一部確認できない箇所がございました。恐れ入りますが、入力内容および添付の免許証画像が明瞭であるかご確認の上、再度ご申請をお願いいたします。";
    const reason = window.prompt(`「${companyName}」の申請を却下する理由を入力してください（仲介会社に表示されます）:`, defaultReason);
    
    if (reason === null) return;
    const trimmedReason = reason.trim() || defaultReason;

    setUpdatingId(agencyId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, isVerified: false, rejectionReason: trimmedReason })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "却下処理に失敗しました。");
      }

      setAgencies(agencies.map(a => a.id === agencyId ? { ...a, isVerified: false, rejectionReason: trimmedReason } : a));
      setSuccess(`「${companyName}」の申請を却下しました。`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAgency = async (agencyId: string, companyName: string) => {
    if (!confirm(`「${companyName}」のサポート会社プロファイルを削除しますか？\n（ユーザーのアカウント自体は削除されず、一般ユーザー権限に戻ります。この操作は取り消せません）`)) {
      return;
    }

    setDeletingId(agencyId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/agencies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "プロファイルの削除に失敗しました。");
      }

      setAgencies(agencies.filter(a => a.id !== agencyId));
      setSuccess(`「${companyName}」のプロファイルを削除し、一般ユーザー権限へ変更しました。`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">競売サポート会社管理</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            登録された不動産仲介（サポート）会社の免許確認、承認、および削除を行います。
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:max-w-2xl justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold transition-all"
          >
            <option value="all">すべて表示</option>
            <option value="verified">承認済みのみ</option>
            <option value="unverified">未承認のみ</option>
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="会社名、免許番号、電話番号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shrink-0"
            >
              検索
            </button>
          </form>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></span>
              <p className="text-sm">サポート会社データを読み込み中...</p>
            </div>
          ) : agencies.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-4">🏢</p>
              <p className="font-semibold">サポート会社が見つかりません</p>
              <p className="text-xs opacity-75 mt-1">他の条件で検索をお試しください。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th scope="col" className="px-6 py-4 font-bold">会社情報</th>
                  <th scope="col" className="px-6 py-4 font-bold">免許・申請者</th>
                  <th scope="col" className="px-6 py-4 font-bold">連絡先情報</th>
                  <th scope="col" className="px-6 py-4 font-bold">対応エリア</th>
                  <th scope="col" className="px-6 py-4 font-bold">ステータス</th>
                  <th scope="col" className="px-6 py-4 font-bold text-right">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    
                    {/* Company info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          {agency.logoUrl ? (
                            <img src={agency.logoUrl} alt={agency.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">🏢</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white leading-snug">
                            {agency.companyName}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            登録日: {new Date(agency.created_at).toLocaleDateString("ja-JP")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* License & Submitter */}
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {agency.licenseNumber}
                        </span>
                        {agency.licenseImageUrl ? (
                          <button
                            onClick={() => {
                              setSelectedLicenseImage(agency.licenseImageUrl);
                              setSelectedCompanyName(agency.companyName);
                            }}
                            className="text-blue-600 hover:text-blue-500 font-bold text-xs inline-flex items-center gap-0.5 transition-colors"
                            title="宅建免許証の画像を表示"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            画像確認
                          </button>
                        ) : (
                          <span className="text-zinc-400 text-xs font-bold flex items-center gap-0.5">
                            画像なし
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        申請者: {agency.user.name || "名称未設定"} ({agency.user.email})
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                        <PhoneIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{agency.phone}</span>
                      </div>
                      {agency.fax && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-750 dark:text-zinc-250 font-semibold">
                          <PrinterIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{agency.fax}</span>
                        </div>
                      )}
                      {agency.email && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate max-w-[150px]" title={agency.email}>{agency.email}</span>
                        </div>
                      )}
                      {agency.website && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                          <GlobeAltIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]" title={agency.website}>
                            {agency.website}
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Prefectures */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          {agency.prefectures.length} 都道府県
                        </span>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[150px] truncate" title={agency.prefectures.join(", ")}>
                          {agency.prefectures.join(", ")}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {agency.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          承認済み
                        </span>
                      ) : agency.rejectionReason ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450" title={agency.rejectionReason}>
                          却下済み
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                          未承認 (審査中)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Verify/Unverify Button */}
                        <button
                          onClick={() => handleToggleVerify(agency.id, agency.isVerified)}
                          disabled={updatingId === agency.id}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            agency.isVerified
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/20"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                          } disabled:opacity-50`}
                        >
                          {updatingId === agency.id ? (
                            "処理中..."
                          ) : agency.isVerified ? (
                            <>
                              <XMarkIcon className="w-3.5 h-3.5" />
                              承認解除
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-3.5 h-3.5" />
                              承認する
                            </>
                          )}
                        </button>

                        {/* Reject Button */}
                        {!agency.isVerified && (
                          <button
                            onClick={() => handleRejectAgency(agency.id, agency.companyName)}
                            disabled={updatingId === agency.id}
                            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                            {agency.rejectionReason ? "理由を修正" : "却下する"}
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAgency(agency.id, agency.companyName)}
                          disabled={deletingId === agency.id}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-950/20 transition-all disabled:opacity-50"
                          title="サポート会社登録を削除"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          削除
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* License View Modal */}
      {selectedLicenseImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            setSelectedLicenseImage(null);
            setSelectedCompanyName(null);
          }}
        >
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-950 dark:text-zinc-50">
                  宅地建物取引業者免許証の確認
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedCompanyName}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedLicenseImage(null);
                  setSelectedCompanyName(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors text-zinc-500 dark:text-zinc-400"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="flex-1 p-6 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto flex justify-center items-center">
              <img 
                src={selectedLicenseImage} 
                alt="License Copy" 
                className="max-w-full max-h-[60vh] object-contain rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button 
                onClick={() => {
                  setSelectedLicenseImage(null);
                  setSelectedCompanyName(null);
                }}
                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
