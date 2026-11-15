import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  TrendingDown, 
  LineChart, 
  ExternalLink, 
  AlertTriangle, 
  Droplets, 
  MountainSnow, 
  Waves, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Lock, 
  HelpCircle,
  FileCheck2,
  Building2,
  Database,
  Cpu
} from 'lucide-react';
import ExtensionSimulator from './ExtensionSimulator';

export const metadata = {
  title: 'Keibai Lens - 不動産価格・ハザードリスク即時照会 Chrome拡張機能',
  description: 'SUUMOやHOME\'Sなどの不動産ポータルサイト閲覧中に、国土交通省の公的取引相場・地価公示、および国土地理院のハザードマップ（浸水・土砂・津波）をワンクリックで自動照会する無料拡張機能。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/extension',
  },
  openGraph: {
    title: 'Keibai Lens - 不動産価格・ハザードリスク即時照会 Chrome拡張機能｜Keibai Finder',
    description: 'SUUMOやHOME\'S閲覧中にワンクリックで取引相場とハザードリスクを自動照会。',
    url: 'https://www.keibai-koubai.com/extension',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: 'Keibai Lens Chrome拡張機能' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export default function ExtensionLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Keibai Lens',
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Chrome',
        url: 'https://www.keibai-koubai.com/extension',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        publisher: { '@id': 'https://www.keibai-koubai.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: 'Keibai Lens 拡張機能', item: 'https://www.keibai-koubai.com/extension' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      
      {/* 1. Hero Section */}
      <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B22]">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="パンくずリスト" className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-sky-400 transition-colors">
              ホーム
            </Link>
            <span className="mx-1.5 text-slate-400">/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">Keibai Lens 拡張機能</span>
          </nav>

          {/* Trust Badges Header */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/30 dark:text-sky-300 border border-[#1B4F8A]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Keibai-Koubai 公式ブラウザ拡張機能
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Manifest V3 準拠
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              完全無料（登録不要）
            </span>
          </div>

          {/* Main Title & Value Proposition */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              ポータルサイトの物件閲覧中に、<br />
              <span className="text-[#1B4F8A] dark:text-sky-400">公的相場</span> と <span className="text-rose-700 dark:text-rose-400">災害リスク</span> を瞬時に可視化。
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              SUUMO・HOME&apos;S・楽待・健美家などの掲載住所を選択するだけ。国土交通省の不動産取引データと国土地理院のハザード情報を1秒で自動照会し、客観的な投資判断を支援します。
            </p>
          </div>

          {/* Call to Action with Official Google Chrome Vector */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://chromewebstore.google.com/detail/keibai-lens/fobbbhkcbfpkcmppcplkmjhbpgndpkhj" 
              target="_blank" 
              rel="noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              {/* Official Google Chrome Vector Icon */}
              <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.73C20.675 2.628 16.657 0 12 0zm-8.89 6.273A11.944 11.944 0 0 0 0 12c0 5.474 3.668 10.093 8.653 11.53l3.953-6.848a5.454 5.454 0 0 1-5.696-2.88L3.11 6.273zM12 17.455a5.437 5.437 0 0 1-4.2-1.975l-3.953 6.848C6.012 23.473 8.877 24 12 24c6.627 0 12-5.373 12-12 0-.693-.059-1.372-.172-2.032H12v7.487z"/>
              </svg>
              <span>Chrome に追加（無料）</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            
            <a 
              href="#interactive-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
            >
              <span>機能デモを体験する</span>
            </a>
          </div>

          {/* Quantitative Metrics Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">公的オープンデータ連携</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">1.2秒</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">平均解析応答速度</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">0円</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">完全無料・広告表示なし</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">全国47</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">都道府県の災害マップ対応</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Extension Simulator (Demo) */}
      <section id="interactive-demo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#1B4F8A] dark:text-sky-400">
            動作シミュレーション
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            実際の画面で体験するKeibai Lensの動作
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            物件所在地を選択するだけで、公的実勢相場、災害リスク、周辺競売案件を瞬時に診断します。下のタブをクリックして診断内容をお試しください。
          </p>
        </div>

        {/* Client Interactive Simulator Component */}
        <ExtensionSimulator />
      </section>

      {/* 3. 3-Step Setup Guide */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#151B22]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-xs font-semibold tracking-wider text-[#1B4F8A] dark:text-sky-400">かんたん3ステップ導入</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">わずか3ステップで導入完了</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">会員登録や複雑な初期設定は不要。1分で準備が整います。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="b2b-card p-6 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Chrome に追加</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Chrome ウェブストアの「Chromeに追加」をクリックするだけで、ブラウザに安全にインストールされます。
              </p>
            </div>

            <div className="b2b-card p-6 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">ツールバーにピン留め</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ブラウザ右上の拡張機能アイコンからピン留めを行うと、ポータルサイト閲覧時にいつでも1クリックで起動できます。
              </p>
            </div>

            <div className="b2b-card p-6 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">住所を選択して即時照会</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ポータルサイト上の住所をドラッグ選択してアイコンをクリック、または右クリックメニューから即時に自動診断されます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Supported Portals & Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xs font-semibold tracking-wider text-[#1B4F8A] dark:text-sky-400">対応ポータル &amp; 業務効率化</h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">国内主要ポータルサイトに対応</p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">日常的に利用する大手不動産ポータル上で、シームレスに機能します。</p>
        </div>

        {/* Portal Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {[
            'SUUMO（スーモ）', 
            'LIFULL HOME\'S', 
            '楽待（Rakumachi）', 
            '健美家（Kenbiya）', 
            'アットホーム（at home）', 
            'Yahoo!不動産', 
            'BIT 裁判所競売情報',
            '国税庁 公売情報'
          ].map((portal) => (
            <span key={portal} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
              {portal}
            </span>
          ))}
        </div>

        {/* Comparison Table & Mobile Stacked Cards */}
        <div className="b2b-card overflow-hidden bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400" />
              従来の調査フローとの比較
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">作業効率 約90% 削減</span>
          </div>

          {/* Desktop Table: hidden on < md */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">調査項目</th>
                  <th className="p-3.5 font-semibold">一般的な手動調査（複数サイト検索）</th>
                  <th className="p-3.5 font-semibold text-[#1B4F8A] dark:text-sky-400 bg-blue-50/40 dark:bg-blue-950/20">Keibai Lens 拡張機能</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-3.5 font-medium">所要時間</td>
                  <td className="p-3.5 text-slate-500">1件あたり約15〜20分（各省庁・自治体サイトを往復）</td>
                  <td className="p-3.5 font-bold text-[#1B4F8A] dark:text-sky-400 bg-blue-50/40 dark:bg-blue-950/20 tabular-nums">約1.2秒（1クリックで画面上に即時集約）</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">ハザードリスク判定</td>
                  <td className="p-3.5 text-slate-500">自治体PDFや国土地理院サイトを個別に開き住所検索</td>
                  <td className="p-3.5 font-bold text-[#1B4F8A] dark:text-sky-400 bg-blue-50/40 dark:bg-blue-950/20">洪水・土砂・津波を重層一括判定</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">公的実勢相場</td>
                  <td className="p-3.5 text-slate-500">土地総合情報システムで地区・条件を再指定して照会</td>
                  <td className="p-3.5 font-bold text-[#1B4F8A] dark:text-sky-400 bg-blue-50/40 dark:bg-blue-950/20">国土交通省APIから成約坪単価・推移を自動算出</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">周辺競売・公売案件</td>
                  <td className="p-3.5 text-slate-500">裁判所BITサイトで事件番号や所在地を再検索</td>
                  <td className="p-3.5 font-bold text-[#1B4F8A] dark:text-sky-400 bg-blue-50/40 dark:bg-blue-950/20">半径圏内の割安物件（相場比-20〜40%）を即時通知</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium">利用コスト</td>
                  <td className="p-3.5 text-slate-500">有料調査ツール（月額1万〜3万円程度）</td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/40 dark:bg-blue-950/20">完全無料（オープンデータ活用による無償提供）</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards: md:hidden */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {[
              {
                item: '所要時間',
                manual: '1件あたり約15〜20分（各省庁・自治体サイトを往復）',
                lens: '約1.2秒（1クリックで画面上に即時集約）',
                lensColor: 'text-[#1B4F8A] dark:text-sky-400 font-bold',
              },
              {
                item: 'ハザードリスク判定',
                manual: '自治体PDFや国土地理院サイトを個別に開き住所検索',
                lens: '洪水・土砂・津波を重層一括判定',
                lensColor: 'text-[#1B4F8A] dark:text-sky-400 font-bold',
              },
              {
                item: '公的実勢相場',
                manual: '土地総合情報システムで地区・条件を再指定して照会',
                lens: '国土交通省APIから成約坪単価・推移を自動算出',
                lensColor: 'text-[#1B4F8A] dark:text-sky-400 font-bold',
              },
              {
                item: '周辺競売・公売案件',
                manual: '裁判所BITサイトで事件番号や所在地を再検索',
                lens: '半径圏内の割安物件（相場比-20〜40%）を即時通知',
                lensColor: 'text-[#1B4F8A] dark:text-sky-400 font-bold',
              },
              {
                item: '利用コスト',
                manual: '有料調査ツール（月額1万〜3万円程度）',
                lens: '完全無料（オープンデータ活用による無償提供）',
                lensColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
              },
            ].map((row, idx) => (
              <div key={idx} className="p-4 space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">{row.item}</div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">一般的な手動調査</span>
                  <span className="text-slate-600 dark:text-slate-400">{row.manual}</span>
                </div>
                <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] text-[#1B4F8A] dark:text-sky-400 block font-semibold">Keibai Lens 拡張機能</span>
                  <span className={row.lensColor}>{row.lens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Permission Transparency & Security (APPI & Chrome Store) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#151B22]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-semibold tracking-wider text-[#1B4F8A] dark:text-sky-400">セキュリティと透明性</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">個人情報保護と権限の透明性</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              当拡張機能は、ユーザーのプライバシーを最優先に設計されています。個人情報保護法（APPI）およびChrome Web Storeポリシーを厳格に遵守します。
            </p>
          </div>

          <div className="b2b-card p-6 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100">閲覧履歴・パスワードの収集なし</div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    アクセスしたウェブサイトの履歴や入力フォーム情報を収集・蓄積することは一切ありません。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100">ユーザー操作時のみ作動</div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    ユーザーがテキストを選択して拡張機能を起動した時点でのみ、住所文字列の解析リクエストを発行します。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link 
                href="/extension/privacy" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-sky-400 hover:underline"
              >
                詳細なプライバシーポリシー（個人情報保護方針・権限利用明細）を確認する
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xs font-semibold tracking-wider text-[#1B4F8A] dark:text-sky-400">よくあるご質問</h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">よくあるご質問（FAQ）</p>
        </div>

        <div className="space-y-3.5">
          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              利用料金は本当に完全無料ですか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              はい、Keibai Lens拡張機能は完全無料で提供しております。アカウント登録やクレジットカードの入力も不要で、インストール後すぐにご利用いただけます。
            </p>
          </div>

          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              データはどの公的機関から取得していますか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              国土交通省（不動産情報ライブラリ・土地総合情報システム）、国土地理院（重ねるハザードマップ）、最高裁判所競売物件情報（BIT）の公式APIおよび公開オープンデータを基に算出しております。
            </p>
          </div>

          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              ブラウザの動作が重くなることはありませんか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              Manifest V3の最新仕様に完全準拠しており、常駐型の重いバックグラウンドプロセスは排除しています。ユーザーがクリックした時のみ軽量スクリプトが作動するため、ブラウザの速度に影響を与えません。
            </p>
          </div>

          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              住所が丁目や番地まで詳しく書かれていない物件でも分析できますか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              市区町村・町名単位でも分析可能です。ただし、浸水想定や土砂警戒区域は境界線が厳密に定められているため、より詳細な番地・号が記載されているほど精度の高い判定結果が表示されます。
            </p>
          </div>

          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              社内のセキュリティ規程に抵触しませんか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              本拡張機能は閲覧履歴やCookie、認証情報の読み取り権限を持たず、Googleの厳格な審査を通過してChrome Web Storeに公式掲載されています。法人PCへの導入実績もございます。
            </p>
          </div>

          <div className="b2b-card p-5 bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-sky-400 shrink-0" />
              アンインストール（削除）は簡単にできますか？
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
              はい、いつでもChrome右上の拡張機能アイコンを右クリックし、「Chromeから削除」を選択するだけで即座に完全に削除されます。
            </p>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-[#1B4F8A]/5 dark:bg-[#151B22]">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            不動産ポータルの閲覧を、より確実で安全に。
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            1クリックで公的相場とハザードリスクを照合。今すぐ無料でお使いのGoogle Chromeに追加できます。
          </p>
          <div className="pt-2">
            <a 
              href="https://chromewebstore.google.com/detail/keibai-lens/fobbbhkcbfpkcmppcplkmjhbpgndpkhj" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.73C20.675 2.628 16.657 0 12 0zm-8.89 6.273A11.944 11.944 0 0 0 0 12c0 5.474 3.668 10.093 8.653 11.53l3.953-6.848a5.454 5.454 0 0 1-5.696-2.88L3.11 6.273zM12 17.455a5.437 5.437 0 0 1-4.2-1.975l-3.953 6.848C6.012 23.473 8.877 24 12 24c6.627 0 12-5.373 12-12 0-.693-.059-1.372-.172-2.032H12v7.487z"/>
              </svg>
              <span>Chrome に追加する（完全無料）</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>© 2026 Keibai Finder / Keibai-Koubai. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/extension/privacy" className="hover:underline text-[#1B4F8A] dark:text-sky-400">
              プライバシーポリシー（拡張機能）
            </Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link href="/terms" className="hover:underline text-[#1B4F8A] dark:text-sky-400">
              利用規約
            </Link>
            <span className="hidden sm:inline text-slate-400">•</span>
            <Link href="/" className="hover:underline text-[#1B4F8A] dark:text-sky-400">
              Keibai Finder トップへ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
