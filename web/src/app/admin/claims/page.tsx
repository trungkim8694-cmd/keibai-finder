'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'delists'>('claims');
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>('PENDING');
  const [claims, setClaims] = useState<any[]>([]);
  const [delists, setDelists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  // Reject Modal State
  const [rejectModalClaimId, setRejectModalClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('提出された書類（名刺・登記簿謄本）の画質が不鮮明、または記載事項と公的登録情報が一致しませんでした。');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/claims/list');
      const data = await res.json();
      setClaims(data.claims || []);
      setDelists(data.delists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveClaim = async (claimId: string) => {
    if (!confirm('この認証申請を承認しますか？\n該当企業に「公式認証済（青バッジ）」が付与され、申請者アカウントに管理権限が連携されます。')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_claim', claimId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('承認を完了しました。');
        await loadData();
      } else {
        alert(data.error || '承認に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!rejectModalClaimId) return;
    setActionLoading(true);
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
      if (data.success) {
        alert('申請を却下しました。');
        setRejectModalClaimId(null);
        await loadData();
      } else {
        alert(data.error || '却下に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelistAction = async (delistId: string, action: 'approve_delist' | 'reject_delist') => {
    const isApprove = action === 'approve_delist';
    if (!confirm(isApprove ? 'この企業の掲載を削除（非表示）にしますか？' : 'この削除申請を却下しますか？')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, delistId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(isApprove ? '企業の掲載を削除しました。' : '削除申請を却下しました。');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClaims = claimStatusFilter === 'ALL'
    ? claims
    : claims.filter((c) => c.status === claimStatusFilter);

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheckIcon className="w-7 h-7 text-amber-500" />
            <span>オーナー認証 & 削除審査センター</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            宅建業者からの謄本・名刺アップロードによる認証申請、および掲載削除依頼を審査します。
          </p>
        </div>

        <button
          onClick={loadData}
          className="text-xs font-bold px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg self-start sm:self-auto cursor-pointer"
        >
          🔄 データ再読込
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>🏢 オーナー認証申請</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-black">
            {claims.filter((c) => c.status === 'PENDING').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('delists')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'delists'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>🚫 掲載削除・非表示申請</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 font-black">
            {delists.filter((d) => d.status === 'PENDING').length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: CLAIMS LIST ================= */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <FunnelIcon className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-500">状態フィルター:</span>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setClaimStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  claimStatusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {st === 'PENDING' ? '未審査' : st === 'APPROVED' ? '承認済' : st === 'REJECTED' ? '却下' : 'すべて'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">データを読み込み中...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              該当する申請データはありません
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">申請企業・免許</th>
                      <th className="py-3 px-4">申請者情報</th>
                      <th className="py-3 px-4">認証方法・書類</th>
                      <th className="py-3 px-4">申請日時</th>
                      <th className="py-3 px-4">ステータス</th>
                      <th className="py-3 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {claim.company?.companyName || '企業ID: ' + claim.companyId}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {claim.company?.prefecture} {claim.company?.city} ｜ 免許: {claim.company?.licenseNumber}
                          </div>
                          {claim.company?.houjinNumber && (
                            <a
                              href={`https://kigyoulist.com/company/${claim.company.houjinNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-mono"
                            >
                              <span>kigyoulistで確認 ↗</span>
                            </a>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            {claim.applicantName} ({claim.position || '役職未記入'})
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {claim.applicantEmail}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {claim.applicantPhone}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {claim.verificationMethod === 'DOCUMENT' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                📄 書類審査 ({claim.documentType || '名刺・謄本'})
                              </span>
                              {claim.documentUrl && (
                                <div>
                                  <button
                                    onClick={() => {
                                      setPreviewDocUrl(claim.documentUrl);
                                      setPreviewDocTitle(`${claim.company?.companyName} - 提出書類`);
                                    }}
                                    className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    <span>書類を確認</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              ✉️ 会社ドメインメール
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-500 text-[11px] whitespace-nowrap">
                          {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                          <br />
                          {new Date(claim.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            claim.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {claim.status === 'PENDING' ? '未審査' : claim.status === 'APPROVED' ? '承認済' : '却下'}
                          </span>
                          {claim.rejectionReason && (
                            <div className="text-[10px] text-red-600 mt-1 max-w-xs truncate" title={claim.rejectionReason}>
                              理由: {claim.rejectionReason}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {claim.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveClaim(claim.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition-colors cursor-pointer"
                              >
                                承認
                              </button>
                              <button
                                onClick={() => setRejectModalClaimId(claim.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors cursor-pointer"
                              >
                                却下
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-400">対応済</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: DELISTS LIST ================= */}
      {activeTab === 'delists' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
          {delists.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">削除申請はありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">対象企業</th>
                    <th className="py-3 px-4">申請理由</th>
                    <th className="py-3 px-4">連絡先</th>
                    <th className="py-3 px-4">詳細</th>
                    <th className="py-3 px-4">状態</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {delists.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-4 font-bold">
                        {d.company?.companyName || d.companyId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-700 dark:text-zinc-300">
                        {d.reason}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {d.contactEmail} {d.contactPhone ? `(${d.contactPhone})` : ''}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">
                        {d.details || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          d.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {d.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDelistAction(d.id, 'approve_delist')}
                              className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer"
                            >
                              掲載削除
                            </button>
                            <button
                              onClick={() => handleDelistAction(d.id, 'reject_delist')}
                              className="px-2.5 py-1 text-xs font-bold bg-zinc-200 text-zinc-700 rounded-md cursor-pointer"
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
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <span>{previewDocTitle}</span>
              </h3>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-[600px] rounded-lg" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="書類画像"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800"
                />
              )}
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <a
                href={previewDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                <span>元のファイルを別タブで開く</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-bold"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5" />
              <span>申請の却下理由を入力</span>
            </h3>
            <p className="text-xs text-zinc-500">
              この理由は申請者のマイページに表示され、再提出時のガイドとなります。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full text-xs p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalClaimId(null)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleRejectClaim}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                却下を確定する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
