import React from 'react';
import { getProperties, getCityStats } from '@/actions/propertyActions';
import PropertyCard from '@/components/PropertyCard';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600; // Cache these pages for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ prefecture: string }> }): Promise<Metadata> {
  const { prefecture } = await params;
  const decodedPref = decodeURIComponent(prefecture);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}`;
  
  const properties = await getProperties({
    prefecture: decodedPref,
    limit: 1,
  });
  const count = properties?.length || 0;

  return {
    // 競売物件・公売物件
    title: `【2026最新】${decodedPref}のけいばい（競売物件情報）・格安公売物件一覧`,
    description: `${decodedPref}の裁判所競売物件情報（けいばい）・税務署公売情報を一括検索。${decodedPref}の競売物件格安情報、戸建て競売500万以下など注目の売却基準価額と最新スケジュールをリアルタイム掲載中。AI査定で落札相場を分析。`,
    robots: {
      index: count > 0,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `【2026最新】${decodedPref}のけいばい（競売物件情報）・格安公売物件一覧｜Keibai Finder`,
      description: `${decodedPref}の裁判所競売物件情報・税務署公売情報を一括検索。格安戸建て・マンション・土地の売却基準価額と最新スケジュールを掲載中。AI査定で落札相場を分析。`,
      url: canonicalUrl,
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: `${decodedPref}のけいばい（競売物件情報）・格安公売物件一覧` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
  };
}

// Japanese regions mapping for neighboring prefectures silo
const REGIONS = [
  { name: '北海道・東北', prefs: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { name: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { name: '北陸・甲信越', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県'] },
  { name: '東海', prefs: ['岐阜県', '静岡県', '愛知県', '三重県'] },
  { name: '関西', prefs: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { name: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { name: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { name: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] },
];

export default async function PrefectureSearchPage({ params }: { params: Promise<{ prefecture: string }> }) {
  const { prefecture } = await params;
  const decodedPref = decodeURIComponent(prefecture);
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com').replace(/\/$/, '');

  // Fetch properties filtered by prefecture
  const [properties, cityStats] = await Promise.all([
    getProperties({
      prefecture: decodedPref,
      limit: 50,
    }),
    getCityStats(decodedPref),
  ]);

  const currentRegion = REGIONS.find((r) => r.prefs.includes(decodedPref));
  const regionName = currentRegion?.name || '近隣地域';
  const neighborPrefectures = currentRegion ? currentRegion.prefs.filter((p) => p !== decodedPref) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}#webpage`,
        url: `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}`,
        name: `【2026最新】${decodedPref}のけいばい（競売物件情報）・格安公売物件一覧`,
        description: `${decodedPref}の裁判所競売物件情報・税務署公売情報を一括検索。`,
        inLanguage: 'ja',
        isPartOf: { '@id': `${baseUrl}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: '地域から探す', item: `${baseUrl}/search/area` },
          { '@type': 'ListItem', position: 3, name: `${decodedPref}の競売・公売物件`, item: `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}` },
        ],
      },
      ...(properties.length > 0 ? [{
        '@type': 'ItemList',
        '@id': `${baseUrl}/search/area/${encodeURIComponent(decodedPref)}#itemlist`,
        name: `${decodedPref}の注目の競売・公売物件一覧`,
        numberOfItems: Math.min(properties.length, 10),
        itemListElement: properties.slice(0, 10).map((prop: any, idx: number) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${baseUrl}/property/${prop.sale_unit_id}`,
          name: prop.address || `${decodedPref}の競売物件`,
        })),
      }] : []),
    ],
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <nav aria-label="パンくずリスト" className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
              <Link href="/" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">ホーム</Link>
              <span>/</span>
              <Link href="/search/area" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">地域一覧</Link>
              <span>/</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">{decodedPref}</span>
            </nav>
            <Link href="/search/area" className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 都道府県一覧へ戻る
            </Link>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            📍 {decodedPref}のけいばい（競売物件情報）・格安公売物件一覧
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {decodedPref}で現在入札受付中・公示中の裁判所競売物件および行政公売物件 (該当 {properties?.length || 0} 件)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {properties.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-4xl mb-4">🏠</p>
            <p className="font-medium text-lg mb-2">現在、このエリアに募集中の物件はありません</p>
            <p className="text-zinc-500 text-sm">別の都道府県で検索するか、後日再度ご確認ください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.sale_unit_id} property={property as any} />
            ))}
          </div>
        )}

        {/* SEO Content Block */}
        <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold mb-3">{decodedPref}の競売物件・公売物件相場と特徴</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
            {decodedPref}の競売・公売市場では、戸建てやマンションから土地まで、幅広い不動産が市場価格（相場）よりも安く取引される傾向にあります。裁判所が管轄する競売（けいばい）と、行政機関が管轄する公売（こうばい）の両方の物件情報を当サイト「Keibai Finder」で一括で検索・比較することが可能です。
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            特に{decodedPref}で不動産投資を検討されている方や、マイホームを安く手に入れたい方にとって、競売物件は魅力的な選択肢となります。物件の詳細ページでは、AIによる価格査定や過去の落札履歴データを活用して、適切な入札価格の目安を確認できます。初めての方でも安心して参加できるよう、事前に専門家への相談をおすすめします。
          </p>
        </div>

        {/* 1. Internal Silo: Price & Property Type Filter Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Range Silos */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              💰 {decodedPref}の価格帯・予算から探す
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&maxPrice=3000000`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">300万円以下 (超格安・DIY)</span>
                <span className="text-[11px] text-zinc-400 font-mono">〜300万</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&maxPrice=5000000`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">500万円以下 (格安戸建て)</span>
                <span className="text-[11px] text-zinc-400 font-mono">〜500万</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&maxPrice=10000000`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">1,000万円以下 (駅近・収益)</span>
                <span className="text-[11px] text-zinc-400 font-mono">〜1000万</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&maxPrice=20000000`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">2,000万円以下 (優良物件)</span>
                <span className="text-[11px] text-zinc-400 font-mono">〜2000万</span>
              </Link>
            </div>
          </div>

          {/* Property Type Silos */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              🏢 {decodedPref}の物件種別から探す
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('戸建て')}`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">戸建て・古民家</span>
                <span className="text-[11px] text-zinc-400 font-mono">一軒家</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('マンション')}`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">区分マンション</span>
                <span className="text-[11px] text-zinc-400 font-mono">集合住宅</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('土地')}`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">土地・宅地・更地</span>
                <span className="text-[11px] text-zinc-400 font-mono">建築用地</span>
              </Link>
              <Link
                href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('その他')}`}
                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">農地・山林・商業用</span>
                <span className="text-[11px] text-zinc-400 font-mono">その他</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. High-CTR Deal Keyword Shortcut Silo */}
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            🎯 注目の絞り込み・人気検索条件
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={`/map?prefecture=${encodeURIComponent(decodedPref)}&maxPrice=5000000`}
              className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition-colors"
            >
              🔥 {decodedPref} 競売 物件 格安 (500万以下)
            </Link>
            <Link
              href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('戸建て')}&maxPrice=5000000`}
              className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition-colors"
            >
              🏡 {decodedPref} 戸建て 競売 500万以下
            </Link>
            <Link
              href={`/map?prefecture=${encodeURIComponent(decodedPref)}&types[]=${encodeURIComponent('マンション')}&maxPrice=10000000`}
              className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition-colors"
            >
              🏙️ {decodedPref} マンション 競売 1000万以下
            </Link>
            <Link
              href={`/map?prefecture=${encodeURIComponent(decodedPref)}&provider=NTA`}
              className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition-colors"
            >
              🏛️ {decodedPref} 国税庁 公売物件 (税務署・差押)
            </Link>
            <Link
              href={`/map?prefecture=${encodeURIComponent(decodedPref)}&provider=BIT`}
              className="bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition-colors"
            >
              ⚖️ {decodedPref} 裁判所 競売物件 (BIT)
            </Link>
          </div>
        </div>

        {/* 3. Knowledge Guides Cluster Silo (Links to Workstream C Articles) */}
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            📚 {decodedPref}の競売・公売に参加する前に読むべき必須ガイド
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/blogs/3点セット-読み方-初心者ガイド"
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-between group"
            >
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mb-1">
                📖 3点セットの読み方 完全ガイド
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2">物件明細書・現況調査報告書・評価書のチェックポイントと減価要因の見極め方。</p>
            </Link>
            <Link
              href="/blogs/占有者-立ち退き-費用-期間"
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-between group"
            >
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mb-1">
                ⚖️ 占有者の立ち退き費用と引渡命令
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2">落札後の明渡し交渉、裁判所の引渡命令申立から強制執行までの期間と費用相場。</p>
            </Link>
            <Link
              href="/blogs/ボロ戸建て-競売-高利回り投資術"
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-between group"
            >
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mb-1">
                🔨 ボロ戸建て競売 利回り20%再生術
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2">格安古民家・ボロ戸建てを数百万円で落札し、コスパ最強リフォームで高利回り賃貸化。</p>
            </Link>
            <Link
              href="/blogs/期間入札-流れ-裁判所-完全ガイド"
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-between group"
            >
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mb-1">
                📝 裁判所 期間入札の手続き完全ガイド
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2">入札保証金20%の振込から入札書の郵送、開札結果発表までの全ステップ。</p>
            </Link>
            <Link
              href="/blogs/国税庁-公売-物件-検索-活用術"
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex flex-col justify-between group"
            >
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 mb-1">
                🔍 国税庁 公売物件検索と参加のコツ
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2">BIT競売と公売の違い、インターネット公売システム（KSI官公庁オークション）の使い方。</p>
            </Link>
          </div>
        </div>

        {/* 4. Neighboring Prefectures Silo */}
        {neighborPrefectures.length > 0 && (
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              🗾 近隣エリア（{regionName}）の競売・公売物件
            </h2>
            <div className="flex flex-wrap gap-2">
              {neighborPrefectures.map((p) => (
                <Link
                  key={p}
                  href={`/search/area/${encodeURIComponent(p)}`}
                  className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-zinc-200 hover:border-rose-300 dark:border-zinc-700 dark:hover:border-rose-700 text-xs py-1.5 px-3 rounded-lg transition-colors font-medium text-zinc-700 dark:text-zinc-300 hover:text-rose-600"
                >
                  {p}の競売物件
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. City Directory Silo */}
        {cityStats.length > 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              🏘️ {decodedPref}の市区町村から探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {cityStats.map((cityData) => (
                <Link 
                  href={`/search/area/${encodeURIComponent(decodedPref)}/${encodeURIComponent(cityData.city)}`} 
                  key={cityData.city}
                  className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-zinc-200 hover:border-rose-300 dark:border-zinc-700 dark:hover:border-rose-700 text-sm py-2 px-4 rounded-lg transition-all flex items-center gap-2 group"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-rose-700 dark:group-hover:text-rose-300">{cityData.city}</span>
                  <span className="text-xs bg-white dark:bg-zinc-900 text-zinc-400 group-hover:text-rose-500 px-1.5 rounded">{cityData.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
