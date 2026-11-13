'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { submitDelistRequest } from '@/actions/companyActions';

interface CompanyDelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    companyName: string;
    licenseNumber: string;
    houjinNumber?: string | null;
    prefecture: string;
    city: string;
  } | null;
  onSuccess?: () => void;
}

export function CompanyDelistModal({
  isOpen,
  onClose,
  company,
  onSuccess,
}: CompanyDelistModalProps) {
  const [reason, setReason] = useState('掲載情報の訂正・更新希望');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [details, setDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('有効な連絡先メールアドレスを入力してください。');
      return;
    }

    try {
      setLoading(true);
      const res = await submitDelistRequest({
        companyId: company.id,
        reason,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim() || undefined,
        details: details.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || '申請の送信に失敗しました。');
      } else {
        setSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg('通信エラーが発生しました。時間を置いて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                掲載情報の修正・削除申請窓口
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                事業者様からの情報修正および非掲載のご要望を受け付けております
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-zinc-300">
          {success ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  申請を受け付けました
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  申請内容を確認の上、1営業日以内に修正または非表示の対応を行わせていただきます。必要に応じてご入力の連絡先へご連絡いたします。
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors"
              >
                閉じる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Company Box */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  対象企業
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>{company.companyName}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  <span>{company.licenseNumber}</span> | <span>{company.prefecture} {company.city}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="leading-relaxed">
                  当サイトでは国土交通省及び各自治体が公開する宅地建物取引業者名簿・法人番号公的データに基づき掲載を行っております。事業者様のご意向により、情報の訂正や非公開（削除）のご要望を迅速に承ります。
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  ご希望の対応区分 <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                >
                  <option value="掲載情報の訂正・更新希望">掲載情報の訂正・最新情報への更新希望</option>
                  <option value="自社サイト・連絡先非公開希望">電話番号・連絡先・掲載の非公開希望</option>
                  <option value="廃業・免許返納のため">廃業・宅建免許返納に伴う掲載削除</option>
                  <option value="その他">その他の理由</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    ご担当者様メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="例: contact@company.jp"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    連絡先電話番号（任意）
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="例: 03-0000-0000"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  具体的な修正内容・理由詳細
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="変更後の電話番号・住所や、削除を希望される理由をご記入ください。"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B4F8A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium text-xs transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>送信中...</span>
                    </>
                  ) : (
                    <span>修正・削除申請を送信する</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
