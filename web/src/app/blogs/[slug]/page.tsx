import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, BookOpen, AlertTriangle, ChevronRight, TrendingUp, Search, ShieldCheck, Map, ArrowRight } from 'lucide-react';
import ArticleContent from '../../insights/[slug]/ArticleContent';
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
  let article = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!article) {
    article = await prisma.dailyDigest.findFirst({
      where: {
        previousSlugs: { has: slug }
      }
    });
  }

  if (!article) {
    return { title: 'Not Found' }
  }

  const title = article.title_ja || '実務ナレッジ・投資ガイド';
  const rawContent = article.content_ja || '';
  const description = rawContent.replace(/[#*]/g, '').substring(0, 160);
  const baseUrl = 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/blogs/${slug}`;
  const ogImage = article.featuredImage || '/keibaikoubai.webp';

  return {
    title: `${title} - 不動産競売・公売ナレッジ`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title}｜Keibai Finder`,
      description,
      url: canonicalUrl,
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImage],
    },
  };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const articles = await prisma.dailyDigest.findMany({
      where: {
        category: {
          in: ['GUIDE', 'CAUTION']
        }
      },
      select: { slug: true, previousSlugs: true }
    });

    const paramsList: { slug: string }[] = [];
    for (const a of articles) {
      paramsList.push({ slug: a.slug });
      if (a.previousSlugs && a.previousSlugs.length > 0) {
        for (const ps of a.previousSlugs) {
          paramsList.push({ slug: ps });
        }
      }
    }
    return paramsList;
  } catch {
    return [];
  }
}

export default async function LogDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let article = await prisma.dailyDigest.findUnique({
    where: { slug }
  });

  if (!article) {
    article = await prisma.dailyDigest.findFirst({
      where: {
        previousSlugs: { has: slug }
      }
    });
  }

  if (!article) {
    notFound();
  }

  // Prevent Duplicate Content: MARKET_REPORT belongs in /insights
  if (article.category === 'MARKET_REPORT') {
    const { redirect } = require('next/navigation');
    redirect(`/insights/${slug}`);
  }

  if (article.category !== 'GUIDE' && article.category !== 'CAUTION') {
    notFound();
  }

  // Fetch 3 related recent articles for sidebar
  const relatedArticles = await prisma.dailyDigest.findMany({
    where: {
      category: { in: ['GUIDE', 'CAUTION'] },
      slug: { not: slug }
    },
    select: {
      slug: true,
      title_ja: true,
      category: true,
      publishDate: true,
      featuredImage: true
    },
    orderBy: { publishDate: 'desc' },
    take: 3
  });

  const title = article.title_ja || '実務ナレッジ・投資ガイド';
  const rawContent = article.content_ja || '';

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": rawContent.replace(/[#*]/g, '').substring(0, 160),
    "image": article.featuredImage ? [article.featuredImage] : ["https://www.keibai-koubai.com/keibaikoubai.webp"],
    "datePublished": new Date(article.publishDate).toISOString(),
    "dateModified": new Date(article.publishDate).toISOString(),
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

  const isCaution = article.category === 'CAUTION';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      
      {/* Container: Max-w-7xl (1280px) matching /auction-results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <nav aria-label="パンくずリスト" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              ホーム
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/blogs" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
              実務ナレッジ・投資ガイド
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {title}
            </span>
          </nav>
        </div>

        {/* 2-Column Desktop Grid Layout (1280px Width) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Article Content (8 Cols) */}
          <article className="lg:col-span-8 b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-6 sm:p-10 space-y-8">
            
            {/* Header */}
            <header className="space-y-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3">
                {isCaution ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    リスク管理・注意事項
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
                    <BookOpen className="w-3.5 h-3.5" />
                    実務ガイド・投資ノウハウ
                  </span>
                )}

                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(article.publishDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-[1.3] tracking-tight">
                {title}
              </h1>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {article.tags?.map(tag => (
                  <span key={tag} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="rounded-lg overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-100 dark:bg-slate-900 shadow-xs">
                <img 
                  src={article.featuredImage} 
                  alt={title} 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Content Body - Clean B2B Reading Experience */}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-l-4 prose-h2:border-[#1B4F8A] prose-h2:pl-3.5 prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300 text-sm sm:text-base">
              <ArticleContent content={rawContent} />
            </div>

            {/* Legal Footnote */}
            <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-lg text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">※ 免責事項について：</p>
                <p className="leading-relaxed">
                  本記事は不動産競売・公売手続きの一般的な参考情報の提供を目的としており、個別事案における法的判断や入札成功を保証するものではありません。入札に際しては必ず裁判所の3点セット等の原本をご確認ください。
                </p>
              </div>
              <Link 
                href="/blogs" 
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold transition-colors shrink-0 self-end sm:self-center shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>記事一覧に戻る</span>
              </Link>
            </div>
          </article>

          {/* Right Sticky Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-16">
            
            {/* 1. Quick Tool Launch Box */}
            <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>公式実務ツールリンク</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Keibai Finderでは、記事で解説している実務調査・価格査定ツールをすべて無料で公開しています。
              </p>
              <div className="space-y-2 pt-1">
                <Link 
                  href="/market-insights" 
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200/70 dark:border-slate-800 group"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#1B4F8A]" />
                    市場分析ダッシュボード
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link 
                  href="/trade-find" 
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200/70 dark:border-slate-800 group"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    不動産取引価格検索
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link 
                  href="/area-map" 
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors border border-slate-200/70 dark:border-slate-800 group"
                >
                  <span className="flex items-center gap-2">
                    <Map className="w-3.5 h-3.5 text-amber-600" />
                    全国エリア分析マップ
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link 
                  href="/extension" 
                  className="flex items-center justify-between p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold text-[#1B4F8A] dark:text-blue-300 transition-colors border border-blue-200 dark:border-blue-800/80 group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1B4F8A] animate-pulse"></span>
                    Keibai Lens（拡張機能）
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#1B4F8A] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 2. Related Guides */}
            {relatedArticles.length > 0 && (
              <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-5 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  関連する実務ナレッジ
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {relatedArticles.map(rel => (
                    <Link
                      key={rel.slug}
                      href={`/blogs/${rel.slug}`}
                      className="block py-3 group"
                    >
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mb-1">
                        {new Date(rel.publishDate).toLocaleDateString('ja-JP')}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {rel.title_ja}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Advisory Support Box */}
            <div className="b2b-card bg-slate-50 dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                競売入札サポートをお探しですか？
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                三点セットの法的調査や占有者対策の相談ができる周辺サポート不動産会社を掲載中。
              </p>
              <Link
                href="/agencies"
                className="inline-flex items-center justify-center w-full py-2 px-3 rounded-md bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                不動産会社データベースを見る
              </Link>
            </div>

          </aside>
        </div>

      </div>
    </div>
  );
}
