'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Building, 
  User, 
  Phone, 
  HelpCircle,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export default function ContactForm() {
  const [formData, setFormData] = useState({
    category: 'SERVICE_USAGE',
    companyName: '',
    name: '',
    furigana: '',
    email: '',
    phone: '',
    preferredContact: 'EMAIL',
    subject: '',
    message: '',
    agreePrivacy: false,
    website_check: '', // Honeypot
  });

  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '0x4AAAAAAGA8qC6zkw-tXmKZ';

  // Load Cloudflare Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current && !widgetIdRef.current) {
        try {
          const id = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setTurnstileToken(token);
              setErrorMessage(null);
            },
            'error-callback': () => {
              console.warn('[Turnstile] Widget verification error');
            },
            'expired-callback': () => {
              setTurnstileToken('');
            },
            theme: 'light',
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.error('[Turnstile Render Error]:', e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const scriptId = 'cf-turnstile-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [siteKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!formData.name.trim()) {
      setErrorMessage('お名前を入力してください。');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('有効なメールアドレスを入力してください。');
      return;
    }
    if (!formData.subject.trim()) {
      setErrorMessage('件名を入力してください。');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      setErrorMessage('お問い合わせ内容を具体的に入力してください（5文字以上）。');
      return;
    }
    if (!formData.agreePrivacy) {
      setErrorMessage('個人情報の取り扱い（プライバシーポリシー）に同意いただく必要があります。');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '送信に失敗しました。');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || '送信処理中に問題が発生しました。');
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      category: 'SERVICE_USAGE',
      companyName: '',
      name: '',
      furigana: '',
      email: '',
      phone: '',
      preferredContact: 'EMAIL',
      subject: '',
      message: '',
      agreePrivacy: false,
      website_check: '',
    });
    setTurnstileToken('');
    setErrorMessage(null);
    setIsSuccess(false);
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  // SUCCESS THANK-YOU SCREEN
  if (isSuccess) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 sm:p-10 shadow-xs text-center">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200 dark:border-emerald-800/80">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          お問い合わせを受け付けました
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
          ご入力いただいたメールアドレス宛に、受付確認の自動返信メールを送信いたしました。<br />
          担当者にて内容を確認の上、通常1〜2営業日以内に折り返しご連絡いたします。
        </p>

        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-5 max-w-md mx-auto text-left text-xs space-y-2 border border-slate-100 dark:border-zinc-800 mb-8">
          <div><span className="text-slate-400 font-medium">お名前：</span><span className="text-slate-800 dark:text-slate-200 font-semibold">{formData.name} 様</span></div>
          <div><span className="text-slate-400 font-medium">メールアドレス：</span><span className="text-slate-800 dark:text-slate-200">{formData.email}</span></div>
          <div><span className="text-slate-400 font-medium">件名：</span><span className="text-slate-800 dark:text-slate-200">{formData.subject}</span></div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#1B4F8A] hover:bg-[#163e6c] text-white shadow-xs transition-colors"
          >
            ポータルトップへ戻る
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>別のお問い合わせを送信する</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Honeypot anti-bot input (Hidden from human users) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_check">Leave this field empty</label>
        <input
          type="text"
          id="website_check"
          name="website_check"
          value={formData.website_check}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* 1. Category */}
      <div>
        <label htmlFor="category" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          お問い合わせ種別 <span className="text-red-600 font-semibold">*必須</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] dark:focus:ring-blue-500"
        >
          <option value="SERVICE_USAGE">サービスのご利用・操作方法について</option>
          <option value="PROPERTY_DATA">物件掲載・データに関するお問い合わせ</option>
          <option value="AGENCY_PARTNER">不動産会社様・パートナー提携について</option>
          <option value="BUSINESS_PROPOSAL">広告掲載・取材・その他ビジネス連携</option>
          <option value="OTHER">その他のお問い合わせ</option>
        </select>
      </div>

      {/* 2. Company Name & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="companyName" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>貴社名・組織名</span>
            <span className="text-slate-400 font-normal">任意</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="例：株式会社〇〇不動産"
            className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>お名前</span>
            <span className="text-red-600 font-semibold">*必須</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="例：山田 太郎"
            className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
        </div>
      </div>

      {/* 3. Furigana & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="furigana" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>フリガナ</span>
            <span className="text-slate-400 font-normal">任意</span>
          </label>
          <input
            type="text"
            id="furigana"
            name="furigana"
            value={formData.furigana}
            onChange={handleChange}
            placeholder="例：ヤマダ タロウ"
            className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>メールアドレス</span>
            <span className="text-red-600 font-semibold">*必須</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="例：taro.yamada@example.co.jp"
            className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
        </div>
      </div>

      {/* 4. Phone & Preferred Contact Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>電話番号</span>
            <span className="text-slate-400 font-normal">任意</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="例：03-1234-5678"
            className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            希望連絡方法
          </label>
          <div className="flex items-center gap-5 mt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="preferredContact"
                value="EMAIL"
                checked={formData.preferredContact === 'EMAIL'}
                onChange={handleChange}
                className="w-4 h-4 text-[#1B4F8A] focus:ring-[#1B4F8A]"
              />
              <span>メール希望</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="preferredContact"
                value="PHONE"
                checked={formData.preferredContact === 'PHONE'}
                onChange={handleChange}
                className="w-4 h-4 text-[#1B4F8A] focus:ring-[#1B4F8A]"
              />
              <span>お電話希望</span>
            </label>
          </div>
        </div>
      </div>

      {/* 5. Subject */}
      <div>
        <label htmlFor="subject" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
          <span>件名</span>
          <span className="text-red-600 font-semibold">*必須</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          placeholder="例：競売物件の入札サポートについて"
          className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
        />
      </div>

      {/* 6. Message */}
      <div>
        <label htmlFor="message" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
          <span>お問い合わせ内容</span>
          <span className="text-red-600 font-semibold">*必須 (5文字以上)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          placeholder="ご質問やご相談内容を具体的にお書きください。"
          className="w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] leading-relaxed"
        />
      </div>

      {/* 7. Privacy Agreement */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreePrivacy"
            id="agreePrivacy"
            required
            checked={formData.agreePrivacy}
            onChange={handleChange}
            className="w-4 h-4 mt-0.5 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] shrink-0"
          />
          <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Link href="/privacy" target="_blank" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold hover:opacity-80">
              プライバシーポリシー (個人情報の取り扱い)
            </Link>
            をご確認いただき、同意の上で送信してください。
          </span>
        </label>
      </div>

      {/* 8. Cloudflare Turnstile Invisible / Managed Widget */}
      <div className="flex flex-col items-center justify-center pt-1">
        <div ref={turnstileContainerRef} className="my-1" />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cloudflare Turnstile による安全なスパム保護が適用されています</span>
        </div>
      </div>

      {/* 9. Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-lg text-sm font-bold text-white bg-[#1B4F8A] hover:bg-[#163e6c] disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>送信中...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span>上記の内容で送信する</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
