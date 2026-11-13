import React from 'react';
import { Metadata } from 'next';
import LegalSubNav from '@/components/Legal/LegalSubNav';
import { FileText, ShieldAlert, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: '利用規約 (Terms of Service) | 株式会社ＴＱＣ',
  description: '株式会社ＴＱＣ（東京都知事免許 (01) 第107650号）が運営する「Keibai-Koubai Finder」の利用規約です。当サービスをご利用いただくにあたり遵守いただく条件および免責事項を定めています。',
};

export default function TermsPage() {
  const articles = [
    { id: 'article-1', title: '第1条（総則および適用範囲）' },
    { id: 'article-2', title: '第2条（定義）' },
    { id: 'article-3', title: '第3条（利用登録およびアカウント管理）' },
    { id: 'article-4', title: '第4条（提供データ及びAI分析に関する免責事項）' },
    { id: 'article-5', title: '第5条（有料プラン及び決済・解約）' },
    { id: 'article-6', title: '第6条（知的財産権及びスクレイピングの禁止）' },
    { id: 'article-7', title: '第7条（禁止事項）' },
    { id: 'article-8', title: '第8条（反社会的勢力の排除）' },
    { id: 'article-9', title: '第9条（サービスの中断・変更・終了）' },
    { id: 'article-10', title: '第10条（損害賠償の制限）' },
    { id: 'article-11', title: '第11条（準拠法および専属的合意管轄）' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* 1280px Standard PC Frame (max-w-7xl) */}
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Sub Navigation Tabs */}
        <LegalSubNav currentPageTitle="利用規約" />

        {/* Header */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
              <FileText className="w-3.5 h-3.5" />
              TERMS OF SERVICE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              運営：株式会社ＴＱＣ（東京都知事 (01) 第107650号）
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            利用規約
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
                {articles.map((art) => (
                  <a
                    key={art.id}
                    href={`#${art.id}`}
                    className="block text-xs py-1.5 px-2 rounded text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {art.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">運営事業者</p>
                <p>株式会社ＴＱＣ</p>
                <p>東京都知事免許 (01) 第107650号</p>
                <p>TEL: (03) 6907-1219</p>
              </div>
            </div>
          </aside>

          {/* Main Legal Content (9 Cols) */}
          <div className="lg:col-span-9 bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-2xs">
            <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              
              <section id="article-1" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第1条（総則および適用範囲）
                </h2>
                <p>
                  本利用規約（以下「本規約」といいます。）は、株式会社ＴＱＣ（東京都知事免許 (01) 第107650号、以下「当社」といいます。）が提供する不動産競売・公売情報検索プラットフォーム「Keibai-Koubai Finder」（以下「本サービス」といいます。）の利用条件を定めるものです。
                </p>
                <p className="mt-2">
                  本サービスを利用するすべての法人・個人（以下「ユーザー」といいます。）は、本規約の全条項に同意した上で本サービスを利用するものとします。
                </p>
              </section>

              <section id="article-2" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第2条（定義）
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                  <li><strong>「本サイト」</strong>：当社が運営するドメイン（keibai-koubai.com）およびその関連Webシステムを指します。</li>
                  <li><strong>「競売データ」</strong>：最高裁判所が公開する不動産競売物件情報サイト（BIT）の公開データに基づき当社が解析・加工した情報を指します。</li>
                  <li><strong>「公売データ」</strong>：国税庁および地方公共団体が公売情報として公開するデータに基づき当社が解析・加工した情報を指します。</li>
                  <li><strong>「AI査定・指標」</strong>：国土交通省の不動産取引価格情報および過去の落札統計データを元に当社独自のアルゴリズムが算出した想定価格・利回り等のシミュレーション結果を指します。</li>
                </ul>
              </section>

              <section id="article-3" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第3条（利用登録およびアカウント管理）
                </h2>
                <p>
                  ユーザーは、所定の手続きに従って会員登録を行うことができます。ソーシャルログイン（Googleアカウント等）を使用する場合、ユーザーは連携先アカウントの認証情報を自己の責任において厳重に管理するものとします。
                </p>
                <p className="mt-2">
                  アカウントが第三者によって不正に使用されたことにより生じた損害について、当社に故意または重過失がある場合を除き、当社は一切の責任を負いません。
                </p>
              </section>

              <section id="article-4" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第4条（提供データ及びAI分析に関する免責事項）
                </h2>
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-4 text-xs text-amber-900 dark:text-amber-200 mb-3 leading-relaxed">
                  <strong>【重要・免責告知】</strong> 本サービスは情報提供を目的とするものであり、特定の不動産の入札・購入を勧誘するもの、または特定利回り・落札成功を保証するものではありません。
                </div>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li>本サービス上の物件情報（売却基準価額、入札期間、現地写真、面積、権利関係等）は、裁判所および官公庁の発表資料を基に更新しておりますが、取り下げ・変更・誤記が生じる可能性があります。入札検討にあたっては、必ず管轄裁判所の閲覧室備付けの「物件明細書」「現況調査報告書」「評価書」（3点セット）または公売庁の公売広報現物を直接ご確認ください。</li>
                  <li>「想定市場相場」「市場比割安度」「AI予想NOI/表面利回り」等の試算値は、統計的確率計算に基づく機械的シミュレーションであり、将来の実際の収益、賃貸需要、リノベーション費用、落札結果を保証するものではありません。</li>
                  <li>ユーザーが本サービスの情報に基づいて行った投資・入札・契約等の行為により生じたいかなる損害（落札失敗、隠れた瑕疵、占有者立退き費用の発生等を含む）についても、当社は一切責任を負いかねます。最終的な投資判断は必ず自己の責任において行ってください。</li>
                </ul>
              </section>

              <section id="article-5" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第5条（有料プラン及び決済・解約）
                </h2>
                <p>
                  有料プランの利用料金、算定方法および支払期日は、本サイト上の料金案内ページに定めます。
                </p>
                <p className="mt-2">
                  特定商取引法に基づく表記の通り、デジタルコンテンツの性質上、決済完了後の返金・日割り計算による返金は原則としてお受けいたしかねます。解約手続きを完了した時点の請求期間満了をもって有料サービスは終了します。
                </p>
              </section>

              <section id="article-6" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第6条（知的財産権及びスクレイピングの禁止）
                </h2>
                <p>
                  本サービスを構成するテキスト、デザイン、プログラム、データベース、AI査定アルゴリズムに関する著作権・商標権その他の知的財産権は、すべて当社または正当な権利者に帰属します。
                </p>
                <p className="mt-2 font-semibold text-rose-700 dark:text-rose-400">
                  当社の事前の書面による承諾なく、自動化プログラム（クローラー、スクレイパー、ボット等）を用いて本サイトのデータを収集・複製・リバースエンジニアリングする行為、および二次配布・商用販売する行為を固く禁じます。
                </p>
              </section>

              <section id="article-7" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第7条（禁止事項）
                </h2>
                <p>ユーザーは、本サービスの利用にあたり以下の行為を行ってはなりません。</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs sm:text-sm">
                  <li>法令、公序良俗、または本規約に違反する行為</li>
                  <li>本サービスのサーバーやネットワーク機能に過度な負荷をかける行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーのアカウントを不正に利用する行為</li>
                  <li>その他、当社が不適切と合理的に判断する行為</li>
                </ul>
              </section>

              <section id="article-8" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第8条（反社会的勢力の排除）
                </h2>
                <p>
                  ユーザーおよび当社は、現在および将来にわたって、暴力団、暴力団員、暴力団関係企業・団体、総会屋その他これらに準ずる反社会的勢力に該当しないこと、および暴力的な要求行為や法的な責任を超えた不当な要求を行わないことを確約します。
                </p>
                <p className="mt-2">
                  相手方がこれに違反した場合、何らの催告を要せず直ちに本サービスの利用停止または契約解除を行うことができます。
                </p>
              </section>

              <section id="article-9" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第9条（サービスの中断・変更・終了）
                </h2>
                <p>
                  当社は、システムの定期保守、公的データ元のシステム仕様変更（BITや官公庁APIの変更等）、停電、天災地変等の不可抗力により、事前の予告なく本サービスの提供を一時的に中断または停止することがあります。
                </p>
              </section>

              <section id="article-10" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第10条（損害賠償の制限）
                </h2>
                <p>
                  当社がユーザーに対して損害賠償責任を負う場合であっても、当社の責任は、ユーザーに現実に生じた直接かつ通常の損害に限られ、逸失利益や間接損害については責任を負いません。また、その賠償額は、損害発生の直前1ヶ月間に当該ユーザーが当社に支払った利用料金の総額を上限とします。
                </p>
              </section>

              <section id="article-11" className="scroll-mt-24">
                <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  第11条（準拠法および専属的合意管轄）
                </h2>
                <p>
                  本規約の解釈および適用にあたっては、日本法を準拠法とします。本サービスまたは本規約に関して当社とユーザーとの間で生じた一切の紛争については、当社の本店所在地を管轄する<strong>東京地方裁判所</strong>を第一審の専属的合意管轄裁判所とします。
                </p>
              </section>

            </div>

            {/* Operator Signature */}
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">株式会社ＴＱＣ</p>
              <p>代表取締役　栗本 賢之</p>
              <p>宅地建物取引業者免許：東京都知事 (01) 第107650号</p>
              <p>〒171-0022 東京都豊島区南池袋二丁目３３−６ 佐藤ビルディング３Ｆ</p>
              <p>お問い合わせ窓口: info@keibai-koubai.com / TEL: (03) 6907-1219</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
