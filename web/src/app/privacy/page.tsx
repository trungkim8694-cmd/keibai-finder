import React from 'react';
import { Metadata } from 'next';
import LegalSubNav from '@/components/Legal/LegalSubNav';
import { Shield, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'プライバシーポリシー (Privacy Policy) | 株式会社ＴＱＣ',
  description: '株式会社ＴＱＣ（東京都知事免許 (01) 第107650号）が運営する「Keibai-Koubai Finder」のプライバシーポリシーです。個人情報の保護に関する法律（APPI）及び関連諸法令に基づき、個人情報の適切な取扱いと安全管理措置を定めています。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/privacy',
  },
  openGraph: {
    title: 'プライバシーポリシー (Privacy Policy) | 株式会社ＴＱＣ',
    description: 'Keibai-Koubai Finderの個人情報保護方針・プライバシーポリシー。',
    url: 'https://www.keibai-koubai.com/privacy',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: 'Keibai Finder プライバシーポリシー' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.keibai-koubai.com/privacy#webpage',
        url: 'https://www.keibai-koubai.com/privacy',
        name: 'プライバシーポリシー (Privacy Policy)',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: 'プライバシーポリシー', item: 'https://www.keibai-koubai.com/privacy' },
        ],
      },
    ],
  };

  const sections = [
    { id: 'privacy-1', title: '第1条（基本方針）' },
    { id: 'privacy-2', title: '第2条（取得する個人情報および収集方法）' },
    { id: 'privacy-3', title: '第3条（個人情報の利用目的）' },
    { id: 'privacy-4', title: '第4条（安全管理措置）' },
    { id: 'privacy-5', title: '第5条（個人情報の第三者提供）' },
    { id: 'privacy-6', title: '第6条（外部送信規律及びCookie等の利用）' },
    { id: 'privacy-7', title: '第7条（保有個人データの開示請求等の手続）' },
    { id: 'privacy-8', title: '第8条（事業者情報及びお問い合わせ窓口）' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* 1280px Standard PC Frame (max-w-7xl) */}
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Sub Navigation Tabs */}
        <LegalSubNav currentPageTitle="プライバシーポリシー" />

        {/* Header */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              <Lock className="w-3.5 h-3.5" />
              PRIVACY POLICY
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              個人情報取扱事業者：株式会社ＴＱＣ
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            プライバシーポリシー
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>制定日: 2023年4月1日</span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">最終改定日: 2026年4月1日</span>
          </div>
        </div>

        {/* 1280px Grid: 3 Cols Sticky TOC (Left) + 9 Cols Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Table of Contents (Sticky) */}
          <aside className="lg:col-span-3 hidden lg:block sticky top-20">
            <div className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-4 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                目次 (Table of Contents)
              </h2>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs py-1.5 px-2 rounded text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">個人情報管理窓口</p>
                <p>株式会社ＴＱＣ</p>
                <p>個人情報保護推進室</p>
                <p>info@keibai-koubai.com</p>
              </div>
            </div>
          </aside>

          {/* Main Privacy Content (9 Cols) */}
          <div className="lg:col-span-9 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-2xs">
            <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              
              <section id="privacy-1" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第1条（基本方針）
                </h2>
                <p>
                  株式会社ＴＱＣ（以下「当社」といいます。）は、提供するサービス「Keibai-Koubai Finder」（以下「本サービス」といいます。）におけるユーザーの個人情報の保護について、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）その他関連諸法令およびガイドラインを遵守し、適正な取扱いと安全管理の徹底に努めます。
                </p>
              </section>

              <section id="privacy-2" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第2条（取得する個人情報および収集方法）
                </h2>
                <p>当社は、本サービスの提供にあたり、以下の個人情報を適法かつ公正な手段によって取得します。</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs sm:text-sm">
                  <li><strong>会員登録情報：</strong>氏名、メールアドレス、Google等のソーシャルアカウントプロファイル情報</li>
                  <li><strong>決済関連情報：</strong>有料プラン利用時の決済履歴（クレジットカード情報は決済代行会社が直接管理し、当社サーバーでは保持いたしません）</li>
                  <li><strong>サービス利用ログ：</strong>物件の閲覧履歴、お気に入り登録履歴、検索条件、IPアドレス、ブラウザ種別、Cookie情報</li>
                  <li><strong>お問い合わせ情報：</strong>お問い合わせフォームに入力された会社名、氏名、電話番号、相談内容</li>
                </ul>
              </section>

              <section id="privacy-3" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第3条（個人情報の利用目的）
                </h2>
                <p>当社は、取得した個人情報を以下の目的のためにのみ利用し、本人の同意なく目的外の利用は行いません。</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs sm:text-sm">
                  <li>本サービスの提供、認証、およびマイページ機能（お気に入り保存等）の円滑な運営</li>
                  <li>有料プランの課金管理、適格請求書（インボイス）の発行および関連連絡</li>
                  <li>新着物件通知、新機能追加、市場レポート等のメール配信（希望者のみ）</li>
                  <li>不正利用の検知、利用規約違反行為への対応、およびシステムの安全性確保</li>
                  <li>ユーザーからのお問い合わせ・サポート対応および本人確認</li>
                  <li>統計的データへの加工（個人を特定できない形式での市場調査・AIモデル改善）</li>
                </ul>
              </section>

              <section id="privacy-4" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第4条（安全管理措置）
                </h2>
                <p>
                  当社は、取り扱う個人データの漏洩、滅失または毀損の防止その他の安全管理のため、個人情報保護法および関係諸規則に基づき、以下の4つの措置を講じています。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/80 dark:border-slate-700/80">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">① 組織的安全管理措置</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      個人データ保護責任者を設置し、取扱規程の策定および情報漏洩事案発生時の社内報告連絡体制を整備しています。
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/80 dark:border-slate-700/80">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">② 人的安全管理措置</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      従業者に対し秘密保持義務を義務付け、個人情報の適正管理に関する社内教育と定期的なコンプライアンス点検を実施しています。
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/80 dark:border-slate-700/80">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">③ 物理的安全管理措置</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      本社執務エリアの入退室管理を実施し、個人データを取り扱う電子機器および記録媒体の盗難・紛失防止措置を講じています。
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200/80 dark:border-slate-700/80">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">④ 技術的安全管理措置</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      通信は常時SSL/TLS（256-bit暗号化）により保護され、アクセス権限の最小化および外部からの不正アクセス防御（WAF）を実施しています。
                    </p>
                  </div>
                </div>
              </section>

              <section id="privacy-5" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第5条（個人情報の第三者提供）
                </h2>
                <p>
                  当社は、次に掲げる場合を除き、あらかじめユーザー本人の同意を得ることなく、個人情報を第三者に開示または提供いたしません。
                </p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs sm:text-sm">
                  <li>法令に基づく場合（裁判所の令状、警察・国税庁等からの法令に基づく照会等）</li>
                  <li>人の生命、身体または財産の保護のために必要があり、本人の同意を得ることが困難な場合</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                  <li>利用目的の達成に必要な範囲内において個人データの取扱いの全部または一部を外部委託する場合</li>
                </ul>
              </section>

              <section id="privacy-6" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第6条（外部送信規律及びCookie等の利用）
                </h2>
                <p>
                  当社は、サービスの利便性向上、トラフィック分析および不正防御のためCookieを使用しています。電気通信事業法第27条の12（外部送信規律）に基づき、当社が利用する主な外部ツールおよび送信情報は以下のとおりです。
                </p>

                <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded overflow-hidden text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2">
                    <div className="col-span-4">ツール名（送信先）</div>
                    <div className="col-span-4">送信される利用者情報</div>
                    <div className="col-span-4">利用目的</div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200">Google Analytics<br /><span className="text-[10px] text-slate-400 font-normal">（Google LLC）</span></div>
                      <div className="col-span-4 text-slate-600 dark:text-slate-400">閲覧ページURL、アクセス日時、端末情報、IPアドレス</div>
                      <div className="col-span-4 text-slate-600 dark:text-slate-400">アクセス解析およびサービス利用状況の統計分析</div>
                    </div>
                    <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200">Cloudflare<br /><span className="text-[10px] text-slate-400 font-normal">（Cloudflare, Inc.）</span></div>
                      <div className="col-span-4 text-slate-600 dark:text-slate-400">IPアドレス、HTTPヘッダー、リクエストログ</div>
                      <div className="col-span-4 text-slate-600 dark:text-slate-400">DDoS攻撃防御、コンテンツ配信高速化、不正アクセス検知</div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  ※ブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部機能（ログイン状態の維持等）が利用できなくなる場合があります。
                </p>
              </section>

              <section id="privacy-7" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第7条（保有個人データの開示請求等の手続）
                </h2>
                <p>
                  ユーザーは、当社が保有する自己の個人データについて、開示、訂正、追加、削除、利用停止または消去を請求することができます。
                </p>
                <p className="mt-2">
                  請求を希望される場合は、本人確認資料（運転免許証、健康保険証等の写し）を添付の上、下記のお問い合わせ窓口までメールにてご連絡ください。法令の定めに従い、遅滞なく適切に対応いたします。
                </p>
              </section>

              <section id="privacy-8" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第8条（事業者情報及びお問い合わせ窓口）
                </h2>
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 p-4 text-xs space-y-1.5 leading-relaxed">
                  <p><strong>個人情報取扱事業者：</strong>株式会社ＴＱＣ</p>
                  <p><strong>代表者：</strong>代表取締役 栗本 賢之</p>
                  <p><strong>宅建業免許：</strong>東京都知事 (01) 第107650号</p>
                  <p><strong>所在地：</strong>〒171-0022 東京都豊島区南池袋二丁目３３−６ 佐藤ビルディング３Ｆ</p>
                  <p><strong>代表電話：</strong>(03) 6907-1219（平日 09:30〜18:00）</p>
                  <p><strong>個人情報保護推進窓口：</strong><a href="mailto:info@keibai-koubai.com" className="text-[#1B4F8A] hover:underline font-semibold dark:text-blue-400">info@keibai-koubai.com</a></p>
                </div>
              </section>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
