import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { BookOpen, AlertTriangle, Calendar, ChevronRight, Search, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: '市場ナレッジ & 投資ガイド | Keibai Finder BLOGS',
  description: '不動産競売・公売のプロが教える、成功するためのプロセスガイドと必ず知っておくべきリスク管理。',
};

export const revalidate = 600;

export default async function BlogsPage() {
  // Fetch only GUIDE and CAUTION categories
  // Note: We use try-catch to handle potential DB sync issues gracefully
  let articles = [];
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
    // Fallback to empty list or handle accordingly
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      
      {/* Hero Section - Optimized for Japanese Clean Aesthetic */}
      <section className="relative py-20 px-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-[12px] font-bold tracking-widest border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            INVESTMENT KNOWLEDGE
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            市場ナレッジ & <span className="text-blue-600 dark:text-blue-500">投資ガイド</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            不動産競売・公売のプロが教える成功の秘訣と、<br className="hidden md:block" />
            初心者が陥りやすいリスク管理のポイントを徹底解説。
          </p>
          
          <div className="relative max-w-xl mx-auto mt-10">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input 
              type="text" 
              placeholder="知りたいトピックを検索..." 
              className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
            />
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto py-16 px-4">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">現在、記事を準備中です</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">最新のガイド記事が公開されるまでもうしばらくお待ちください。</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {articles.map((article) => (
              <Link 
                href={`/blogs/${article.slug}`} 
                key={article.id}
                className="group flex flex-col md:flex-row gap-6 p-1 transition-all"
              >
                {/* Visual Type Indicator / Image */}
                <div className="shrink-0 w-full md:w-48 h-32 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden relative group-hover:border-blue-500/30 transition-colors shadow-sm">
                   {article.featuredImage ? (
                     <img 
                       src={article.featuredImage} 
                       alt={article.title_ja} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                   ) : (
                     <>
                       {article.category === 'CAUTION' ? (
                         <AlertTriangle className="w-10 h-10 text-rose-500/40 group-hover:text-rose-500 transition-colors" />
                       ) : (
                         <BookOpen className="w-10 h-10 text-blue-500/40 group-hover:text-blue-500 transition-colors" />
                       )}
                     </>
                   )}
                   <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white ${article.category === 'CAUTION' ? 'bg-rose-500' : 'bg-blue-600'}`}>
                     {article.category === 'CAUTION' ? 'リスク管理' : 'ノウハウ'}
                   </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 text-[12px] font-bold text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.publishDate).toLocaleDateString('ja-JP')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span className="flex items-center gap-1 text-zinc-500">
                      {article.category === 'CAUTION' ? 'CAUTION & RISK' : 'GUIDE & PROCESS'}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {article.title_ja || article.title_vi}
                  </h2>
                  
                  <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 text-[15px] leading-relaxed">
                    {article.content_ja ? article.content_ja.replace(/[#*]/g, '').substring(0, 120) : article.content_vi.replace(/[#*]/g, '').substring(0, 120)}...
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {article.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded transition-colors group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center md:self-center">
                  <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Modern Japanese CTA Section */}
      <section className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">最新の投資情報をいち早くお届け</h2>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">
            Keibai Finderの公式ニュースレターでは、激アツ物件の速報や専門家による市場解説を定期的にお届けしています。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="メールアドレス" 
              className="flex-1 px-5 py-3 rounded-lg bg-zinc-800 dark:bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            />
            <button className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-sm">
              無料で購読する
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            ※ いつでも配信停止が可能です。プライバシーポリシーをご確認ください。
          </p>
        </div>
      </section>
    </div>
  );
}
