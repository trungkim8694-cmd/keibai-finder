import React from 'react';
import { Metadata } from 'next';
import LegalSubNav from '@/components/Legal/LegalSubNav';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Award, 
  Landmark, 
  Scale, 
  FileCheck2,
  CheckCircle2,
  Newspaper
} from 'lucide-react';

export const metadata: Metadata = {
  title: '運営会社概要 (Company Profile) | 株式会社ＴＱＣ',
  description: '東京都知事免許 (01) 第107650号。競売物件・公売物件の一括検索およびAI投資分析プラットフォーム「Keibai-Koubai Finder」を運営する株式会社ＴＱＣの公式企業概要ページです。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/company',
  },
  openGraph: {
    title: '運営会社概要 (Company Profile) | 株式会社ＴＱＣ',
    description: '東京都知事免許 (01) 第107650号。競売物件・公売物件の一括検索ポータル「Keibai Finder」運営会社情報。',
    url: 'https://www.keibai-koubai.com/company',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '株式会社ＴＱＣ 会社概要' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export default function CompanyProfilePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: '株式会社ＴＱＣ',
    alternateName: 'TQC Co., Ltd.',
    url: 'https://www.keibai-koubai.com',
    logo: 'https://www.keibai-koubai.com/icon.png',
    telephone: '+81-3-6907-1219',
    faxNumber: '+81-3-6701-2399',
    email: 'info@keibai-koubai.com',
    founder: {
      '@type': 'Person',
      name: '栗本 賢之',
      jobTitle: '代表取締役',
    },
    foundingDate: '2022-02-09',
    taxID: '4013301048678',
    vatID: 'T4013301048678',
    license: '東京都知事 (01) 第107650号',
    address: {
      '@type': 'PostalAddress',
      postalCode: '171-0022',
      addressRegion: '東京都',
      addressLocality: '豊島区',
      streetAddress: '南池袋二丁目３３−６ 佐藤ビルディング３Ｆ',
      addressCountry: 'JP',
    },
    memberOf: [
      {
        '@type': 'Organization',
        name: '公益社団法人 全日本不動産協会 東京都本部',
      },
      {
        '@type': 'Organization',
        name: '公益社団法人 不動産保証協会 東京都本部',
      },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:30',
        closes: '18:00',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* 1280px Standard PC Frame (max-w-7xl) */}
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Sub Navigation Tabs */}
        <LegalSubNav currentPageTitle="会社概要" />

        {/* Hero Section */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
              <Building2 className="w-3.5 h-3.5" />
              CORPORATE PROFILE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              <Award className="w-3.5 h-3.5" />
              宅地建物取引業者 東京都知事 (01) 第107650号
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 tabular-nums">
              法人番号: 4-0133-0104-8678
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            株式会社ＴＱＣ 会社概要
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
            東京都知事免許の正規宅地建物取引業者として、不動産競売・公売DXデータプラットフォーム「Keibai-Koubai Finder」の企画・開発・運営および、AI価格査定インテリジェンスを提供しています。
          </p>
        </div>

        {/* 4 Trust Metric Cards (High-Density B2B Strip) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>宅建業免許</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              東京都知事 (01) 第107650号
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              東京都 住宅政策本部 届出済
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Landmark className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>資本金</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              20,550,000円
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              払込済資本（発行済株式数 2,055株）
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>設立年月日</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              2022年2月9日
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              令和4年2月設立（第5期）
            </div>
          </div>

          <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>適格請求書（インボイス）</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              T4013301048678
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              国税庁公表サイト登録済
            </div>
          </div>
        </div>

        {/* 1280px Layout Grid: 8 Cols Table (Left) + 4 Cols Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Official Corporate Definition Table (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>会社基本情報</span>
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  2026年10月 法務局登記完了時点
                </span>
              </div>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {/* 商号 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">商号（会社名）</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-bold">
                    株式会社ＴＱＣ <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">(英文表記: TQC Co., Ltd.)</span>
                  </dd>
                </div>

                {/* 代表者 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">代表者</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium">
                    代表取締役　<span className="font-bold text-base text-slate-900 dark:text-white">栗本 賢之</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-normal">(クリモト マサユキ)</span>
                  </dd>
                </div>

                {/* 設立年月日 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">設立年月日</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium tabular-nums">
                    2022年2月9日（令和4年2月9日）
                  </dd>
                </div>

                {/* 資本金 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">資本金</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium tabular-nums">
                    20,550,000円
                  </dd>
                </div>

                {/* 宅地建物取引業者免許 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors bg-emerald-50/30 dark:bg-emerald-950/10">
                  <dt className="font-semibold text-emerald-800 dark:text-emerald-300">宅建業免許証番号</dt>
                  <dd className="sm:col-span-2 text-emerald-900 dark:text-emerald-200 font-bold tabular-nums">
                    東京都知事 (01) 第107650号
                  </dd>
                </div>

                {/* 所属団体 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">所属団体・保証協会</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 space-y-1 text-xs sm:text-sm">
                    <p>• 公益社団法人 全日本不動産協会 東京都本部</p>
                    <p>• 公益社団法人 不動産保証協会 東京都本部</p>
                  </dd>
                </div>

                {/* 法人番号 & インボイス */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">法人番号 / インボイス</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm tabular-nums space-y-1">
                    <div>法人番号: <span className="font-semibold">4-0133-0104-8678</span> <span className="text-[11px] text-slate-500 font-sans ml-1">(東京法務局登記)</span></div>
                    <div>適格請求書登録番号: <span className="font-semibold">T4013301048678</span></div>
                  </dd>
                </div>

                {/* 本社所在地 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">本社所在地</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                    〒171-0022<br />
                    東京都豊島区南池袋二丁目３３−６ 佐藤ビルディング３Ｆ
                  </dd>
                </div>

                {/* 最寄り駅・アクセス */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">交通アクセス</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed space-y-1">
                    <p>• JR線（山手線・埼京線・湘南新宿ライン）、東武線、西武線、東京メトロ「池袋駅」東口 徒歩5分</p>
                    <p>• 東京メトロ有楽町線「東池袋駅」1番出口 徒歩3分</p>
                  </dd>
                </div>

                {/* 代表電話・FAX */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">代表電話 / FAX</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono text-sm tabular-nums space-y-1">
                    <div>TEL: <span className="font-semibold">(03) 6907-1219</span></div>
                    <div>FAX: <span className="font-semibold">(03) 6701-2399</span></div>
                  </dd>
                </div>

                {/* メールアドレス */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">公式メールアドレス</dt>
                  <dd className="sm:col-span-2">
                    <a 
                      href="mailto:info@keibai-koubai.com" 
                      className="text-[#1B4F8A] hover:underline dark:text-blue-400 font-semibold inline-flex items-center gap-1"
                    >
                      info@keibai-koubai.com
                    </a>
                  </dd>
                </div>

                {/* 営業時間 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">営業時間・定休日</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 font-medium tabular-nums">
                    平日 09:30 〜 18:00（土日祝日・年末年始休業）
                  </dd>
                </div>

                {/* 事業内容 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">事業内容</dt>
                  <dd className="sm:col-span-2 text-slate-900 dark:text-slate-100 leading-relaxed text-xs sm:text-sm space-y-2">
                    <p>1. <strong>宅地建物取引業</strong>（不動産の売買、仲介、賃貸管理および投資コンサルティング業務 / 東京都知事 (01) 第107650号）</p>
                    <p>2. 不動産競売・公売DX情報検索プラットフォーム「Keibai-Koubai Finder」の企画・開発・運営</p>
                    <p>3. 国土交通省実成約ビッグデータ、裁判所競売（BIT）および国税庁公売データの機械学習解析・AI価格査定エンジンの開発</p>
                    <p>4. 宅建事業者・金融機関・不動産投資ファンド向け市場動向分析レポートおよびAPIソリューションの提供</p>
                  </dd>
                </div>

                {/* 顧問税理士 & 所轄官庁 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <dt className="font-semibold text-slate-600 dark:text-slate-400">税理士 / 所轄官庁</dt>
                  <dd className="sm:col-span-2 text-slate-700 dark:text-slate-300 text-xs leading-relaxed space-y-1">
                    <p>• <strong>顧問税理士：</strong>石渡 正雄 税理士事務所（東京都豊島区西池袋）</p>
                    <p>• <strong>所轄税務署：</strong>豊島税務署 / <strong>都税：</strong>東京都豊島都税事務所</p>
                    <p>• <strong>管轄法務局：</strong>東京法務局 豊島出張所</p>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Press Releases & Media Coverage */}
            <div
              id="press-releases"
              className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs"
            >
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>プレスリリース・メディア掲載</span>
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Press &amp; Media
                </span>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                <li className="px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="tabular-nums">2026年11月16日</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-medium text-[11px]">
                      Zero-Press
                    </span>
                  </div>
                  <a
                    href="https://zero-press.net/p/r-mwj77b4vvqtf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-semibold hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:underline"
                  >
                    <span>全国の不動産競売・公売物件を一括検索・AI分析するプラットフォーム「Keibai-koubai」に関するプレスリリース</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  </a>
                </li>

                <li className="px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="tabular-nums">2026年11月</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium text-[11px]">
                      PRESSNOW
                    </span>
                  </div>
                  {/* Replace href with the exact PRESSNOW article URL once approved */}
                  <a
                    href="https://pressnow.jp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-semibold hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:underline"
                  >
                    <span>無料プレスリリース配信サイト「PRESSNOW（プレスナウ）」掲載情報</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Mission, Map & Credentials Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Corporate Mission Card */}
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>企業理念 (MISSION)</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                「テクノロジーとデータ解析の力で、不動産競売・公売市場の透明性を高め、健全な流通と投資機会を創出する」
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                株式会社ＴＱＣは、正規の宅地建物取引業者としての知見と、最先端の機械学習エンジニアリングを融合させ、不動産競売・公売市場の情報の非対称性を解消します。
              </p>
            </div>

            {/* License & Zennichi Trust Badge */}
            <div className="bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-blue-950/20 dark:to-[#151B22] border border-blue-200/80 dark:border-blue-900/40 rounded-lg p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B4F8A] dark:text-blue-300 mb-2">
                <Award className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>宅地建物取引業者 免許保証</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                東京都知事免許 (01) 第107650号
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>公益社団法人 全日本不動産協会 会員</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>公益社団法人 不動産保証協会 会員</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>弁済業務保証金分担金 納付済</span>
                </li>
              </ul>
            </div>

            {/* Access Map Card */}
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>本社アクセスマップ</span>
                </h3>
                <a
                  href="https://maps.google.com/?q=東京都豊島区南池袋２丁目３３−６+佐藤ビルディング"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#1B4F8A] hover:underline dark:text-blue-400 inline-flex items-center gap-1 font-medium"
                >
                  <span>Google マップ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <iframe
                  title="株式会社ＴＱＣ 本社アクセスマップ"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://maps.google.com/maps?q=東京都豊島区南池袋2-33-6+佐藤ビル&t=&z=16&ie=UTF8&iwloc=&output=embed"
                />
              </div>
              <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                〒171-0022 東京都豊島区南池袋二丁目３３−６ 佐藤ビルディング３Ｆ<br />
                ※ご来社の際は事前に担当窓口までご連絡をお願い申し上げます。
              </p>
            </div>

            {/* Contact & Hours Card */}
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-5 shadow-2xs text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                <Phone className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>お問い合わせ・連絡窓口</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                お電話でのお問い合わせ：<br />
                <span className="font-bold text-sm text-slate-900 dark:text-white font-mono tabular-nums">(03) 6907-1219</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                メールでのお問い合わせ：<br />
                <a href="mailto:info@keibai-koubai.com" className="font-semibold text-[#1B4F8A] hover:underline dark:text-blue-400">
                  info@keibai-koubai.com
                </a>
              </p>
              <p className="text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                受付時間：平日 09:30 〜 18:00（土日祝日除く）
              </p>
            </div>

          </div>
        </div>

        {/* Footer Legal Note */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-8 mt-10 border-t border-slate-200 dark:border-slate-800">
          <p>© TQC Co., Ltd. All rights reserved.</p>
          <p>株式会社ＴＱＣは、東京都知事免許 (01) 第107650号の宅地建物取引業者であり、宅地建物取引業法、民事執行法、国税徴収法および個人情報保護法を厳格に遵守してサービスを運営しています。</p>
        </div>
      </div>
    </div>
  );
}
