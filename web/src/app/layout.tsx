import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import GlobalHeader from "@/components/GlobalHeader";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.keibai-koubai.com'),
  title: {
    default: "競売物件・公売物件の一括検索サイト｜Keibai Finder",
    template: "%s｜Keibai Finder"
  },
  description: "全国の不動産競売・公売情報を一括検索。AIによる落札価格の査定、過去の取引相場（国土交通省データ連携）で市場価格より安い不動産が見つかります。",
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    title: '不動産競売・公売情報の検索ポータル｜Keibai Finder',
    description: '市場価格より安く不動産を手に入れる。AI査定と過去の取引相場から、あなたに最適な競売・公売物件を見つけます。',
    siteName: 'Keibai Finder',
    images: [
      {
        url: '/keibaikoubai.webp',
        width: 1200,
        height: 630,
        alt: 'Keibai Finder - 競売物件・公売物件の一括検索サイト',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.keibai-koubai.com/#website',
        url: 'https://www.keibai-koubai.com',
        name: 'Keibai Finder',
        alternateName: ['競売ファインダー', 'Keibai-Koubai Finder', 'けいばい 競売物件情報・公売検索ポータル'],
        description: '全国不動産競売・公売物件一括検索＆落札相場データベース（裁判所BIT・国税庁公売・国土交通省取引価格連携）',
        inLanguage: 'ja',
        publisher: {
          '@id': 'https://www.keibai-koubai.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.keibai-koubai.com/map?keyword={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.keibai-koubai.com/#organization',
        name: 'Keibai Finder',
        legalName: 'TQC株式会社',
        url: 'https://www.keibai-koubai.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.keibai-koubai.com/extension-icon.png',
          width: 512,
          height: 512,
        },
        telephone: '+81-3-6907-1219',
        email: 'info@keibai-koubai.com',
        address: {
          '@type': 'PostalAddress',
          postalCode: '171-0022',
          addressRegion: '東京都',
          addressLocality: '豊島区',
          streetAddress: '南池袋２丁目３３－６ 佐藤ビル３F',
          addressCountry: 'JP',
        },
        sameAs: [
          'https://zero-press.net/p/r-mwj77b4vvqtf',
        ],
        knowsAbout: [
          'けいばい 競売物件情報',
          '不動産競売',
          '公売物件',
          'BIT不動産競売物件情報',
          '3点セット（物件明細書・現況調査報告書・評価書）',
          '占有者立ち退き・引渡命令',
          '期間入札・特別売却',
          '国税庁公売物件検索',
          '国土交通省不動産取引価格情報',
          'ボロ戸建て・再建築不可物件再生投資',
        ],
      },
    ],
  };

  return (
    <html lang="ja" className="h-[100dvh] overflow-hidden" suppressHydrationWarning>
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="https://www.keibai-koubai.com/feed.xml"
          title="Keibai Finder 最新競売・公売物件 RSS Feed"
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="https://www.keibai-koubai.com/llms.txt"
          title="Keibai Finder AI Knowledge Summary (llms.txt)"
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="https://www.keibai-koubai.com/llms-full.txt"
          title="Keibai Finder Full Real Estate Auction Dataset & Guides (llms-full.txt)"
        />
        <link
          rel="alternate"
          type="application/json"
          href="https://www.keibai-koubai.com/api/public/ai-feed"
          title="Keibai Finder Public AI Citation JSON Feed"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
        {/* Google Analytics 4 (GA4) */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-G21M8EFJV8"}`}
        />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-G21M8EFJV8"}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col h-full overflow-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <AppLayoutWrapper header={<GlobalHeader />}>
            {children}
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
