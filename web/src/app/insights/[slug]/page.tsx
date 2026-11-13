import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import ArticleContent from './ArticleContent';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug;
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
  const canonicalUrl = `${baseUrl}/insights/${slug}`;

  return {
    title: `${title} | 市場分析・競売インサイト`,
    description: description.substring(0, 160),
    alternates: {
      canonical: canonicalUrl,
    }
  }
}

export const revalidate = 3600;

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
  const slug = resolvedParams.slug;

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
      const { redirect } = require('next/navigation');
      redirect(`/blogs/${slug}`);
    }
    notFound();
  }

  const title = digest.title_ja || digest.title_vi || '市場分析レポート';
  const rawContent = digest.content_ja || digest.content_vi || '';

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": rawContent.replace(/[#*]/g, '').substring(0, 160),
    "image": ["https://www.keibai-koubai.com/keibaikoubai.webp"],
    "datePublished": new Date(digest.publishDate).toISOString(),
    "dateModified": new Date(digest.publishDate).toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Keibai Finder",
      "url": "https://www.keibai-koubai.com/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Keibai Finder",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.keibai-koubai.com/icon.png"
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
        <header className="space-y-6 mb-10 pb-10 border-b border-zinc-200 dark:border-zinc-800">
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
        </header>

        {/* Content Body */}
        <ArticleContent content={rawContent} />

      </div>
    </div>
  );
}
