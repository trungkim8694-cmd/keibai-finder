'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building2, 
  Send,
  Sparkles,
  Users
} from 'lucide-react';
import { submitAgencyLead } from '@/actions/agencyActions';

interface AgencyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleUnitId?: string;
  propertyAddress?: string;
  prefecture?: string;
  agencyProfileId?: string;
  agencyName?: string;
}

export function AgencyLeadModal({
  isOpen,
  onClose,
  saleUnitId,
  propertyAddress,
  prefecture = '東京都',
  agencyProfileId,
  agencyName,
}: AgencyLeadModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [contactMethod, setContactMethod] = useState<'PHONE' | 'EMAIL' | 'LINE'>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [inquiryType, setInquiryType] = useState<'BIDDING_ASSIST' | 'OCCUPANT_NEGOTIATION' | 'RENOVATION' | 'GENERAL'>('BIDDING_ASSIST');
  const [message, setMessage] = useState('');
  
  // Area broadcast checkbox (checked by default for fastest response)
  const [broadcastToLocalVerified, setBroadcastToLocalVerified] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [dispatchResult, setDispatchResult] = useState<{
    targetCompany?: { name: string; isVerified: boolean } | null;
    broadcastCompanies?: { id: string; name: string; prefecture: string }[];
    totalDispatched?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !contactValue) {
      setErrorMessage('お名前と連絡先を入力してください。');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await submitAgencyLead({
        sale_unit_id: saleUnitId,
        agencyProfileId,
        agencyName,
        prefecture,
        broadcastToLocalVerified,
        customerName,
        contactMethod,
        contactValue,
        inquiryType,
        message,
      });

      if (res.success) {
        setIsSuccess(true);
        setDispatchResult({
          targetCompany: res.targetCompany,
          broadcastCompanies: res.broadcastCompanies,
          totalDispatched: res.totalDispatched,
        });
      } else {
        setErrorMessage(res.error || '送信に失敗しました。');
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setCustomerName('');
    setContactValue('');
    setMessage('');
    setErrorMessage('');
    setDispatchResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                落札サポート・入札代行のご相談（無料）
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                宅建免許保有の専門エージェントへ無料相談
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  ご相談内容を送信いたしました
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  ご指定のご連絡方法（{contactMethod === 'PHONE' ? 'お電話' : contactMethod === 'EMAIL' ? 'メール' : 'LINE'}）宛てに、担当専門エージェントより順次ご連絡差し上げます。
                </p>
              </div>

              {/* Dispatched Companies Box */}
              {dispatchResult && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-lg border border-slate-200 dark:border-zinc-700 max-w-md mx-auto text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                      <span>相談内容の配信先（合計 {dispatchResult.totalDispatched || 1} 社）</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      送信完了
                    </span>
                  </div>

                  <ul className="text-[11px] space-y-1.5 divide-y divide-slate-100 dark:divide-zinc-700/60 pt-1">
                    {dispatchResult.targetCompany && (
                      <li className="pt-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">
                          {dispatchResult.targetCompany.name}
                        </span>
                        <span className="text-[9.5px] bg-blue-100 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0 font-medium">
                          指名相談先
                        </span>
                      </li>
                    )}
                    {dispatchResult.broadcastCompanies?.map((comp) => (
                      <li key={comp.id} className="pt-1 flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300 truncate mr-2">
                          {comp.name}
                        </span>
                        <span className="text-[9.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0 border border-emerald-200 dark:border-emerald-800">
                          {comp.prefecture}公式認証
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetAndClose}
                className="mt-2 px-6 py-2.5 text-xs font-medium bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-lg transition-colors shadow-xs"
              >
                閉じる
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Target Company or Property Info */}
              {agencyName && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ご相談先企業</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{agencyName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#1B4F8A] dark:text-blue-300 font-semibold bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    無料相談
                  </span>
                </div>
              )}

              {propertyAddress && (
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200/60 dark:border-zinc-800 text-slate-600 dark:text-slate-300">
                  <span className="text-[10px] text-slate-400 block mb-0.5">対象物件</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {propertyAddress}
                  </p>
                </div>
              )}

              {/* Inquiry Type */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  ご相談種別 <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BIDDING_ASSIST', label: '入札代行・価格査定' },
                    { id: 'OCCUPANT_NEGOTIATION', label: '占有者・明渡し交渉' },
                    { id: 'RENOVATION', label: 'リフォーム・原状回復' },
                    { id: 'GENERAL', label: '総合コンサルティング' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInquiryType(item.id as any)}
                      className={`px-3 py-2 text-left rounded-lg border transition-colors ${
                        inquiryType === item.id
                          ? 'border-[#1B4F8A] bg-blue-50/50 dark:bg-blue-950/30 text-[#1B4F8A] dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  お名前（法人名・氏名） <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例：山田 太郎 / 株式会社〇〇"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A]"
                />
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  希望のご連絡方法 <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'PHONE', label: 'お電話', icon: Phone },
                    { id: 'EMAIL', label: 'メール', icon: Mail },
                    { id: 'LINE', label: 'LINE ID', icon: MessageSquare },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setContactMethod(m.id as any)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors ${
                          contactMethod === m.id
                            ? 'border-[#1B4F8A] bg-[#1B4F8A] text-white font-medium'
                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Value Input */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  {contactMethod === 'PHONE'
                    ? '電話番号'
                    : contactMethod === 'EMAIL'
                    ? 'メールアドレス'
                    : 'LINE ID'} <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type={contactMethod === 'EMAIL' ? 'email' : 'text'}
                  required
                  placeholder={
                    contactMethod === 'PHONE'
                      ? '090-1234-5678'
                      : contactMethod === 'EMAIL'
                      ? 'example@domain.com'
                      : 'line_id_example'
                  }
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  ご相談詳細・ご要望（任意）
                </label>
                <textarea
                  rows={2}
                  placeholder="入札予定額や立ち退き手続きについて相談したい等"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A]"
                />
              </div>

              {/* AUTOMATED AREA BROADCAST CHECKBOX (DIRECT + BROADCAST) */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200/80 dark:border-blue-900/60 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={broadcastToLocalVerified}
                    onChange={(e) => setBroadcastToLocalVerified(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#1B4F8A] focus:ring-[#1B4F8A] h-4 w-4"
                  />
                  <div className="text-[11px] text-slate-700 dark:text-slate-200 leading-snug">
                    <span className="font-bold text-[#1B4F8A] dark:text-blue-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      迅速回答サポート（推奨・完全無料）
                    </span>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      万一の返信遅延を防ぐため、同エリア（{prefecture}）の公式認証パートナー（最大3社）にも同時に相談を配信し、最も早い提案を受け取ります。
                    </p>
                  </div>
                </label>
              </div>

              {errorMessage && (
                <p className="text-red-600 text-xs font-medium">{errorMessage}</p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 font-bold bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-lg transition-colors disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>送信中...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>相談内容を送信する（無料）</span>
                    </>
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
