'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  InboxArrowDownIcon, 
  MagnifyingGlassIcon, 
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  FunnelIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const LEAD_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: '新規リード', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  DISPATCHED: { label: '配信済', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  CONTACTED: { label: '連絡済', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  IN_CONSULTATION: { label: '商談中', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  WON: { label: '成約・受任', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CLOSED: { label: '対応終了', color: 'text-zinc-600', bg: 'bg-zinc-100 border-zinc-200' },
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('q', search);
      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <InboxArrowDownIcon className="w-7 h-7 text-emerald-600" />
          <span>顧客相談リード・配信管理</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          入札代行・価格査定相談のリード状況、自動配信先企業、および商談進捗ステータスを監視します。
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLeads();
          }}
          className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客名、連絡先、メッセージ..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            検索
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
            <FunnelIcon className="w-3.5 h-3.5" /> 状態:
          </span>
          {['ALL', 'NEW', 'DISPATCHED', 'CONTACTED', 'IN_CONSULTATION', 'WON', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {st === 'ALL' ? 'すべて' : LEAD_STATUSES[st]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">データを読み込み中...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">リード情報はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">顧客名・連絡先</th>
                  <th className="py-3 px-4">ご相談種別</th>
                  <th className="py-3 px-4">対象物件</th>
                  <th className="py-3 px-4">メッセージ & 配信先</th>
                  <th className="py-3 px-4">登録日時</th>
                  <th className="py-3 px-4">進捗ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {leads.map((lead) => {
                  const statusInfo = LEAD_STATUSES[lead.status] || LEAD_STATUSES.NEW;
                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/50">
                      <td className="py-3.5 px-4 font-bold">
                        <div className="text-zinc-900 dark:text-zinc-100">{lead.customerName} 様</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {lead.contactMethod}: {lead.contactValue}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {lead.inquiryType || '入札相談'}
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.sale_unit_id ? (
                          <Link
                            href={`/property/${lead.sale_unit_id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1 font-mono font-bold"
                          >
                            <span>{lead.sale_unit_id}</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-zinc-400">総合相談</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-zinc-600 dark:text-zinc-300 text-[11px] line-clamp-3 whitespace-pre-wrap">
                          {lead.message || '-'}
                        </div>
                        {lead.partnerNotes && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1 font-medium">
                            📝 社内メモ: {lead.partnerNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 text-[11px] whitespace-nowrap font-mono">
                        {new Date(lead.created_at).toLocaleDateString('ja-JP')}
                        <br />
                        {new Date(lead.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none"
                        >
                          {Object.entries(LEAD_STATUSES).map(([k, s]) => (
                            <option key={k} value={k}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
