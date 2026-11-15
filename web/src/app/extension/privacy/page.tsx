import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'プライバシーポリシー (Privacy Policy) - Keibai Lens 拡張機能',
  description: 'Keibai Lens Chrome拡張機能における個人情報の保護方針、パーミッション（権限）の利用目的、およびデータ取扱基準に関する公式ポリシー。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/extension/privacy',
  },
  openGraph: {
    title: 'プライバシーポリシー (Privacy Policy) - Keibai Lens 拡張機能',
    description: 'Keibai Lens Chrome拡張機能における個人情報保護方針・権限利用目的。',
    url: 'https://www.keibai-koubai.com/extension/privacy',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
  },
};

export default function ExtensionPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/extension" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-sky-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Keibai Lens 拡張機能トップに戻る
          </Link>
        </div>

        {/* Content Card Container */}
        <article className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-sky-950 dark:text-sky-300 border border-[#1B4F8A]/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> APPI / 個人情報保護法準拠
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Keibai Lens 拡張機能 プライバシーポリシー
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>最終改定日：2026年4月1日</span>
              <span>•</span>
              <span>対象プロダクト：Keibai Lens (Chrome Extension)</span>
              <span>•</span>
              <span>運営元：Keibai Finder 運営事務局</span>
            </div>
          </div>

          {/* Section: 前文 */}
          <section className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Keibai Finder（以下「当サービス」）は、Google Chrome向けブラウザ拡張機能「Keibai Lens」（以下「本拡張機能」）をご利用いただく皆様のプライバシーを尊重し、日本の「個人情報の保護に関する法律（APPI）」およびGoogle Chrome ウェブストアのデベロッパー利用規約（User Data Policy）を遵守し、以下の方針に基づき安全かつ適切に取り扱います。
            </p>
          </section>

          {/* Section 1: 収集する情報と収集しない情報 */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-l-3 border-[#1B4F8A] pl-3">
              1. 収集する情報および非収集の厳格な方針
            </h2>
            
            <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                個人を特定可能な情報（PII）の非収集宣言
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                本拡張機能は、ユーザーの氏名、メールアドレス、パスワード、クレジットカード情報、閲覧履歴（URL・訪問ログ）、入力フォームデータ、Cookieなどの個人情報を収集、保存、または第三者へ送信することは一切ございません。
              </p>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <p>本拡張機能が処理するデータは以下の「住所文字列」に限定されます：</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">ユーザーが選択した住所テキスト：</strong>ユーザーがブラウザ上で明示的に選択（ハイライト）し、本拡張機能を起動した時点でのみ、公的API（国土地理院・国土交通省）へ住所座標およびハザード情報を照会するために一時的に処理されます。
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">匿名化された操作ログ：</strong>システムの応答速度改善およびエラー検知を目的として、個人情報やIPアドレスを含まない匿名集計データ（例：スキャン実行イベントの発生有無、選択言語）のみを取得する場合があります。
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: 権限（Permissions）の利用目的明細 */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-l-3 border-[#1B4F8A] pl-3">
              2. 要求するブラウザ権限（Permissions）と正当な利用目的
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              本拡張機能が要求する権限は、機能の実行に必要な最小限度（Minimum Necessary Permissions）に厳格に限定されています。
            </p>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold w-1/4">要求権限</th>
                    <th className="p-3 font-semibold">具体的な利用目的</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#1B4F8A] dark:text-sky-400">activeTab</td>
                    <td className="p-3 leading-relaxed">ユーザーが現在閲覧しているアクティブなタブにおいて、ハイライト選択された住所テキストを取得し、検索バーへ自動補完するためだけに使用されます。</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#1B4F8A] dark:text-sky-400">contextMenus</td>
                    <td className="p-3 leading-relaxed">テキスト選択時に右クリックメニューから「Keibai Lens で住所を分析」をワンクリックで呼び出すためのショートカット機能に使用されます。</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#1B4F8A] dark:text-sky-400">storage</td>
                    <td className="p-3 leading-relaxed">ユーザーの表示言語設定（日本語、英語、ベトナム語、中国語）をブラウザのローカル端末上に保存し、次回起動時に復元するために使用されます。</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#1B4F8A] dark:text-sky-400">scripting</td>
                    <td className="p-3 leading-relaxed">不動産ポータルサイトのDOM構造から正確に選択テキストを抽出するための軽量スクリプトを実行するために使用されます。</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-[#1B4F8A] dark:text-sky-400">host_permissions (&lt;all_urls&gt;)</td>
                    <td className="p-3 leading-relaxed">国内の各種不動産ポータルサイト（SUUMO、HOME&apos;S、楽待、健美家、自治体公売サイト等）において、掲載住所の選択テキストを取得し、分析サーバー（SSL/TLS暗号化）へ安全に照会するために使用されます。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: データの利用目的 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-l-3 border-[#1B4F8A] pl-3">
              3. データの利用目的
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              <p>本拡張機能が取り扱う住所情報は、以下の目的でのみ一時的に利用されます：</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>国土地理院アドレス・サーチAPIを用いた経度・緯度のジオコーディング処理</li>
                <li>国土交通省APIとの連携による該当地域の不動産実勢取引相場および地価公示情報の取得</li>
                <li>国土地理院オープンデータに基づく洪水・土砂災害・津波浸水想定区域の判定表示</li>
              </ul>
            </div>
          </section>

          {/* Section 4: 第三者提供および外部連携 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-l-3 border-[#1B4F8A] pl-3">
              4. 第三者への情報提供について
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              当サービスは、法令に基づく正当な開示要請がある場合を除き、本拡張機能を通じて取得したデータを第三者に対して販売、貸与、譲渡することは一切ございません。
            </p>
          </section>

          {/* Section 5: 安全管理措置と権限の撤回 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-l-3 border-[#1B4F8A] pl-3">
              5. 安全管理措置および権限の撤回（アンインストール）
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              本拡張機能と当サービスサーバー間の通信は、すべて業界標準のSSL/TLS 256bit暗号化によって保護されています。本拡張機能の使用を停止したい場合、ブラウザの拡張機能管理画面（chrome://extensions/）から本拡張機能を削除（アンインストール）することで、すべての権限を即時に無効化できます。
            </p>
          </section>

          {/* Section 6: お問い合わせ窓口 */}
          <section className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              6. 本ポリシーに関するお問い合わせ窓口
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              本プライバシーポリシーまたは本拡張機能におけるデータ取扱いに関するご質問・ご要望は、以下の窓口よりご連絡ください。
            </p>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 pt-1">
              Keibai Finder 運営事務局（プライバシー保護担当）<br />
              Email: support@keibai-koubai.com<br />
              Web: <a href="https://www.keibai-koubai.com" className="text-[#1B4F8A] dark:text-sky-400 hover:underline">https://www.keibai-koubai.com</a>
            </div>
          </section>

          {/* English Summary for Global Store Compliance */}
          <hr className="border-slate-200 dark:border-slate-800" />
          <section className="space-y-3 pt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">English Summary (Chrome Web Store Reference)</h3>
            <p>
              Keibai Lens strictly adheres to the Chrome Web Store Developer Program Policies regarding User Data. The extension only processes address text highlighted by the user to query public Japanese Real Estate and Hazard APIs (MLIT and GSI). We do NOT collect, store, or transmit personally identifiable information (PII), browsing history, cookies, or credentials. All communications are encrypted via HTTPS. You can revoke all permissions at any time by uninstalling the extension.
            </p>
          </section>

        </article>

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <Link href="/extension" className="text-[#1B4F8A] dark:text-sky-400 hover:underline">
            Keibai Lens トップへ戻る
          </Link>
          <span className="mx-2">•</span>
          <Link href="/" className="text-[#1B4F8A] dark:text-sky-400 hover:underline">
            Keibai Finder ホーム
          </Link>
        </div>

      </div>
    </div>
  );
}
