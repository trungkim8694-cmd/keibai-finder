'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Globe, Mail, Phone, ShieldAlert, Star, AlertTriangle, CheckCircle, MessageSquare, Printer } from 'lucide-react';

interface AgencyProfileClientProps {
  agencyProfile: any;
  currentUser: any;
  hasReviewed: boolean;
}

const maskName = (name: string | null): string => {
  if (!name) return '匿名ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '匿名ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

const containsSensitiveInfo = (text: string): boolean => {
  const phoneRegex = /\d{2,4}-\d{2,4}-\d{3,4}|\d{10,11}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return phoneRegex.test(text) || emailRegex.test(text);
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

export function AgencyProfileClient({ agencyProfile, currentUser, hasReviewed }: AgencyProfileClientProps) {
  const router = useRouter();
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const [reportLoading, setReportLoading] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  const [alreadyReviewed, setAlreadyReviewed] = useState(hasReviewed);
  const [reviewsList, setReviewsList] = useState(agencyProfile.reviews || []);

  const totalReviews = reviewsList.length;
  const avgRating = totalReviews > 0
    ? (reviewsList.reduce((acc: number, curr: any) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    if (!reviewComment.trim()) {
      setReviewError('クチコミ内容を入力してください。');
      setReviewLoading(false);
      return;
    }

    if (containsSensitiveInfo(reviewComment)) {
      setReviewError('個人情報（電話番号やメールアドレスなど）が含まれているため、投稿できません。');
      setReviewLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/agency/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyProfileId: agencyProfile.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '評価の送信中にエラーが発生しました。');
      }

      setReviewSuccess('評価を投稿いただきありがとうございました！');
      setAlreadyReviewed(true);
      
      // Update reviews list locally
      setReviewsList([
        {
          id: data.review.id,
          rating: reviewRating,
          comment: reviewComment,
          created_at: new Date().toISOString(),
          user: {
            name: currentUser.name || 'あなた',
            image: currentUser.image,
          },
        },
        ...reviewsList,
      ]);
      
      setReviewComment('');
      router.refresh();
    } catch (err: any) {
      setReviewError(err.message || 'サーバー接続エラーが発生しました。');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setReportLoading(true);
    setReportError('');
    setReportSuccess('');

    if (!reportReason.trim()) {
      setReportError('報告の理由を入力してください。');
      setReportLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/agency/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyProfileId: agencyProfile.id,
          reason: reportReason,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '報告의 送信中にエラーが発生しました。');
      }

      setReportSuccess('ご報告を受け付けました。管理者が早急に確認いたします。');
      setReportReason('');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess('');
      }, 3000);
    } catch (err: any) {
      setReportError(err.message || 'サーバー接続エラーが発生しました。');
    } finally {
      setReportLoading(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.id === agencyProfile.userId;

  return (
    <div className="space-y-8">
      {/* Header Info Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Verification badge */}
        {agencyProfile.isVerified && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl shadow-sm">
            ✓ 認証済み
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {agencyProfile.logoUrl ? (
                <img src={agencyProfile.logoUrl} alt={agencyProfile.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-blue-500" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {agencyProfile.companyName}
              </h1>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <span>宅建業免許:</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-mono text-xs">
                  {agencyProfile.licenseNumber}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-2xl">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{avgRating}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-1">({totalReviews} 件の評価)</span>
            </div>

            {currentUser && !isOwnProfile && (
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2.5 rounded-2xl transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                不正情報の報告
              </button>
            )}
          </div>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800 my-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div className="flex items-center gap-3 font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">連絡先電話番号</p>
              <a href={`tel:${agencyProfile.phone}`} className="hover:underline font-bold text-zinc-900 dark:text-zinc-100">
                {agencyProfile.phone}
              </a>
            </div>
          </div>

          {agencyProfile.fax && (
            <div className="flex items-center gap-3 font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">FAX番号</p>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {agencyProfile.fax}
                </span>
              </div>
            </div>
          )}

          {agencyProfile.email && (
            <div className="flex items-center gap-3 font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">メールアドレス</p>
                <a href={`mailto:${agencyProfile.email}`} className="hover:underline font-bold text-zinc-900 dark:text-zinc-100">
                  {agencyProfile.email}
                </a>
              </div>
            </div>
          )}

          {agencyProfile.website && (
            <div className="flex items-center gap-3 font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black">ウェブサイト</p>
                <a href={agencyProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 break-all text-xs">
                  {agencyProfile.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details & Reviews */}
        <div className="lg:col-span-8 space-y-8">
          {/* Service Prefectures & Description */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-3">
                対応エリア（都道府県）
              </h2>
              <div className="flex flex-wrap gap-2">
                {agencyProfile.prefectures.map((pref: string) => (
                  <span
                    key={pref}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/40 px-3 py-1.5 rounded-full"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>

            {agencyProfile.description && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-3">
                  サービス紹介と対応能力
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm font-medium leading-relaxed whitespace-pre-line">
                  {agencyProfile.description}
                </p>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <MessageSquare className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                お客様の評価とクチコミ ({totalReviews})
              </h2>
            </div>

            {reviewsList.length > 0 ? (
              <div className="space-y-4">
                {reviewsList.map((rev: any) => {
                  const maskedReviewerName = maskName(rev.user?.name);
                  return (
                    <div key={rev.id} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
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
                        <span className="text-xs text-zinc-400 dark:text-zinc-600 font-semibold">
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
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Star className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-400 dark:text-zinc-500 text-sm font-bold">
                  まだ評価はありません。最初のクチコミを投稿しましょう！
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Review Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6 sticky top-6">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
              クチコミ・評価の投稿
            </h2>

            {!currentUser ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3">
                  この会社を評価するにはログインしてください。
                </p>
                <a
                  href="/?login=true"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Googleでログイン
                </a>
              </div>
            ) : isOwnProfile ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-600">
                  自身のプロフィールは評価できません。
                </p>
              </div>
            ) : alreadyReviewed ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-center">
                <p className="text-sm font-bold">
                  すでにこの会社にクチコミを投稿しています。クチコミは1アカウントにつき1件のみ投稿可能です。
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{reviewError}</span>
                  </div>
                )}
                {reviewSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase">満足度</label>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setReviewRating(i + 1)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-transform active:scale-95 ${
                            i < reviewRating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-300 dark:text-zinc-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase">詳細なクチコミ</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="サポート内容はいかがでしたか？対応スピードや丁寧さなど、具体的な感想を記入してください..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none"
                  />
                  <p className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-semibold leading-relaxed mt-1">
                    ※個人情報（電話番号、住所、メールアドレスなど）や特定の個人名（社員名など）の書き込みはご遠慮ください。
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-400 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors"
                >
                  {reviewLoading ? '送信中...' : '評価を送信'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-50">
                情報の不備・不正の報告
              </h3>
            </div>

            {reportError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{reportError}</span>
              </div>
            )}
            {reportSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{reportSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                この会社の掲載情報（宅建免許、連絡先など）の虚偽・不正について、具体的な理由をご記入ください。管理者が速やかに事実確認を行います。
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="詳細な理由を入力してください..."
                rows={4}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-400 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {reportLoading ? '送信中...' : '報告を送信'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
