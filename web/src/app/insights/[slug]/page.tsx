import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowLeft, Globe } from 'lucide-react';
import ArticleContent from './ArticleContent';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params, searchParams }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const digest = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!digest) {
    return { title: 'Not Found' }
  }

  return {
    title: `${digest.title_ja} | Keibai Market Insights`,
    description: `AI Analysis report for ${digest.title_ja}`,
  }
}

export const revalidate = 600; // Auto update every 10 minutes

export default async function DigestDetailPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug;
  const langKey = (resolvedSearchParams.lang as string) || 'ja';

  const digest = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!digest) {
    notFound();
  }

  // Handle Multi-language
  let title = digest.title_ja;
  let rawContent = digest.content_ja;

  if (langKey === 'en' && digest.content_en) {
    title = digest.title_en || title;
    rawContent = digest.content_en;
  } else if (langKey === 'vi' && digest.content_vi) {
    title = digest.title_vi || title;
    rawContent = digest.content_vi;
  } else if (langKey === 'zh' && digest.content_zh) {
    title = digest.title_zh || title;
    rawContent = digest.content_zh;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Language Select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link href="/insights" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            市場分析一覧へ戻る
          </Link>

          <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Globe className="w-4 h-4 text-zinc-400 ml-2" />
            <Link href={`/insights/${slug}?lang=ja`} className={`px-2 py-1 rounded-md transition-colors ${langKey === 'ja' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>日本語</Link>
            <Link href={`/insights/${slug}?lang=en`} className={`px-2 py-1 rounded-md transition-colors ${langKey === 'en' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>EN</Link>
            <Link href={`/insights/${slug}?lang=vi`} className={`px-2 py-1 rounded-md transition-colors ${langKey === 'vi' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>VI</Link>
            <Link href={`/insights/${slug}?lang=zh`} className={`px-2 py-1 rounded-md transition-colors ${langKey === 'zh' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>ZH</Link>
          </div>
        </div>

        {/* Header */}
        <header className="space-y-6 mb-10 pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              {new Date(digest.publishDate).toLocaleDateString('ja-JP')}
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
