'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileCheck,
  Award,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Tag,
  FileText,
  UploadCloud,
  File,
  Trash2,
  Mail,
  FileBadge
} from 'lucide-react';
import { submitClaimRequest } from '@/actions/companyActions';

interface CompanyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    companyName: string;
    licenseNumber: string;
    houjinNumber?: string | null;
    prefecture: string;
    city: string;
    address: string;
  } | null;
  onSuccess?: () => void;
}

const AVAILABLE_SPECIALTIES = [
  '競売入札代行',
  '明渡し交渉',
  '任意売却',
  '物件調査',
  'リフォーム',
  '賃貸管理',
  '収益物件仲介'
];

const DOCUMENT_TYPES = [
  { id: 'TOHON', label: '登記事項証明書（謄本）', desc: '履歴事項全部証明書または現在事項証明書' },
  { id: 'MEISHI', label: '担当者名刺（社名・役職入り）', desc: '申請者のお名前と企業名が明記された名刺' },
  { id: 'TAKKEN_LICENSE', label: '宅地建物取引士証', desc: '公的宅建士証（専任または従事者）' },
  { id: 'OTHER', label: 'その他公的許認可証・証明書類', desc: '宅建免許証の写しなど' },
];

export function CompanyClaimModal({
  isOpen,
  onClose,
  company,
  onSuccess,
}: CompanyClaimModalProps) {
  // Method selection: 'EMAIL_DOMAIN' (company email) or 'DOCUMENT' (tohon/meishi upload)
  const [verificationMethod, setVerificationMethod] = useState<'EMAIL_DOMAIN' | 'DOCUMENT'>('DOCUMENT');

  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [position, setPosition] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  
  // Document upload states
  const [documentType, setDocumentType] = useState<string>('TOHON');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Specialties tags chosen by business
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['宅建免許保有']);
  
  // Custom PR description (with max length)
  const [customDescription, setCustomDescription] = useState('');
  const MAX_DESCRIPTION_LENGTH = 200;

  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    method: 'EMAIL_DOMAIN' | 'DOCUMENT';
    verificationLink?: string | null;
    requestId?: string;
  } | null>(null);

  if (!isOpen || !company) return null;

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) => {
      if (prev.includes(spec)) {
        const next = prev.filter((s) => s !== spec);
        return next.length === 0 ? ['宅建免許保有'] : next;
      } else {
        return [...prev, spec];
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/companies/upload-verification', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || 'ファイルのアップロードに失敗しました。');
      } else {
        setUploadedFileUrl(data.fileUrl);
        setUploadedFileName(data.fileName);
        setUploadedFileSize(data.fileSize);
      }
    } catch (err: any) {
      setUploadError('通信エラーが発生しました。ファイルサイズをご確認ください。');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!applicantName.trim()) {
      setErrorMsg('ご担当者様のお名前を入力してください。');
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setErrorMsg('有効な連絡先メールアドレスを入力してください。');
      return;
    }
    if (!applicantPhone.trim()) {
      setErrorMsg('連絡先電話番号を入力してください。');
      return;
    }
    if (!position.trim()) {
      setErrorMsg('役職またはご関係（代表取締役、宅建士など）を入力してください。');
      return;
    }

    if (verificationMethod === 'DOCUMENT' && !uploadedFileUrl) {
      setErrorMsg('確認書類（登記簿謄本・名刺・宅建士証など）のファイルをアップロードしてください。');
      return;
    }

    try {
      setLoading(true);
      const res = await submitClaimRequest({
        companyId: company.id,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantPhone: applicantPhone.trim(),
        position: position.trim(),
        corporateEmail: corporateEmail.trim() || undefined,
        verificationMethod,
        documentUrl: uploadedFileUrl || undefined,
        documentType: verificationMethod === 'DOCUMENT' ? (documentType as any) : undefined,
        specialties: selectedSpecialties,
        customDescription: customDescription.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || '申請の送信に失敗しました。');
      } else {
        setSuccess(true);
        setSuccessInfo({
          method: verificationMethod,
          verificationLink: res.verificationLink || null,
          requestId: res.requestId,
        });
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
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                企業情報オーナー確認・公式認証申請
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                宅建業免許・法人登記データに基づく企業オーナー認証（無料）
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Company Info Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/60 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>申請対象の企業情報（公的登記データ）</span>
              {company.houjinNumber && (
                <span className="font-mono">法人番号: {company.houjinNumber}</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{company.companyName}</span>
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
              <span>免許番号: <span className="font-medium text-slate-800 dark:text-slate-200">{company.licenseNumber}</span></span>
              <span>所在地: <span className="font-medium text-slate-800 dark:text-slate-200">{company.prefecture} {company.city}</span></span>
            </div>
          </div>

          {success ? (
            /* SUCCESS STATE */
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              {successInfo?.method === 'DOCUMENT' ? (
                /* DOCUMENT SUBMISSION SUCCESS */
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    確認書類の受領を完了いたしました
                  </h4>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-left text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>受付番号: {successInfo.requestId?.slice(0, 12)}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px]">審査中（通常1〜2営業日）</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      ご提出いただいた確認書類（{DOCUMENT_TYPES.find(d => d.id === documentType)?.label || '登記書類'}）と、国土交通省・自治体の宅地建物取引業者名簿の登記データを照合いたします。
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      確認完了後、貴社ページに<strong className="text-emerald-700 dark:text-emerald-300">「公式認証バッジ（青の認証マーク）」</strong>が付与され、ご登録いただいた専門分野タグとPR紹介文が一般公開されます。
                    </p>
                  </div>
                </div>
              ) : (
                /* EMAIL DOMAIN MAGIC LINK SUCCESS */
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    オーナー確認の申請を受け付けました
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    ご入力のメールアドレス宛てに<strong>「公式認証確認メール」</strong>をお送りしました。メール内の確認ボタンをクリックすると、即座に認証マークが付与され設定内容が反映されます。
                  </p>

                  {successInfo?.verificationLink && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-left">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>即時確認（自動認証リンク）</span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300 mb-3">
                        開発・テスト環境用：以下のリンクをクリックすると、メール確認をスキップして即座に公式認証を完了できます。
                      </p>
                      <a
                        href={successInfo.verificationLink}
                        className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                      >
                        <span>今すぐワンクリック認証を完了する ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-md shadow-sm transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* VERIFICATION METHOD TABS */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  認証方式の選択 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVerificationMethod('DOCUMENT')}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      verificationMethod === 'DOCUMENT'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 bg-white dark:bg-zinc-800/40'
                    }`}
                  >
                    <div className={`p-2 rounded-md shrink-0 mt-0.5 ${
                      verificationMethod === 'DOCUMENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-500'
                    }`}>
                      <FileBadge className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>書類提出（謄本・名刺等）</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-medium">Gmail可</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        登記簿謄本・名刺・宅建士証の写真をアップロード（フリーメールOK）
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationMethod('EMAIL_DOMAIN')}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      verificationMethod === 'EMAIL_DOMAIN'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 bg-white dark:bg-zinc-800/40'
                    }`}
                  >
                    <div className={`p-2 rounded-md shrink-0 mt-0.5 ${
                      verificationMethod === 'EMAIL_DOMAIN' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-500'
                    }`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>会社ドメインメール認証</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-medium">即時</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        企業独自ドメイン（@company.co.jp等）宛てのメールで自動認証
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* APPLICANT BASIC INFORMATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    申請者のお名前 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="例: 山田 太郎（代表者または専任宅建士）"
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    役職・関係 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="例: 代表取締役 / 専任宅建士 / 営業課長"
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    連絡先メールアドレス <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="例: yamada@example.co.jp（Gmail可）"
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">※審査結果や確認通知をお送りします</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    連絡先電話番号 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="例: 03-1234-5678（登記・免許情報記載の番号）"
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* METHOD-SPECIFIC INPUTS */}
              {verificationMethod === 'DOCUMENT' ? (
                /* DOCUMENT UPLOAD SECTION */
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-blue-600" />
                      <span>確認書類の提出（登記簿謄本・名刺・宅建士証）</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">PDF, JPG, PNG（最大10MB）</span>
                  </div>

                  {/* Document Type Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      提出する書類の種類を選択してください:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DOCUMENT_TYPES.map((doc) => (
                        <label
                          key={doc.id}
                          className={`flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            documentType === doc.id
                              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 font-medium text-blue-900 dark:text-blue-200'
                              : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-100/60 dark:hover:bg-zinc-750 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="documentType"
                            value={doc.id}
                            checked={documentType === doc.id}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div>{doc.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{doc.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Drag & Drop File Zone */}
                  {uploadedFileUrl ? (
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {uploadedFileName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {uploadedFileSize ? `${(uploadedFileSize / 1024).toFixed(1)} KB` : 'アップロード完了'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                        title="ファイルを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        id="verification-file-input"
                      />
                      <label
                        htmlFor="verification-file-input"
                        className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          uploading
                            ? 'bg-slate-100 border-slate-300 dark:bg-zinc-800 dark:border-zinc-700 cursor-wait'
                            : 'border-slate-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">書類をアップロード中...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              クリックして確認書類を選択、またはここにドラッグ＆ドロップ
                            </div>
                            <p className="text-[11px] text-slate-400">
                              謄本、名刺の写真（スマートフォン撮影可）、宅建士証の画像ファイル
                            </p>
                          </div>
                        )}
                      </label>
                      {uploadError && (
                        <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{uploadError}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-white/60 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200/70 dark:border-zinc-800">
                    💡 <strong>審査について</strong>：提出いただいた書類と国交省公的名簿を対照し、通常1〜2営業日以内に公式認証を完了いたします。提出書類は認証目的のみに使用し、厳格に管理されます。
                  </p>
                </div>
              ) : (
                /* CORPORATE EMAIL INPUT */
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    会社ドメインの公式メールアドレス（お持ちの場合） <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required={verificationMethod === 'EMAIL_DOMAIN'}
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    placeholder="例: info@auction-partners.co.jp（企業の独自ドメイン）"
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-1.5">
                    ※入力いただいた会社ドメインアドレス宛てに即時認証用の確認リンクをお送りします。
                  </p>
                </div>
              )}

              {/* SPECIALTIES TAGS (MULTI-SELECT PILLS) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>得意分野・対応可能業務（認証後にカードへ表示）</span>
                  </label>
                  <span className="text-[11px] text-slate-400">複数選択可</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  貴社が提供可能なサービスを選択してください（デフォルトは「宅建免許保有」のみ表示されています）。
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AVAILABLE_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-sm'
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM PR / DESCRIPTION TEXTAREA (MAX 200 CHARACTERS) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>自社PR・企業紹介文（任意）</span>
                  </label>
                  <span className={`text-[11px] font-mono ${
                    customDescription.length > MAX_DESCRIPTION_LENGTH ? 'text-rose-600 font-bold' : 'text-slate-400'
                  }`}>
                    {customDescription.length} / {MAX_DESCRIPTION_LENGTH} 文字
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  認証完了後、デフォルトの公的登録定型文に代わってこちらの紹介文が表示されます。
                </p>
                <textarea
                  rows={3}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="例: 福岡・博多エリア専門。競売入札から占有者との明渡し交渉、リフォームまでワンストップで支援いたします。"
                  className="w-full text-xs p-3 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ADDITIONAL NOTES */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  その他ご要望・特記事項（任意）
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="電話番号・ウェブサイトURLの更新希望などがあればご記入ください。"
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-5 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{verificationMethod === 'DOCUMENT' ? '確認書類を添えて申請する（無料）' : '無料オーナー確認を申請する'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
