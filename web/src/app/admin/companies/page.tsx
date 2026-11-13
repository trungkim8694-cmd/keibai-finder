'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BuildingOffice2Icon, 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon
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
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (verifiedFilter) params.set('verified', 'true');
      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [verifiedFilter]);

  const handleToggleVerify = async (companyId: string, current: boolean) => {
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
      if (data.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, isVerified: !current } : c))
        );
      }
    } catch (err) {
      console.error(err);
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
      if (data.success) {
        alert('会社情報を更新しました');
        setEditingCompany(null);
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BuildingOffice2Icon className="w-7 h-7 text-blue-600" />
          <span>全国宅建会社データベース管理</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          国土交通省宅建業者DBの管理、公式認証バッジのワンクリック付与、およびPR内容を編集します。
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCompanies();
          }}
          className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="会社名、免許番号、法人番号、市区町村..."
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

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>公式認証企業のみ表示</span>
          </label>
          <div className="text-xs font-bold text-zinc-500">
            該当件数: {total.toLocaleString()} 件
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">データを読み込み中...</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">該当する会社はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">企業名・免許</th>
                  <th className="py-3 px-4">所在地</th>
                  <th className="py-3 px-4">専門分野 (Tags)</th>
                  <th className="py-3 px-4">連絡先</th>
                  <th className="py-3 px-4 text-center">公式認証</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {companies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-zinc-50/50">
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-900 dark:text-zinc-100">{comp.companyName}</span>
                        {comp.isVerified && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                            認証済
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        免許: {comp.licenseNumber} ｜ 法人: {comp.houjinNumber || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                      {comp.prefecture} {comp.city}
                      <div className="text-[11px] text-zinc-400 truncate max-w-xs">{comp.address}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {comp.specialties && comp.specialties.length > 0 ? (
                          comp.specialties.map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-400">宅建免許保有</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{comp.phone || '-'}</div>
                      <div className="text-zinc-400">{comp.email || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleVerify(comp.id, comp.isVerified)}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                          comp.isVerified
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {comp.isVerified ? '✓ 認証中' : '未認証'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="px-2.5 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md cursor-pointer inline-flex items-center gap-1"
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
        )}
      </div>

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                会社情報の編集: {editingCompany.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
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
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
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
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  PR・会社紹介文 (最大200文字)
                </label>
                <span className="text-[11px] text-zinc-400">{editDescription.length}/200</span>
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  電話番号
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
