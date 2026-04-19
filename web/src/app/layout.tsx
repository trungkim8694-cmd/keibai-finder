import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import GlobalHeader from "@/components/GlobalHeader";

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
  maximumScale: 1,
  userScalable: false,
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
  },
  twitter: {
    card: 'summary_large_image',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-[100dvh] overflow-hidden" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col h-full overflow-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <GlobalHeader />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
