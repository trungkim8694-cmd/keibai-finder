'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, Star, AlertTriangle, CheckCircle, MessageSquare, Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// Helper to resize image client-side using Canvas to limit memory and disk usage
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }
        // Fill canvas with white background to handle transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/jpeg',
          0.75 // 75% quality JPEG
        );
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
};

const maskName = (name: string | null): string => {
  if (!name) return '匿名ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '匿名ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

function TruncatedComment({ comment }: { comment: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  const shouldTruncate = comment.length > maxLength;

  if (!shouldTruncate) {
    return <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">{comment}</p>;
  }

  const displayedText = isExpanded ? comment : `${comment.slice(0, maxLength)}...`;

  return (
    <div className="space-y-1">
      <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">
        {displayedText}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
      >
        {isExpanded ? '折りたたむ' : '続きを読む'}
      </button>
    </div>
  );
}

interface AgencyFormProps {
  initialProfile: any;
}

export function AgencyForm({ initialProfile }: AgencyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [companyName, setCompanyName] = useState(initialProfile?.companyName || '');
  const [licenseNumber, setLicenseNumber] = useState(initialProfile?.licenseNumber || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [fax, setFax] = useState(initialProfile?.fax || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [website, setWebsite] = useState(initialProfile?.website || '');
  const [description, setDescription] = useState(initialProfile?.description || '');
  const [logoUrl, setLogoUrl] = useState(initialProfile?.logoUrl || '');
  const [licenseImageUrl, setLicenseImageUrl] = useState(initialProfile?.licenseImageUrl || '');
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>(initialProfile?.prefectures || []);

  const [logoUploading, setLogoUploading] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);

  const handlePrefectureChange = (pref: string) => {
    if (selectedPrefectures.includes(pref)) {
      setSelectedPrefectures(selectedPrefectures.filter((p) => p !== pref));
    } else {
      setSelectedPrefectures([...selectedPrefectures, pref]);
    }
  };

  const handleSelectAll = (region: 'all' | 'none' | 'kanto' | 'kansai') => {
    if (region === 'all') {
      setSelectedPrefectures(PREFECTURES);
    } else if (region === 'none') {
      setSelectedPrefectures([]);
    } else if (region === 'kanto') {
      const kanto = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];
      setSelectedPrefectures(Array.from(new Set([...selectedPrefectures, ...kanto])));
    } else if (region === 'kansai') {
      const kansai = ['大阪府', '京都府', '兵庫県', '奈良県', '滋賀県', '和歌山県'];
      setSelectedPrefectures(Array.from(new Set([...selectedPrefectures, ...kansai])));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setError('');
    setSuccess('');

    try {
      // Resize logo to max 200x200 px (very small, suitable for avatar/logo)
      const resizedBlob = await resizeImage(file, 200, 200);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ロゴのアップロードに失敗しました。');
      }

      setLogoUrl(data.url);
      setSuccess('ロゴ画像が正常にアップロードされました。');
    } catch (err: any) {
      setError(err.message || 'アップロードエラーが発生しました。');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLicenseUploading(true);
    setError('');
    setSuccess('');

    try {
      // Resize license to max 1000x1000 px (keeps details sharp enough to read but highly compressed)
      const resizedBlob = await resizeImage(file, 1000, 1000);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('type', 'license');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '免許証のアップロードに失敗しました。');
      }

      setLicenseImageUrl(data.url);
      setSuccess('宅建業免許証のコピーが正常にアップロードされました。');
    } catch (err: any) {
      setError(err.message || 'アップロードエラーが発生しました。');
    } finally {
      setLicenseUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      setError('会社名は必須項目です。');
      setLoading(false);
      return;
    }
    if (!licenseNumber.trim()) {
      setError('宅建業免許番号は必須項目です。');
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
      setError('連絡先電話番号は必須項目です。');
      setLoading(false);
      return;
    }
    if (selectedPrefectures.length === 0) {
      setError('対応エリア（都道府県）を少なくとも1つ選択してください。');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/agency/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          licenseNumber,
          phone,
          fax,
          email,
          website,
          prefectures: selectedPrefectures,
          description,
          logoUrl,
          licenseImageUrl
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '更新中にエラーが発生しました。');
      }

      setSuccess('プロフィールが正常に更新されました！');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'サーバー接続エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
              {initialProfile ? '競売サポート会社プロフィールの編集' : '競売サポート会社の登録'}
            </h2>
          </div>
          {initialProfile && (
            <div>
              {initialProfile.isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
                  承認済み
                </span>
              ) : initialProfile.rejectionReason ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200 dark:border-rose-800 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  却下 (要再申請)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  審査中 (未承認)
                </span>
              )}
            </div>
          )}
        </div>

        {initialProfile && !initialProfile.isVerified && !initialProfile.rejectionReason && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-2xl text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">現在、プロフィールは審査中です</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                アップロードいただいた「宅建業免許証」を管理者が確認しています。審査が完了（承認）するまで、物件詳細ページに対応エリアとして連絡先情報は掲載されません。今しばらくお待ちください。
              </p>
            </div>
          </div>
        )}

        {initialProfile && !initialProfile.isVerified && initialProfile.rejectionReason && (
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-800/60 text-rose-850 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1 w-full">
              <p className="font-bold">ご申請いただいた情報に確認事項がございます（要再申請）</p>
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed bg-white/70 dark:bg-black/20 p-3 rounded-xl border border-rose-200/50 dark:border-rose-900/50 mt-1">
                <span className="font-bold block text-[10px] text-rose-500 uppercase tracking-wider mb-1">管理者からのご連絡:</span>
                {initialProfile.rejectionReason}
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-bold">
                ※恐れ入りますが、上記のご連絡事項をご確認のうえ、必要な情報を修正・再アップロードいただき、再度「プロフィールを保存」してご申請ください。
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-sm flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm flex items-start gap-2 animate-in fade-in">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              会社名 (Company Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例：TQC不動産株式会社"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              宅建業免許番号 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="例：東京都知事 (1) 第12345号"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              連絡先電話番号 <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例：03-6907-1219"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              メールアドレス（任意）
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例：contact@broker.co.jp"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              ウェブサイト（任意）
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="例：https://my-broker.jp"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              FAX番号（任意）
            </label>
            <input
              type="text"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              placeholder="例：03-6907-1220"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Image Upload section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              ロゴ画像（任意）
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    {!logoUploading && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-zinc-900/80 hover:bg-zinc-950 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-white rounded-full flex items-center justify-center transition-all z-10 border border-zinc-700/50"
                        title="画像を削除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <ImageIcon className="w-6 h-6 text-zinc-400" />
                )}
                {logoUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white font-bold">
                    ...
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="logo-input"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
                <label
                  htmlFor="logo-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {logoUploading ? 'アップロード中...' : '画像を選択'}
                </label>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  PNG, JPG形式。自動リサイズ・圧縮されます。
                </p>
              </div>
            </div>
          </div>

          {/* License Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              宅建業免許証のコピー（管理確認用・非公開）
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm">
                {licenseImageUrl ? (
                  <>
                    <img src={licenseImageUrl} alt="Takken license" className="w-full h-full object-cover" />
                    {!licenseUploading && (
                      <button
                        type="button"
                        onClick={() => setLicenseImageUrl('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-zinc-900/80 hover:bg-zinc-950 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-white rounded-full flex items-center justify-center transition-all z-10 border border-zinc-700/50"
                        title="画像を削除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <FileText className="w-6 h-6 text-zinc-400" />
                )}
                {licenseUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white font-bold">
                    ...
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="license-input"
                  accept="image/*"
                  onChange={handleLicenseUpload}
                  className="hidden"
                  disabled={licenseUploading}
                />
                <label
                  htmlFor="license-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {licenseUploading ? 'アップロード中...' : '免許証画像を選択'}
                </label>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  管理側の本人確認にのみ使用されます。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            会社紹介および対応サービス（任意）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="競売不動産サポートにおける強みや特徴などを記入してください..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <div>
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                対応エリア（都道府県） <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                ここに登録した都道府県に属する物件詳細ページの下部に、貴社の連絡先情報が表示されます。
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectAll('kanto')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                + 関東
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll('kansai')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                + 関西
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll('all')}
                className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 hover:bg-zinc-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll('none')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                選択解除
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {PREFECTURES.map((pref) => {
              const isChecked = selectedPrefectures.includes(pref);
              return (
                <label
                  key={pref}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handlePrefectureChange(pref)}
                    className="sr-only"
                  />
                  <span>{pref}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading || logoUploading || licenseUploading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-400 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all animate-in fade-in"
          >
            <Save className="w-4 h-4" />
            {loading ? '保存中...' : 'プロフィールを保存'}
          </button>
        </div>
      </form>

      {initialProfile && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <MessageSquare className="w-6 h-6 text-violet-500" />
            <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              お客様の評価とクチコミ
              <span className="text-xs bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
                {initialProfile.reviews?.length || 0} 件
              </span>
            </h2>
          </div>

          {initialProfile.reviews && initialProfile.reviews.length > 0 ? (
            <div className="space-y-4">
              {initialProfile.reviews.map((rev: any) => {
                const maskedReviewerName = maskName(rev.user?.name);
                return (
                  <div key={rev.id} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {Array.from(maskedReviewerName)[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {maskedReviewerName}
                          </h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-300 dark:text-zinc-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">
                        {new Date(rev.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className="pl-13 sm:pl-0">
                      <TruncatedComment comment={rev.comment} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Star className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-400 dark:text-zinc-600 text-sm font-bold">
                まだクチコミはありません。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
