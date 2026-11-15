import React from 'react';
import { getRailLinesAndStations } from '@/actions/propertyActions';
import Link from 'next/link';
import { Metadata } from 'next';
import { TramFront } from 'lucide-react';
import LineSearchFilter from '@/components/LineSearchFilter';

export const revalidate = 86400; // Cache for 24 hours (1 day)

export const metadata: Metadata = {
  title: '路線・駅から競売・公売物件を探す',
  description: '全国の路線・駅から不動産競売・公売物件を検索。駅近のマンションや戸建てなど、利便性の高い物件を相場より安く見つけることができます。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/search/station',
  },
  openGraph: {
    title: '路線・駅から競売・公売物件を探す｜Keibai Finder',
    description: '全国の路線・駅から不動産競売・公売物件を検索。',
    url: 'https://www.keibai-koubai.com/search/station',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '路線・駅から競売物件を探す' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

// Japanese regions mapping
const REGIONS = [
  { name: '北海道・東北', prefs: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { name: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { name: '北陸・甲信越', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県'] },
  { name: '東海', prefs: ['岐阜県', '静岡県', '愛知県', '三重県'] },
  { name: '関西', prefs: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { name: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { name: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { name: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
];

export default async function StationIndexPage() {
  const lineData = await getRailLinesAndStations();
  
  const totalLines = lineData.length;
  // Calculate total stations
  const totalStations = lineData.reduce((acc, curr) => acc + curr.stations.length, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.keibai-koubai.com/search/station#webpage',
        url: 'https://www.keibai-koubai.com/search/station',
        name: '路線・駅から競売・公売物件を探す',
        description: '全国の路線・駅から不動産競売・公売物件を検索。',
        inLanguage: 'ja',
        isPartOf: { '@id': 'https://www.keibai-koubai.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '物件検索', item: 'https://www.keibai-koubai.com/search/station' },
          { '@type': 'ListItem', position: 3, name: '路線・駅から探す', item: 'https://www.keibai-koubai.com/search/station' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <nav aria-label="パンくずリスト" className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#1B4F8A] transition-colors">
              ホーム
            </Link>
            <span>/</span>
            <Link href="/search/station" className="hover:text-[#1B4F8A] transition-colors">
              物件検索
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              路線・駅から探す
            </span>
          </nav>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <TramFront className="w-5 h-5 sm:w-6 sm:h-6 text-[#1B4F8A] dark:text-blue-400" />
            路線・駅から探す
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 sm:mt-2">
            現在、<span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">{totalLines.toLocaleString()}</span>の路線と
            <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums font-mono">{totalStations.toLocaleString()}</span>の駅周辺で物件が募集されています。
          </p>
        </div>
      </div>

      <LineSearchFilter lineData={lineData} regions={REGIONS} />
    </div>
  );
}
