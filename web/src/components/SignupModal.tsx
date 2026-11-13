'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { signIn, useSession } from 'next-auth/react';
import { 
  ShieldCheck, 
  X, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { checkEmailTypo } from '@/lib/emailCorrection';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignupModal({ isOpen, onClose, onSuccess }: SignupModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Step: 'EMAIL' | 'OTP'
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  
  const [emailInput, setEmailInput] = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  
  const [otpInput, setOtpInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  
  // Resend cooldown timer
  const [cooldown, setCooldown] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session && isOpen) {
      onClose();
    }
  }, [session, isOpen, onClose]);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  if (!isOpen || !mounted || session) return null;

  const handleEmailChange = (val: string) => {
    setEmailInput(val);
    setErrorMessage(null);
    const suggestion = checkEmailTypo(val);
    setEmailSuggestion(suggestion);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMessage('有効なメールアドレスを入力してください。');
      return;
    }

    setErrorMessage(null);
    setSendingEmail(true);

    try {
      const res = await fetch('/api/auth/send-otp-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || '認証コードの送信に失敗しました。');
      } else {
        setStep('OTP');
        setCooldown(60);
        setSuccessNotice('認証コードをメールに送信しました。6桁の番号を入力してください。');
        
        // If local dev simulation
        if (data.simulated && data.simulatedOtp) {
          console.log('[DEV SIMULATION] Auto-filled OTP for testing:', data.simulatedOtp);
          setOtpInput(data.simulatedOtp);
        }
      }
    } catch (err: any) {
      setErrorMessage('通信エラーが発生しました。接続をご確認ください。');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setErrorMessage('6桁の認証コードを正確に入力してください。');
      return;
    }

    setErrorMessage(null);
    setVerifyingOtp(true);

    try {
      const res = await signIn('email-otp-link', {
        email: emailInput.trim(),
        otp: otpInput.trim(),
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('認証コードが正しくないか、有効期限が切れています。再度お試しください。');
      } else {
        // Success
        setSuccessNotice('ログインに成功しました！');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      setErrorMessage('ログイン検証中にエラーが発生しました。');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetToEmail = () => {
    setStep('EMAIL');
    setOtpInput('');
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-[430px] w-full mx-auto p-6 relative border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 font-sans text-slate-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Institutional Header */}
        <div className="text-center mb-5 mt-1">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/50 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {step === 'EMAIL' ? '無料会員登録・ログイン' : '認証コードの入力'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {step === 'EMAIL'
              ? 'お気に入り物件の保存や、周辺不動産会社への相談・オーナー管理をご利用いただけます。'
              : `${emailInput} 宛てに届いた6桁の認証コードを入力してください。`}
          </p>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{successNotice}</span>
          </div>
        )}

        {/* STEP 1: EMAIL & GOOGLE */}
        {step === 'EMAIL' ? (
          <div className="space-y-4">
            {/* 1. Google 1-Click Login */}
            <button 
              type="button"
              onClick={() => signIn('google')}
              className="w-full bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Googleアカウントで続行</span>
            </button>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              <span className="px-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                またはメールアドレスでログイン
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
            </div>

            {/* 2. Any Email OTP / Magic Link Form */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  メールアドレス（Gmail, Yahoo, 会社メール等）
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="example@domain.co.jp"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Email Typo Correction Suggestion */}
                {emailSuggestion && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 font-medium flex items-center gap-1.5">
                    <span>もしかして:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput(emailSuggestion);
                        setEmailSuggestion(null);
                      }}
                      className="text-[#1B4F8A] dark:text-blue-400 hover:underline font-bold"
                    >
                      {emailSuggestion}
                    </button>
                    <span>?</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingEmail}
                className="w-full bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>認証コードを送信中...</span>
                  </>
                ) : (
                  <>
                    <span>認証コード・ログインリンクを送信</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">送信先メールアドレス</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{emailInput}</span>
              </div>
              <button
                type="button"
                onClick={handleResetToEmail}
                className="text-[11px] text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline shrink-0"
              >
                変更する
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  メール記載の 6桁認証コード を入力
                </label>
                <div className="relative max-w-[220px] mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono tracking-[0.4em] py-2 px-3 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#1B4F8A] focus:ring-2 focus:ring-[#1B4F8A]/20"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otpInput.length !== 6}
                className="w-full bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ログインを検証中...</span>
                  </>
                ) : (
                  <span>認証してログイン</span>
                )}
              </button>
            </form>

            {/* Resend Cooldown Button */}
            <div className="text-center pt-1">
              {cooldown > 0 ? (
                <span className="text-[11px] text-slate-400">
                  コード再送信まであと <strong className="font-mono text-slate-600 dark:text-slate-300">{cooldown}</strong> 秒
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>認証コードを再送信する</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              💡 メール内の「ワンクリックでログイン」ボタンからも直接ログインいただけます。
            </p>
          </div>
        )}

        {/* Member Benefits Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            会員限定の無料機能
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>お気に入り・検討ボード</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>入札代行・無料相談</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>宅建企業のオーナー認証</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>顧客リード管理 (CRM)</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
