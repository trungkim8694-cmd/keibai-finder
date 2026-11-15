import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '全国不動産競売・公売物件マップ検索（地図・AI査定）',
  description:
    '日本全国の地方裁判所（BIT）および国税庁公売の競売・公売物件をインタラクティブ地図で検索。相場乖離率・利回り・災害ハザード・学区・周辺取引相場を一画面で分析できます。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/map',
  },
  openGraph: {
    title: '全国不動産競売・公売物件マップ検索（地図・AI査定）｜Keibai Finder',
    description:
      '全国の競売・公売物件を地図上で直感的に検索。MLIT取引相場や災害ハザードを重ねて割安物件を発掘。',
    url: 'https://www.keibai-koubai.com/map',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/keibaikoubai.webp',
        width: 1200,
        height: 630,
        alt: 'Keibai Finder 全国不動産競売・公売物件マップ検索',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '全国不動産競売・公売物件マップ検索｜Keibai Finder',
    description: '全国の競売・公売物件を地図で検索・相場査定。',
    images: ['/keibaikoubai.webp'],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  const mapJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://www.keibai-koubai.com/map#webapp',
        name: '全国不動産競売・公売物件マップ検索',
        url: 'https://www.keibai-koubai.com/map',
        description:
          '日本全国の地方裁判所（BIT）および国税庁公売の競売・公売物件を地図上で検索し、国土交通省の取引相場との乖離率を自動査定するツール。',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        provider: { '@id': 'https://www.keibai-koubai.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibai-koubai.com' },
          { '@type': 'ListItem', position: 2, name: '全国物件マップ検索', item: 'https://www.keibai-koubai.com/map' },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mapJsonLd).replace(/</g, '\\u003c') }}
      />
      <h1 className="sr-only">
        全国不動産競売・公売物件マップ検索（地方裁判所BIT・国税庁公売・AI相場査定）
      </h1>
      {children}
    </>
  );
}
