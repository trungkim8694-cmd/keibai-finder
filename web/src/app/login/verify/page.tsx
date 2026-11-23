'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginVerifyPage() {
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const token = sp?.get('token');
    const email = sp?.get('email');

    if (!token || !email) {
      setStatus('error');
      setErrorMsg('認証リンクが無効です。URLをご確認ください。');
      return;
    }

    const performSignIn = async () => {
      try {
        const result = await signIn('email-otp-link', {
          email,
          token,
          redirect: false,
        });

        if (result?.error) {
          console.error('Sign-in error:', result.error);
          setStatus('error');
          setErrorMsg('ログインリンクの有効期限が切れているか、既に使用されています。もう一度ログインをお試しください。');
        } else {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1200);
        }
      } catch (err) {
        console.error('Sign-in exception:', err);
        setStatus('error');
        setErrorMsg('認証処理中にエラーが発生しました。時間を置いて再度お試しください。');
      }
    };

    performSignIn();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 text-[#1B4F8A] animate-spin" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              ログインを検証しています...
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              認証が完了するまでこの画面のままお待ちください。
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              ログインに成功しました！
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ダッシュボードへ自動的に遷移しています...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              ログインに失敗しました
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs leading-relaxed">
              {errorMsg}
            </p>
            <Link
              href="/"
              className="mt-4 px-6 py-2.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              トップページに戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
