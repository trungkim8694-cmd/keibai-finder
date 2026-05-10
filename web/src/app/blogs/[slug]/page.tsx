import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowLeft, Globe, BookOpen, AlertTriangle } from 'lucide-react';
import ArticleContent from '../../insights/[slug]/ArticleContent';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const article = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!article) {
    return { title: 'Not Found' }
  }

  return {
    title: `${article.title_ja || article.title_vi} | Keibai Finder BLOGS`,
    description: (article.content_ja || article.content_vi).substring(0, 160).replace(/[#*]/g, ''),
  }
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const articles = await prisma.dailyDigest.findMany({
    where: {
      category: {
        in: ['GUIDE', 'CAUTION']
      }
    },
    select: { slug: true }
  });

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function LogDetailPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug;
  
  // Default to 'ja' for Japanese optimization
  const langKey = (resolvedSearchParams.lang as string) || 'ja'; 

  const article = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!article) {
    notFound();
  }

  // Prevent Duplicate Content: MARKET_REPORT belongs in /insights
  if (article.category === 'MARKET_REPORT') {
    const { redirect } = require('next/navigation');
    redirect(`/insights/${slug}${resolvedSearchParams.lang ? `?lang=${resolvedSearchParams.lang}` : ''}`);
  }

  if (article.category !== 'GUIDE' && article.category !== 'CAUTION') {
    notFound();
  }

  // Handle Multi-language
  let title = article.title_ja || article.title_vi;
  let rawContent = article.content_ja || article.content_vi;

  if (langKey === 'vi' && article.content_vi) {
    title = article.title_vi;
    rawContent = article.content_vi;
  } else if (langKey === 'en' && article.content_en) {
    title = article.title_en || title;
    rawContent = article.content_en;
  } else if (langKey === 'zh' && article.content_zh) {
    title = article.title_zh || title;
    rawContent = article.content_zh;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Language Select - Clean & Structured */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            記事一覧に戻る
          </Link>

          <div className="flex items-center gap-2 text-[12px] bg-zinc-50 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <Globe className="w-3.5 h-3.5 text-zinc-400 ml-3 mr-1" />
            <Link href={`/blogs/${slug}?lang=ja`} className={`px-4 py-1.5 rounded-full transition-all font-bold ${langKey === 'ja' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>JP</Link>
            <Link href={`/blogs/${slug}?lang=vi`} className={`px-4 py-1.5 rounded-full transition-all font-bold ${langKey === 'vi' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>VN</Link>
            <Link href={`/blogs/${slug}?lang=en`} className={`px-4 py-1.5 rounded-full transition-all font-bold ${langKey === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>EN</Link>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <img 
              src={article.featuredImage} 
              alt={title} 
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Header - High Focus on Typography */}
        <header className="space-y-6 mb-12 pb-12 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex flex-wrap items-center gap-4">
             <span className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-md ${
                article.category === 'CAUTION' 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              }`}>
                {article.category === 'CAUTION' ? <AlertTriangle className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                {article.category === 'CAUTION' ? 'RISK MANAGEMENT' : 'INVESTMENT GUIDE'}
              </span>

            <span className="flex items-center gap-2 text-[12px] font-bold text-zinc-400">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishDate).toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 leading-[1.3] tracking-tight">
            {title}
          </h1>

          <div className="flex flex-wrap gap-2 pt-2">
            {article.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                #{tag.toUpperCase()}
              </span>
            ))}
          </div>
        </header>

        {/* Content Body - Clean Reading Experience */}
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-h2:text-2xl prose-h2:font-black prose-h2:border-l-4 prose-h2:border-blue-600 prose-h2:pl-4 prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-400">
          <ArticleContent content={rawContent} />
        </div>

        {/* Footer Navigation */}
        <footer className="mt-20 pt-10 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-8">
           <div className="text-zinc-500 dark:text-zinc-500 text-[13px] leading-relaxed">
             <span className="font-bold text-zinc-900 dark:text-zinc-100">免責事項：</span><br />
             本記事は投資判断の参考となる情報の提供を目的としており、<br />
             将来の利益を保証するものではありません。
           </div>
           <Link href="/blogs" className="bg-blue-600 text-white px-10 py-4 rounded-full font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
             他の記事を読む
           </Link>
        </footer>

      </div>
    </div>
  );
}
