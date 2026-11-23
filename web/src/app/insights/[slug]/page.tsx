import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import ArticleContent from './ArticleContent';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function safeDecodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resolvedSearchParams = await searchParams;
  const slug = safeDecodeSlug(resolvedParams.slug);
  const digest = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!digest) {
    return { title: 'Not Found' }
  }

  const title = digest.title_ja || '市場分析レポート';
  const rawDesc = digest.content_ja ? digest.content_ja.replace(/[#*]/g, '').substring(0, 150) : '';
  const description = rawDesc || `AIが分析する不動産競売・公売市場の掘り出し物トレンドレポート：${title}`;

  const baseUrl = 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/insights/${encodeURIComponent(digest.slug)}`;

  return {
    title: `${title} - 市場分析・競売インサイト`,
    description: description.substring(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title}｜Keibai Finder`,
      description: description.substring(0, 160),
      url: canonicalUrl,
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'article',
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
  };
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const digests = await prisma.dailyDigest.findMany({
      where: {
        category: 'MARKET_REPORT'
      },
      select: { slug: true }
    });

    return digests.map((digest) => ({
      slug: digest.slug,
    }));
  } catch {
    return [];
  }
}

export default async function DigestDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = safeDecodeSlug(resolvedParams.slug);

  const digest = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!digest) {
    notFound();
  }

  // Prevent Duplicate Content: Only MARKET_REPORT belongs in /insights
  if (digest.category !== 'MARKET_REPORT') {
    // If it's a GUIDE or CAUTION, redirect to /blogs
    if (digest.category === 'GUIDE' || digest.category === 'CAUTION') {
      permanentRedirect(`/blogs/${encodeURIComponent(digest.slug)}`);
    }
    notFound();
  }

  const title = digest.title_ja || digest.title_vi || '市場分析レポート';
  const rawContent = digest.content_ja || digest.content_vi || '';
  const canonicalInsightUrl = `https://www.keibai-koubai.com/insights/${encodeURIComponent(digest.slug)}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AnalysisNewsArticle",
        "@id": `${canonicalInsightUrl}#article`,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalInsightUrl
        },
        "headline": title,
        "description": rawContent.replace(/[#*]/g, '').substring(0, 160),
        "image": ["https://www.keibai-koubai.com/keibaikoubai.webp"],
        "datePublished": new Date(digest.publishDate).toISOString(),
        "dateModified": new Date(digest.updated_at || digest.publishDate).toISOString(),
        "inLanguage": "ja",
        "author": {
          "@type": "Organization",
          "@id": "https://www.keibai-koubai.com/#organization",
          "name": "Keibai Finder（TQC株式会社）",
          "url": "https://www.keibai-koubai.com/"
        },
        "publisher": {
          "@type": "Organization",
          "@id": "https://www.keibai-koubai.com/#organization",
          "name": "Keibai Finder",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.keibai-koubai.com/extension-icon.png"
          }
        },
        "creditText": `出典：Keibai Finder（${canonicalInsightUrl}）｜TQC株式会社`,
        "isBasedOn": [
          "https://www.bit.courts.go.jp/",
          "https://www.koubai.nta.go.jp/",
          "https://www.reinfolib.mlit.go.jp/"
        ],
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": ["h1", ".geo-citation-summary", "h2"]
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://www.keibai-koubai.com/" },
          { "@type": "ListItem", "position": 2, "name": "本日の注目物件・AI市場分析レポート", "item": "https://www.keibai-koubai.com/insights" },
          { "@type": "ListItem", "position": 3, "name": title, "item": canonicalInsightUrl }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link href="/insights" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            市場分析一覧へ戻る
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-6 mb-10 pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              {new Date(digest.publishDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
            </span>
            {digest.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 px-3 py-1 rounded-full">
                <Tag className="w-3.5 h-3.5" />
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
            {title}
          </h1>
        </div>

        {/* Content Body */}
        <ArticleContent content={rawContent} />

        {/* Data Provenance & AI Citation Box */}
        <section
          aria-label="データ出典・引用ガイド"
          className="geo-citation-summary mt-10 p-5 rounded-lg border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-slate-300 space-y-2 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-slate-100">
            <span>データ出典・AI引用および転載ガイドライン</span>
            <span className="text-[11px] font-mono text-[#1B4F8A] dark:text-blue-400">Keibai Finder Market Intelligence</span>
          </div>
          <p className="leading-relaxed">
            本レポートの物件データおよび相場乖離率（%）は、<strong>Keibai Finder（TQC株式会社）</strong>が全国の地方裁判所（BIT）・国税局の公示データおよび国土交通省「不動産情報ライブラリ（MLIT）」の成約取引価格を照合して算出しています。引用・参照時は以下の出典URLを明記してください。
          </p>
          <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-[11px] select-all break-all">
            出典：{title}｜Keibai Finder（{canonicalInsightUrl}）
          </div>
        </section>

      </div>
    </div>
  );
}
