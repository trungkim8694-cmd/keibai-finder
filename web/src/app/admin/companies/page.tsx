'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const AVAILABLE_SPECIALTIES = [
  '競売入札代行',
  '明渡し交渉',
  '任意売却',
  '物件調査',
  'リフォーム',
  '賃貸管理',
  '収益物件仲介',
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (verifiedFilter) params.set('verified', 'true');
        params.set('page', String(targetPage));
        params.set('limit', '50');
        const res = await fetch(`/api/admin/companies?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setFeedback({ type: 'error', text: data.error || '取得に失敗しました' });
          return;
        }
        setCompanies(data.companies || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: '通信エラーが発生しました' });
      } finally {
        setLoading(false);
      }
    },
    [page, search, verifiedFilter]
  );

  useEffect(() => {
    fetchCompanies(page);
  }, [page, verifiedFilter]);

  const handleToggleVerify = async (companyId: string, current: boolean) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_verify',
          companyId,
          isVerified: !current,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, isVerified: !current } : c))
        );
      } else {
        setFeedback({ type: 'error', text: data.error || '認証更新に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: '通信エラーが発生しました' });
    }
  };

  const handleOpenEdit = (comp: any) => {
    setEditingCompany(comp);
    setEditSpecialties(comp.specialties || []);
    setEditDescription(comp.description || '');
    setEditPhone(comp.phone || '');
    setEditEmail(comp.email || '');
    setEditWebsite(comp.website || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_company',
          companyId: editingCompany.id,
          data: {
            specialties: editSpecialties,
            description: editDescription,
            phone: editPhone,
            email: editEmail,
            website: editWebsite,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: '会社情報を更新しました。' });
        setEditingCompany(null);
        await fetchCompanies(page);
      } else {
        setFeedback({ type: 'error', text: data.error || '更新に失敗しました' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BuildingOffice2Icon className="w-6 h-6 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
          <span>全国宅建会社データベース管理</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          国土交通省宅建業者DBの管理、公式認証バッジの付与、およびPR内容を編集します。
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
      <div className="bg-white dark:bg-[#151B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchCompanies(1);
          }}
          className="flex items-center gap-2 w-full lg:max-w-md"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="会社名、免許番号、法人番号、市区町村..."
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

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <label className="min-h-[40px] flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A]"
            />
            <span>公式認証企業のみ</span>
          </label>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            該当件数: {total.toLocaleString()} 件
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
          データを読み込み中...
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
          該当する会社はありません
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {comp.companyName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      免許: {comp.licenseNumber} ｜ 法人: {comp.houjinNumber || '-'}
                    </div>
                  </div>
                  {comp.isVerified && (
                    <span className="shrink-0 text-[10px] bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-bold px-2 py-0.5 rounded">
                      認証済
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {comp.prefecture} {comp.city} {comp.address}
                </div>

                <div className="flex flex-wrap gap-1">
                  {comp.specialties && comp.specialties.length > 0 ? (
                    comp.specialties.map((s: string) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">宅建免許保有</span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-500 space-y-0.5">
                  <div>TEL: {comp.phone || '-'}</div>
                  <div className="break-all">Mail: {comp.email || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleVerify(comp.id, comp.isVerified)}
                    className={`min-h-[44px] text-xs font-bold rounded-lg transition-colors ${
                      comp.isVerified
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {comp.isVerified ? '✓ 認証中' : '未認証'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(comp)}
                    className="min-h-[44px] text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg inline-flex items-center justify-center gap-1"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    <span>編集</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#151B22] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">企業名・免許</th>
                    <th className="py-3 px-4">所在地</th>
                    <th className="py-3 px-4">専門分野 (Tags)</th>
                    <th className="py-3 px-4">連絡先</th>
                    <th className="py-3 px-4 text-center">公式認証</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {companies.map((comp) => (
                    <tr
                      key={comp.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 dark:text-slate-100">
                            {comp.companyName}
                          </span>
                          {comp.isVerified && (
                            <span className="text-[10px] bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-bold px-1.5 py-0.5 rounded">
                              認証済
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          免許: {comp.licenseNumber} ｜ 法人: {comp.houjinNumber || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {comp.prefecture} {comp.city}
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {comp.address}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {comp.specialties && comp.specialties.length > 0 ? (
                            comp.specialties.map((s: string) => (
                              <span
                                key={s}
                                className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400">宅建免許保有</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>{comp.phone || '-'}</div>
                        <div className="text-slate-400">{comp.email || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVerify(comp.id, comp.isVerified)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            comp.isVerified
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {comp.isVerified ? '✓ 認証中' : '未認証'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(comp)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>編集</span>
                        </button>
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

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-[#151B22] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">
                会社情報の編集: {editingCompany.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                aria-label="閉じる"
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                専門分野タグ (Specialties)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SPECIALTIES.map((spec) => {
                  const isChecked = editSpecialties.includes(spec);
                  return (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => {
                        if (isChecked) {
                          setEditSpecialties((prev) => prev.filter((s) => s !== spec));
                        } else {
                          setEditSpecialties((prev) => [...prev, spec]);
                        }
                      }}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#1B4F8A] text-white border-[#1B4F8A]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  PR・会社紹介文 (最大200文字)
                </label>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {editDescription.length}/200
                </span>
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  電話番号
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full min-h-[40px] text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full min-h-[40px] text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                公式WebサイトURL
              </label>
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://example.co.jp"
                className="w-full min-h-[40px] text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-[#1B4F8A] hover:bg-[#163F6F] text-white rounded-lg cursor-pointer"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
