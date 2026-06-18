import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Phone, Mail, FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '運営会社概要 (Company Profile) | Keibai Finder',
  description: '競売物件・公売物件の一括検索サイト「Keibai Finder」を運営するTQC株式会社の会社概要ページです。',
};

export default function CompanyProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 group">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          ホームに戻る
        </Link>

        {/* Header Section */}
        <div className="space-y-4 text-center sm:text-left mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            運営会社概要
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium">
            Company Profile of TQC Corporation
          </p>
        </div>

        {/* Company Info Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 flex items-center gap-3 text-zinc-400 dark:text-zinc-600 font-bold text-sm uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>会社名</span>
            </div>
            <div className="md:col-span-8 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
              TQC株式会社 (TQC Corporation)
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 flex items-center gap-3 text-zinc-400 dark:text-zinc-600 font-bold text-sm uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>所在地</span>
            </div>
            <div className="md:col-span-8 text-zinc-900 dark:text-zinc-100 text-base leading-relaxed">
              〒171-0022<br/>
              東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 flex items-center gap-3 text-zinc-400 dark:text-zinc-600 font-bold text-sm uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>代表連絡先</span>
            </div>
            <div className="md:col-span-8 text-zinc-900 dark:text-zinc-100 text-base space-y-1">
              <div>TEL: <span className="font-semibold">(03) 6907-1219</span></div>
              <div>FAX: <span className="font-semibold">(03) 6701-2399</span></div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 flex items-center gap-3 text-zinc-400 dark:text-zinc-600 font-bold text-sm uppercase tracking-wider">
              <Mail className="w-4 h-4 text-violet-500" />
              <span>メールアドレス</span>
            </div>
            <div className="md:col-span-8 text-zinc-900 dark:text-zinc-100 text-base font-semibold">
              <a href="mailto:info@keibai-koubai.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                info@keibai-koubai.com
              </a>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 flex items-center gap-3 text-zinc-400 dark:text-zinc-600 font-bold text-sm uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>事業内容</span>
            </div>
            <div className="md:col-span-8 text-zinc-900 dark:text-zinc-100 text-base leading-relaxed space-y-2">
              <p>1. 不動産情報の収集、解析および検索プラットフォーム「Keibai Finder」の運営開発</p>
              <p>2. 不動産取引・競売価格データを用いたAI査定・機械学習エンジンの開発</p>
              <p>3. 不動産市場に関する各種 analysis レポートおよびWEBメディアの提供</p>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[12px] text-zinc-400 dark:text-zinc-600 space-y-1">
          <p>© TQC Corporation. All rights reserved.</p>
          <p>当サイトは日本国内の法令およびガイドラインに準拠して運営されております。</p>
        </div>

      </div>
    </div>
  );
}
