'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  InboxArrowDownIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const LEAD_STATUSES: Record<string, { label: string; badgeClass: string }> = {
  NEW: {
    label: '新規リード',
    badgeClass:
      'text-[#1B4F8A] bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800',
  },
  DISPATCHED: {
    label: '配信済',
    badgeClass:
      'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/40 dark:border-sky-800',
  },
  CONTACTED: {
    label: '連絡済',
    badgeClass:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
  },
  IN_CONSULTATION: {
    label: '商談中',
    badgeClass:
      'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/40 dark:border-purple-800',
  },
  WON: {
    label: '成約・受任',
    badgeClass:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
  },
  CLOSED: {
    label: '対応終了',
    badgeClass:
      'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
  },
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notes Modal
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchLeads = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (search) params.set('q', search);
        params.set('page', String(targetPage));
        params.set('limit', '50');
        const res = await fetch(`/api/admin/leads?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ type: 'error', text: data.error || '取得に失敗しました' });
          return;
        }
        setLeads(data.leads || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: '通信エラーが発生しました' });
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, search]
  );

  useEffect(() => {
    fetchLeads(page);
  }, [page, statusFilter]);

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      } else {
        setFeedback({ type: 'error', text: data.error || '更新に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: '通信エラーが発生しました' });
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSavingNotes(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: editingLead.id, partnerNotes: notesInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === editingLead.id ? { ...l, partnerNotes: notesInput.trim() } : l
          )
        );
        setFeedback({ type: 'success', text: '社内メモを保存しました。' });
        setEditingLead(null);
      } else {
        setFeedback({ type: 'error', text: data.error || '保存に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setSavingNotes(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <InboxArrowDownIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>顧客相談リード・配信管理</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          入札代行・価格査定相談のリード状況、自動配信先企業、および商談進捗ステータスを監視します。
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-[#151B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchLeads(1);
          }}
          className="flex items-center gap-2 w-full lg:max-w-md"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客名、連絡先、メッセージ..."
              className="w-full min-h-[44px] text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 bg-[#1B4F8A] hover:bg-[#163F6F] text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
          >
            検索
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <FunnelIcon className="w-3.5 h-3.5" /> 状態:
          </span>
          {['ALL', 'NEW', 'DISPATCHED', 'CONTACTED', 'IN_CONSULTATION', 'WON', 'CLOSED'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1B4F8A] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'ALL' ? 'すべて' : LEAD_STATUSES[st]?.label || st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
          データを読み込み中...
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
          リード情報はありません
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {leads.map((lead) => {
              const statusInfo = LEAD_STATUSES[lead.status] || LEAD_STATUSES.NEW;
              return (
                <div
                  key={lead.id}
                  className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {lead.customerName} 様
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                        {lead.contactMethod}: {lead.contactValue}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {lead.inquiryType || '入札相談'}
                    </span>
                    {lead.sale_unit_id ? (
                      <Link
                        href={`/property/${lead.sale_unit_id}`}
                        className="text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-mono font-semibold"
                      >
                        <span>物件: {lead.sale_unit_id}</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-slate-400">総合相談</span>
                    )}
                  </div>

                  {lead.message && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg whitespace-pre-wrap">
                      {lead.message}
                    </div>
                  )}

                  {lead.partnerNotes && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2 rounded-lg">
                      社内メモ: {lead.partnerNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className="flex-1 min-h-[44px] text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200"
                    >
                      {Object.entries(LEAD_STATUSES).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLead(lead);
                        setNotesInput(lead.partnerNotes || '');
                      }}
                      className="min-h-[44px] px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg inline-flex items-center gap-1 shrink-0"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      <span>メモ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">顧客名・連絡先</th>
                    <th className="py-3 px-4">ご相談種別</th>
                    <th className="py-3 px-4">対象物件</th>
                    <th className="py-3 px-4">メッセージ & 社内メモ</th>
                    <th className="py-3 px-4">登録日時</th>
                    <th className="py-3 px-4">進捗ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3.5 px-4 font-bold">
                        <div className="text-slate-900 dark:text-slate-100">
                          {lead.customerName} 様
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {lead.contactMethod}: {lead.contactValue}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {lead.inquiryType || '入札相談'}
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.sale_unit_id ? (
                          <Link
                            href={`/property/${lead.sale_unit_id}`}
                            className="text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-mono font-bold"
                          >
                            <span>{lead.sale_unit_id}</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-400">総合相談</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-3 whitespace-pre-wrap">
                          {lead.message || '-'}
                        </div>
                        {lead.partnerNotes && (
                          <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-1.5 rounded mt-1.5 font-medium">
                            社内メモ: {lead.partnerNotes}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLead(lead);
                            setNotesInput(lead.partnerNotes || '');
                          }}
                          className="mt-1.5 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>{lead.partnerNotes ? 'メモを編集' : 'メモを追加'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap font-mono tabular-nums">
                        {new Date(lead.created_at).toLocaleDateString('ja-JP')}
                        <br />
                        {new Date(lead.created_at).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
                        >
                          {Object.entries(LEAD_STATUSES).map(([key, info]) => (
                            <option key={key} value={key}>
                              {info.label}
                            </option>
                          ))}
                        </select>
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

      {/* Partner Notes Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <form
            onSubmit={handleSaveNotes}
            className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              社内メモ編集: {editingLead.customerName} 様
            </h3>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={4}
              placeholder="対応履歴や配信先への引き継ぎメモを入力..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={savingNotes}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-[#1B4F8A] hover:bg-[#163F6F] text-white rounded-lg"
              >
                {savingNotes ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
