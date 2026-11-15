'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  NoSymbolIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'delists'>('claims');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('PENDING');
  const [claims, setClaims] = useState<any[]>([]);
  const [delists, setDelists] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalClaims, setTotalClaims] = useState(0);
  const [totalDelists, setTotalDelists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Document Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  // Reject Modal State
  const [rejectModalClaimId, setRejectModalClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>(
    '提出された書類（名刺・登記簿謄本）の画質が不鮮明、または記載事項と公的登録情報が一致しませんでした。'
  );

  // Confirm Action Modal State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve_claim' | 'approve_delist' | 'reject_delist';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/claims/list?page=${targetPage}&limit=50`);
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'データの取得に失敗しました' });
        return;
      }
      setClaims(data.claims || []);
      setDelists(data.delists || []);
      setTotalClaims(data.totalClaims || 0);
      setTotalDelists(data.totalDelists || 0);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const payload =
        confirmAction.type === 'approve_claim'
          ? { action: 'approve_claim', claimId: confirmAction.id }
          : { action: confirmAction.type, delistId: confirmAction.id };

      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg =
          confirmAction.type === 'approve_claim'
            ? '認証申請を承認しました。'
            : confirmAction.type === 'approve_delist'
            ? '企業の掲載を削除（非表示）にしました。'
            : '削除申請を却下しました。';
        setFeedback({ type: 'success', text: msg });
        setConfirmAction(null);
        await loadData(page);
      } else {
        setFeedback({ type: 'error', text: data.error || '処理に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!rejectModalClaimId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_claim',
          claimId: rejectModalClaimId,
          reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: '申請を却下しました。' });
        setRejectModalClaimId(null);
        await loadData(page);
      } else {
        setFeedback({ type: 'error', text: data.error || '却下に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClaims =
    claimStatusFilter === 'ALL'
      ? claims
      : claims.filter((c) => c.status === claimStatusFilter);

  const totalForTab = activeTab === 'claims' ? totalClaims : totalDelists;
  const totalPages = Math.max(1, Math.ceil(totalForTab / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-amber-500 shrink-0" />
            <span>オーナー認証 & 削除審査センター</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            宅建業者からの謄本・名刺アップロードによる認証申請、および掲載削除依頼を審査します。
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(page)}
          className="min-h-[44px] text-xs font-semibold px-3.5 py-2 bg-white dark:bg-[#151B22] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg self-start sm:self-auto inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>データ再読込</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="px-2 py-1 text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('claims');
            setPage(1);
          }}
          className={`min-h-[44px] px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'claims'
              ? 'border-[#1B4F8A] text-[#1B4F8A] dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BuildingOffice2Icon className="w-4 h-4" />
          <span>オーナー認証申請</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold tabular-nums">
            {claims.filter((c) => c.status === 'PENDING').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('delists');
            setPage(1);
          }}
          className={`min-h-[44px] px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'delists'
              ? 'border-[#1B4F8A] text-[#1B4F8A] dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <NoSymbolIcon className="w-4 h-4" />
          <span>掲載削除・非表示申請</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold tabular-nums">
            {delists.filter((d) => d.status === 'PENDING').length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: CLAIMS LIST ================= */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#151B22] p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
              <FunnelIcon className="w-4 h-4" />
              <span>状態:</span>
            </div>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setClaimStatusFilter(st)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  claimStatusFilter === st
                    ? 'bg-[#1B4F8A] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'PENDING'
                  ? '未審査'
                  : st === 'APPROVED'
                  ? '承認済'
                  : st === 'REJECTED'
                  ? '却下'
                  : 'すべて'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              データを読み込み中...
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              該当する申請データはありません
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {claim.company?.companyName || '企業ID: ' + claim.companyId}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {claim.company?.prefecture} {claim.company?.city} ｜ 免許:{' '}
                          {claim.company?.licenseNumber}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                          claim.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : claim.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {claim.status === 'PENDING'
                          ? '未審査'
                          : claim.status === 'APPROVED'
                          ? '承認済'
                          : '却下'}
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {claim.applicantName} ({claim.position || '役職未記入'})
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono break-all">
                        {claim.applicantEmail}
                      </div>
                      {claim.applicantPhone && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {claim.applicantPhone}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      {claim.verificationMethod === 'DOCUMENT' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                            <DocumentTextIcon className="w-3.5 h-3.5" />
                            <span>{claim.documentType || '名刺・謄本'}</span>
                          </span>
                          {claim.documentUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDocUrl(claim.documentUrl);
                                setPreviewDocTitle(
                                  `${claim.company?.companyName} - 提出書類`
                                );
                              }}
                              className="min-h-[36px] px-2.5 text-xs text-[#1B4F8A] dark:text-blue-400 font-semibold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              <span>書類確認</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                          <EnvelopeIcon className="w-3.5 h-3.5" />
                          <span>会社ドメインメール</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    {claim.rejectionReason && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                        却下理由: {claim.rejectionReason}
                      </div>
                    )}

                    {claim.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'approve_claim',
                              id: claim.id,
                              title: 'オーナー認証申請を承認',
                              message:
                                '該当企業に「公式認証済」を付与し、申請者アカウントへ管理権限を連携しますか？',
                            })
                          }
                          disabled={actionLoading}
                          className="min-h-[44px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                          承認する
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectModalClaimId(claim.id)}
                          disabled={actionLoading}
                          className="min-h-[44px] text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 rounded-lg transition-colors"
                        >
                          却下する
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">申請企業・免許</th>
                        <th className="py-3 px-4">申請者情報</th>
                        <th className="py-3 px-4">認証方法・書類</th>
                        <th className="py-3 px-4">申請日時</th>
                        <th className="py-3 px-4">ステータス</th>
                        <th className="py-3 px-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredClaims.map((claim) => (
                        <tr
                          key={claim.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-3.5 px-4 font-medium">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {claim.company?.companyName ||
                                '企業ID: ' + claim.companyId}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {claim.company?.prefecture} {claim.company?.city} ｜
                              免許: {claim.company?.licenseNumber}
                            </div>
                            {claim.company?.houjinNumber && (
                              <a
                                href={`https://kigyoulist.com/company/${claim.company.houjinNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                              >
                                <span>kigyoulistで確認</span>
                                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                              </a>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {claim.applicantName} ({claim.position || '役職未記入'})
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {claim.applicantEmail}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {claim.applicantPhone}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {claim.verificationMethod === 'DOCUMENT' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                  <DocumentTextIcon className="w-3 h-3" />
                                  <span>
                                    書類審査 ({claim.documentType || '名刺・謄本'})
                                  </span>
                                </span>
                                {claim.documentUrl && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewDocUrl(claim.documentUrl);
                                        setPreviewDocTitle(
                                          `${claim.company?.companyName} - 提出書類`
                                        );
                                      }}
                                      className="text-xs text-[#1B4F8A] dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <EyeIcon className="w-3.5 h-3.5" />
                                      <span>書類を確認</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                <EnvelopeIcon className="w-3 h-3" />
                                <span>会社ドメインメール</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap tabular-nums">
                            {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                            <br />
                            {new Date(claim.created_at).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                claim.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : claim.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              }`}
                            >
                              {claim.status === 'PENDING'
                                ? '未審査'
                                : claim.status === 'APPROVED'
                                ? '承認済'
                                : '却下'}
                            </span>
                            {claim.rejectionReason && (
                              <div
                                className="text-[10px] text-red-600 dark:text-red-400 mt-1 max-w-xs truncate"
                                title={claim.rejectionReason}
                              >
                                理由: {claim.rejectionReason}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {claim.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'approve_claim',
                                      id: claim.id,
                                      title: 'オーナー認証申請を承認',
                                      message:
                                        '該当企業に「公式認証済」を付与し、申請者アカウントへ管理権限を連携しますか？',
                                    })
                                  }
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  承認
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectModalClaimId(claim.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 rounded-lg transition-colors cursor-pointer"
                                >
                                  却下
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">対応済</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: DELISTS LIST ================= */}
      {activeTab === 'delists' && (
        <>
          {delists.length === 0 ? (
            <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
              削除申請はありません
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {delists.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {d.company?.companyName || d.companyId}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          d.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      理由: {d.reason}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 break-all">
                      {d.contactEmail} {d.contactPhone ? `(${d.contactPhone})` : ''}
                    </div>
                    {d.details && (
                      <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
                        {d.details}
                      </div>
                    )}
                    {d.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'approve_delist',
                              id: d.id,
                              title: '掲載削除を承認',
                              message: 'この企業の掲載を非表示(DELISTED)にしますか？',
                            })
                          }
                          className="min-h-[44px] text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                          掲載削除
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'reject_delist',
                              id: d.id,
                              title: '削除申請を却下',
                              message: 'この削除申請を却下しますか？',
                            })
                          }
                          className="min-h-[44px] text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg"
                        >
                          却下
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">対象企業</th>
                        <th className="py-3 px-4">申請理由</th>
                        <th className="py-3 px-4">連絡先</th>
                        <th className="py-3 px-4">詳細</th>
                        <th className="py-3 px-4">状態</th>
                        <th className="py-3 px-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {delists.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-bold">
                            {d.company?.companyName || d.companyId}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {d.reason}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {d.contactEmail} {d.contactPhone ? `(${d.contactPhone})` : ''}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {d.details || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                d.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {d.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'approve_delist',
                                      id: d.id,
                                      title: '掲載削除を承認',
                                      message: 'この企業の掲載を非表示(DELISTED)にしますか？',
                                    })
                                  }
                                  className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
                                >
                                  掲載削除
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      type: 'reject_delist',
                                      id: d.id,
                                      title: '削除申請を却下',
                                      message: 'この削除申請を却下しますか？',
                                    })
                                  }
                                  className="px-3 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                                >
                                  却下
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span className="tabular-nums">
            ページ {page} / {totalPages}
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

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <DocumentTextIcon className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span className="truncate">{previewDocTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                aria-label="閉じる"
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 sm:p-4 bg-slate-100 dark:bg-[#0D1117] flex items-center justify-center">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewDocUrl}
                  title={previewDocTitle}
                  className="w-full h-[65vh] sm:h-[70vh] rounded-lg"
                />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="書類画像"
                  className="max-w-full max-h-[68vh] object-contain rounded-lg border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
              <a
                href={previewDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>別タブで開く</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="min-h-[40px] px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {confirmAction.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmAction.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="min-h-[40px] px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={actionLoading}
                className={`min-h-[40px] px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors ${
                  confirmAction.type === 'approve_claim'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? '処理中...' : '確定する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5" />
              <span>申請の却下理由を入力</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              この理由は申請者のマイページに表示され、再提出時のガイドとなります。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalClaimId(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRejectClaim}
                disabled={actionLoading}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                {actionLoading ? '処理中...' : '却下を確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
