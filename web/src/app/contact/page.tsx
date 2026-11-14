import React from 'react';
import { Metadata } from 'next';
import LegalSubNav from '@/components/Legal/LegalSubNav';
import ContactForm from '@/components/Contact/ContactForm';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Award, 
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'お問い合わせ (Contact Us) | 株式会社ＴＱＣ',
  description: '競売物件・公売物件ポータル「Keibai-Koubai Finder」の公式お問い合わせ窓口です。サービスのご利用方法、物件掲載・データ照会、不動産会社様とのパートナー提携のご相談はこちらから承ります。運営：株式会社ＴＱＣ（東京都知事 (01) 第107650号）。',
  alternates: {
    canonical: 'https://keibai-koubai.com/contact',
  },
};

export default function ContactPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'お問い合わせ | 株式会社ＴＱＣ',
    url: 'https://keibai-koubai.com/contact',
    description: 'Keibai-Koubai Finder 公式お問い合わせフォーム及び連絡先案内',
    mainEntity: {
      '@type': 'RealEstateAgent',
      name: '株式会社ＴＱＣ',
      alternateName: 'TQC Co., Ltd.',
      telephone: '+81-3-6907-1219',
      faxNumber: '+81-3-6701-2399',
      email: 'info@keibai-koubai.com',
      url: 'https://keibai-koubai.com',
      address: {
        '@type': 'PostalAddress',
        postalCode: '171-0022',
        addressRegion: '東京都',
        addressLocality: '豊島区',
        streetAddress: '南池袋二丁目３３−６ 佐藤ビルディング３Ｆ',
        addressCountry: 'JP',
      },
      license: '東京都知事 (01) 第107650号',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:30',
          closes: '18:00',
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1280px Standard B2B Container */}
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Sub Navigation Tabs */}
        <LegalSubNav currentPageTitle="お問い合わせ" />

        {/* Page Header */}
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
              <Mail className="w-3.5 h-3.5" />
              CONTACT & INQUIRY
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              運営：株式会社ＴＱＣ（東京都知事 (01) 第107650号）
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            お問い合わせ・ご相談窓口
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Keibai-Koubai Finder のご利用に関するご質問、物件データの掲載・修正、宅建業者様とのパートナー連携など、お気軽にお問い合わせください。
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Corporate Information & Quick Assistance (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Direct Contact Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>お電話でのお問い合わせ</span>
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">代表電話番号</p>
                  <a
                    href="tel:0369071219"
                    className="text-xl sm:text-2xl font-extrabold text-[#1B4F8A] dark:text-blue-400 hover:underline tracking-tight block"
                  >
                    03-6907-1219
                  </a>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>受付時間: 平日 09:30 〜 18:00（土日祝日を除く）</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
                  <span>FAX番号</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">03-6701-2399</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 border-t border-slate-100 dark:border-zinc-800 pt-3">
                  <span>担当窓口</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">管理事務局 (Nguyễn Văn Biên)</span>
                </div>
              </div>
            </div>

            {/* 2. Official Corporate Profile & Licenses */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs text-xs space-y-3.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>運営会社情報 (Corporate Info)</span>
              </h2>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">事業者名:</span>
                  <span>株式会社ＴＱＣ (TQC Co., Ltd.)</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">代表者:</span>
                  <span>代表取締役 栗本 賢之 (Kurimoto Masayuki)</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">本社所在地:</span>
                  <span>〒171-0022 東京都豊島区南池袋二丁目３３−６ 佐藤ビルディング３Ｆ</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">宅建免許番号:</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                    東京都知事免許 (01) 第107650号
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">所属団体:</span>
                  <span>公益社団法人 全日本不動産協会 / 不動産保証協会 東京都本部</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">法人番号:</span>
                  <span>4-0133-0104-8678</span>
                </div>
              </div>
            </div>

            {/* 3. Legal Notice & Disclaimer */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-5 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>免責事項及びご留意点</span>
              </div>
              <p>
                当サイトは最高裁判所（BIT）及び国税庁の公示データを正規に集約・分析して提供するプラットフォームです。
              </p>
              <p>
                個別の競売物件に関する入札結果・占有者の詳細確認・法的手続きについては、各管轄裁判所または専門の弁護士・宅建士にご相談ください。
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>お問い合わせ入力フォーム</span>
                <span className="text-[11px] font-normal text-slate-400">（SSL暗号化通信対応）</span>
              </h2>
              <span className="text-xs text-slate-500">
                <span className="text-red-600 font-bold">*</span> は必須入力項目です
              </span>
            </div>

            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
