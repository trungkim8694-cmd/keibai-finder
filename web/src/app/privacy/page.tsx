import React from 'react';
import { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Keibai-Koubai Finder',
  description: 'Keibai-Koubai Finderのプライバシーポリシーです。個人情報の取り扱いについてご案内します。'
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pt-[12vh] pb-[10vh] font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">プライバシーポリシー</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">最終更新日: 2026年4月</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第1条（個人情報の収集方法）</h2>
              <p>
                当サービスは、ユーザーが「Googleでログイン」等のソーシャルログインを利用して会員登録をする際に、氏名（表示名）、メールアドレス等の個人情報を取得します。また、当サービスを利用する際の検索履歴や、お気に入りに登録した物件データを蓄積します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第2条（個人情報を収集・利用する目的）</h2>
              <p>当サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>当サービスの提供・運営のため（マイページの表示、お気に入り物件の保存機能等）</li>
                <li>ユーザーからのお問い合わせに回答するため</li>
                <li>新機能、更新情報、キャンペーン等に関するご案内のメールを送付するため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーを特定し、ご利用をお断りするため</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第3条（個人情報の第三者提供）</h2>
              <p>
                当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第4条（アクセス解析ツールについて）</h2>
              <p>
                当サービスでは、サービス向上のためGoogleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第5条（プライバシーポリシーの変更）</h2>
              <p>
                本ポリシーの内容は、ユーザーに通知することなく、変更することができるものとします。変更後のプライバシーポリシーは、当サービスに掲載したときから効力を生じるものとします。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
