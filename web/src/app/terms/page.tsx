import React from 'react';
import { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: '利用規約 | Keibai-Koubai Finder',
  description: 'Keibai-Koubai Finderの利用規約です。当サービスを利用する前に必ずお読みください。'
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pt-[12vh] pb-[10vh] font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">利用規約</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">最終更新日: 2026年4月</p>
            </div>
          </div>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第1条（目的）</h2>
              <p>
                本利用規約（以下「本規約」といいます。）は、Keibai-Koubai Finder（以下「当サービス」といいます。）が提供するすべてのサービスおよびコンテンツの利用条件を定めるものです。ユーザーは本規約に同意した上で当サービスを利用するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第2条（情報の正確性及び免責事項）</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>当サービスは、裁判所の不動産競売物件情報サイト（BIT）および国土交通省（MLIT）の公開データを元に独自に集計・分析した結果を提供していますが、その情報の正確性、完全性、最新性、および特定目的への適合性について一切の保証を行いません。</li>
                <li>当サービスが提供する「AI予想利回り」や「市場価格とのギャップ」などの数値は、あくまで過去の傾向に基づく想定値（シミュレーション）であり、将来の実際の収益や市場価格を保証するものではありません。</li>
                <li>ユーザーが当サービスの情報に基づいて行った投資や取引（競売での入札等を含みますがこれに限られません）により生じたいかなる損害についても、当サービスは一切の責任を負いません。最終的な投資判断はユーザーご自身の自己責任にて行ってください。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第3条（禁止事項）</h2>
              <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>当サービスのシステムに過度な負荷をかける行為（スクレイピング等の自動化プログラムによる過剰なデータ取得を含む）</li>
                <li>当サービスのデータを、当サービスの許可なく複製、販売、出版または再配布する行為</li>
                <li>法令または公序良俗に違反する行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第4条（サービスの中断・停止・変更）</h2>
              <p>
                当サービスは、定期または緊急のシステムメンテナンス、データ取得元の仕様変更（BITやMLITのAPI変更等）、天災等の不可抗力により、事前の予告なくサービスの提供を一時的に中断または停止することがあります。これによって生じた損害について、当サービスは責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">第5条（規約の変更）</h2>
              <p>
                当サービスは、必要と判断した場合には、ユーザーに事前通知することなく、いつでも本規約を変更することができるものとします。変更後の利用規約は、当サービス上に表示された時点から効力を生じるものとします。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
