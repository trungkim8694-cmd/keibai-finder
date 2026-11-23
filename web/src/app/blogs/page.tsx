import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { ChevronRight, Mail, ShieldCheck } from 'lucide-react';
import BlogListClient, { BlogArticleItem } from './BlogListClient';

export const metadata: Metadata = {
  title: '市場ナレッジ & 投資実務ガイド',
  description: '不動産競売・公売のプロが教える、入札手続きのステップバイステップと必ず知っておくべきリスク管理・権利関係の注意点。',
  alternates: {
    canonical: 'https://www.keibai-koubai.com/blogs',
  },
  openGraph: {
    title: '市場ナレッジ & 投資実務ガイド｜Keibai Finder',
    description: '不動産競売・公売の入札手続きとリスク管理・権利関係の実務ガイド。',
    url: 'https://www.keibai-koubai.com/blogs',
    siteName: 'Keibai Finder',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '市場ナレッジ & 投資実務ガイド' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/keibaikoubai.webp'],
  },
};

export const revalidate = 600;

export default async function BlogsPage() {
  let articles: any[] = [];
  try {
    articles = await prisma.dailyDigest.findMany({
      where: {
        category: {
          in: ['GUIDE', 'CAUTION']
        }
      },
      orderBy: { publishDate: 'desc' },
    });
  } catch (error) {
    console.error("Database fetch error in BlogsPage:", error);
  }

  // Serialize articles for client consumption
  const serializedArticles: BlogArticleItem[] = articles.map(a => ({
    id: a.id,
    slug: a.slug,
    category: a.category,
    title_ja: a.title_ja,
    title_vi: a.title_vi,
    content_ja: a.content_ja || '',
    content_vi: a.content_vi || '',
    featuredImage: a.featuredImage || null,
    publishDate: a.publishDate ? new Date(a.publishDate).toISOString() : new Date().toISOString(),
    tags: a.tags || [],
  }));

  // Schema.org Breadcrumb & CollectionPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'ホーム',
            'item': 'https://www.keibai-koubai.com/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': '実務ナレッジ・投資ガイド',
            'item': 'https://www.keibai-koubai.com/blogs'
          }
        ]
      },
      {
        '@type': 'CollectionPage',
        'name': '市場ナレッジ & 投資実務ガイド',
        'description': '不動産競売・公売の実務プロセス、法務リスク管理、収益化ノウハウを専門家視点で体系的に解説。',
        'url': 'https://www.keibai-koubai.com/blogs'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* 1. 3-Tier Header & Breadcrumbs Section */}
      <section className="bg-white dark:bg-[#151B22] border-b border-slate-200/90 dark:border-slate-800/90 pt-6 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* Breadcrumb */}
          <nav aria-label="パンくずリスト" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-sky-400 transition-colors">
              ホーム
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              実務ナレッジ・投資ガイド
            </span>
          </nav>

          {/* Title Area */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-sky-400" />
              <span>不動産競売・公売 実務ナレッジベース</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-snug">
              市場ナレッジ &amp; 投資実務ガイド
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              裁判所の不動産競売および行政公売における実務手続き、入札価格の査定ノウハウ、占有者リスクの対処法を専門家視点で体系的に解説します。
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Content (Interactive Client List) */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <BlogListClient articles={serializedArticles} />
      </div>

      {/* 3. B2B Newsletter & Guidance Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="b2b-card bg-slate-50/70 dark:bg-[#151B22]/70 border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-6 sm:p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center mx-auto text-[#1B4F8A] dark:text-sky-400">
            <Mail className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 max-w-xl mx-auto">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              競売・公売の実務アップデート情報を受け取る
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              新規公開された実務ガイドや、制度改正・入札リスクに関する最新情報を定期的にメールでお届けします。
            </p>
          </div>

          <form 
            onSubmit={undefined} 
            className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-1"
          >
            <input
              type="email"
              placeholder="メールアドレス（例: yamada@example.co.jp）"
              className="flex-1 px-3.5 py-2.5 min-h-[40px] text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[40px] rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 flex items-center justify-center cursor-pointer"
            >
              購読登録（無料）
            </button>
          </form>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ※ いつでも配信停止が可能です。入力された情報はプライバシーポリシーに基づき厳重に管理されます。
          </p>
        </div>
      </section>
    </div>
  );
}
