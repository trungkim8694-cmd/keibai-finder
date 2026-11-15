'use client';

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PhotoIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  BriefcaseIcon,
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // License image preview modal
  const [selectedLicenseImage, setSelectedLicenseImage] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  // Reject reason modal
  const [rejectAgency, setRejectAgency] = useState<Agency | null>(null);
  const [rejectReason, setRejectReason] = useState(
    "ご提出いただいた宅建業免許等の情報に一部確認できない箇所がございました。入力内容および添付画像をご確認の上、再申請をお願いいたします。"
  );

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{
    type: "verify" | "delete";
    agency: Agency;
    nextVerified?: boolean;
    title: string;
    message: string;
  } | null>(null);

  const fetchAgencies = useCallback(
    async (searchTerm = search, status = statusFilter, targetPage = page) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        params.set("status", status);
        params.set("page", String(targetPage));
        params.set("limit", "50");
        const res = await fetch(`/api/admin/agencies?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "サポート会社一覧を取得できませんでした。");
        setAgencies(data.agencies || []);
        setTotal(data.total || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter]
  );

  useEffect(() => {
    fetchAgencies(search, statusFilter, page);
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAgencies(search, statusFilter, 1);
  };

  const executeConfirmedAction = async () => {
    if (!confirmState) return;
    const { type, agency, nextVerified } = confirmState;
    setUpdatingId(agency.id);
    setError(null);
    setSuccess(null);

    try {
      if (type === "verify" && nextVerified !== undefined) {
        const res = await fetch("/api/admin/agencies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agencyId: agency.id, isVerified: nextVerified }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "更新に失敗しました。");
        setAgencies((prev) =>
          prev.map((a) =>
            a.id === agency.id
              ? {
                  ...a,
                  isVerified: nextVerified,
                  rejectionReason: nextVerified ? null : a.rejectionReason,
                }
              : a
          )
        );
        setSuccess(
          `「${data.agency.companyName}」を${nextVerified ? "承認" : "承認解除"}しました。`
        );
      } else if (type === "delete") {
        const res = await fetch("/api/admin/agencies", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agencyId: agency.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "プロファイルの削除に失敗しました。");
        setAgencies((prev) => prev.filter((a) => a.id !== agency.id));
        setSuccess(`「${agency.companyName}」のプロファイルを削除しました。`);
      }
      setConfirmState(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
      setConfirmState(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectAgency) return;
    setUpdatingId(rejectAgency.id);
    setError(null);
    setSuccess(null);

    try {
      const trimmed = rejectReason.trim();
      const res = await fetch("/api/admin/agencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: rejectAgency.id,
          isVerified: false,
          rejectionReason: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "却下処理に失敗しました。");
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === rejectAgency.id
            ? { ...a, isVerified: false, rejectionReason: trimmed }
            : a
        )
      );
      setSuccess(`「${rejectAgency.companyName}」の申請を却下しました。`);
      setRejectAgency(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BriefcaseIcon className="w-6 h-6 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span>パートナー事務所（サポート会社）管理</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            登録された不動産仲介（サポート）会社の免許確認、承認、却下、および削除を行います。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:max-w-xl justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-[44px] w-full sm:w-40 px-3 py-2 bg-white dark:bg-[#151B22] border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          >
            <option value="all">すべて表示</option>
            <option value="verified">承認済みのみ</option>
            <option value="unverified">未承認のみ</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="会社名・免許番号・メール..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white dark:bg-[#151B22] border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 bg-[#1B4F8A] hover:bg-[#163F6F] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
            >
              検索
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-medium">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="w-6 h-6 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">サポート会社一覧を読み込み中...</p>
        </div>
      ) : agencies.length === 0 ? (
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl text-center py-16 text-slate-400">
          <BriefcaseIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">登録されているサポート会社が見つかりません</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {agencies.map((agency) => (
              <div
                key={agency.id}
                className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {agency.companyName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      免許: {agency.licenseNumber}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                      agency.isVerified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {agency.isVerified ? "承認済み" : "未承認"}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{agency.phone}</span>
                  </div>
                  {agency.email && (
                    <div className="flex items-center gap-1.5 font-mono break-all">
                      <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{agency.email}</span>
                    </div>
                  )}
                  {agency.website && (
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[#1B4F8A] dark:text-blue-400 hover:underline break-all"
                    >
                      <GlobeAltIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{agency.website}</span>
                    </a>
                  )}
                </div>

                {agency.licenseImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLicenseImage(agency.licenseImageUrl);
                      setSelectedCompanyName(agency.companyName);
                    }}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 inline-flex items-center justify-center gap-1.5"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span>免許証画像を確認</span>
                  </button>
                )}

                {agency.rejectionReason && !agency.isVerified && (
                  <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                    却下理由: {agency.rejectionReason}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={updatingId === agency.id}
                    onClick={() =>
                      setConfirmState({
                        type: "verify",
                        agency,
                        nextVerified: !agency.isVerified,
                        title: agency.isVerified ? "承認解除" : "パートナー承認",
                        message: `「${agency.companyName}」を${
                          agency.isVerified ? "承認解除" : "承認"
                        }しますか？`,
                      })
                    }
                    className={`min-h-[44px] px-2 text-xs font-bold rounded-lg ${
                      agency.isVerified
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {agency.isVerified ? "解除" : "承認"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === agency.id}
                    onClick={() => setRejectAgency(agency)}
                    className="min-h-[44px] px-2 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                  >
                    却下
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === agency.id}
                    onClick={() =>
                      setConfirmState({
                        type: "delete",
                        agency,
                        title: "プロファイル削除",
                        message: `「${agency.companyName}」のサポート会社プロファイルを削除しますか？`,
                      })
                    }
                    className="min-h-[44px] px-2 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                    <th className="px-5 py-3.5">会社名・免許番号</th>
                    <th className="px-5 py-3.5">連絡先</th>
                    <th className="px-5 py-3.5">対応エリア</th>
                    <th className="px-5 py-3.5">免許証</th>
                    <th className="px-5 py-3.5">ステータス</th>
                    <th className="px-5 py-3.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agencies.map((agency) => (
                    <tr
                      key={agency.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {agency.companyName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {agency.licenseNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          担当: {agency.user?.name || agency.user?.email || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div>TEL: {agency.phone}</div>
                        {agency.email && <div>Mail: {agency.email}</div>}
                      </td>

                      <td className="px-5 py-3.5 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {(agency.prefectures || []).slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]"
                            >
                              {p}
                            </span>
                          ))}
                          {(agency.prefectures || []).length > 4 && (
                            <span className="text-[10px] text-slate-400">
                              +{agency.prefectures.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {agency.licenseImageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLicenseImage(agency.licenseImageUrl);
                              setSelectedCompanyName(agency.companyName);
                            }}
                            className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            <span>確認</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">未添付</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            agency.isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {agency.isVerified ? "承認済み" : "未承認"}
                        </span>
                        {agency.rejectionReason && !agency.isVerified && (
                          <div
                            className="text-[10px] text-red-600 dark:text-red-400 mt-1 max-w-[180px] truncate"
                            title={agency.rejectionReason}
                          >
                            {agency.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === agency.id}
                            onClick={() =>
                              setConfirmState({
                                type: "verify",
                                agency,
                                nextVerified: !agency.isVerified,
                                title: agency.isVerified ? "承認解除" : "パートナー承認",
                                message: `「${agency.companyName}」を${
                                  agency.isVerified ? "承認解除" : "承認"
                                }しますか？`,
                              })
                            }
                            title={agency.isVerified ? "承認解除" : "承認する"}
                            className={`p-2 rounded-lg border cursor-pointer ${
                              agency.isVerified
                                ? "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            }`}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === agency.id}
                            onClick={() => setRejectAgency(agency)}
                            title="却下する"
                            className="p-2 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === agency.id}
                            onClick={() =>
                              setConfirmState({
                                type: "delete",
                                agency,
                                title: "プロファイル削除",
                                message: `「${agency.companyName}」のサポート会社プロファイルを削除しますか？`,
                              })
                            }
                            title="削除する"
                            className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span className="tabular-nums">
            ページ {page} / {totalPages} （全 {total.toLocaleString()} 件）
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              前へ
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* License Image Modal */}
      {selectedLicenseImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-2xl w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {selectedCompanyName} - 宅建業免許証
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLicenseImage(null)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-100 dark:bg-[#0D1117] rounded-lg p-3 flex items-center justify-center">
              <img
                src={selectedLicenseImage}
                alt="宅建業免許証"
                className="max-w-full max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLicenseImage(null)}
                className="min-h-[40px] px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="font-bold text-sm text-red-600 dark:text-red-400">
              申請却下: {rejectAgency.companyName}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectAgency(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={updatingId === rejectAgency.id}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                却下を確定する
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {confirmState.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={updatingId !== null}
                className={`min-h-[40px] px-4 py-1.5 text-xs font-bold text-white rounded-lg ${
                  confirmState.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1B4F8A] hover:bg-[#163F6F]"
                }`}
              >
                {updatingId ? "処理中..." : "確定する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
