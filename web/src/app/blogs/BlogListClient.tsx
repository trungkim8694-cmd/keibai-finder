'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Calendar, Clock, BookOpen, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';

export interface BlogArticleItem {
  id: string;
  slug: string;
  category: string;
  title_ja: string;
  title_vi?: string;
  content_ja: string;
  content_vi?: string;
  featuredImage: string | null;
  publishDate: string;
  tags: string[];
}

interface BlogListClientProps {
  articles: BlogArticleItem[];
}

export default function BlogListClient({ articles }: BlogListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'GUIDE' | 'CAUTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Counts for tabs
  const countAll = articles.length;
  const countGuide = useMemo(() => articles.filter(a => a.category === 'GUIDE').length, [articles]);
  const countCaution = useMemo(() => articles.filter(a => a.category === 'CAUTION').length, [articles]);

  // Extract popular unique tags
  const popularTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    articles.forEach(a => {
      a.tags?.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Category match
      if (selectedCategory !== 'ALL' && article.category !== selectedCategory) {
        return false;
      }

      // Tag match
      if (selectedTag && (!article.tags || !article.tags.includes(selectedTag))) {
        return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const title = (article.title_ja || article.title_vi || '').toLowerCase();
        const content = (article.content_ja || article.content_vi || '').toLowerCase();
        const tags = (article.tags || []).join(' ').toLowerCase();

        return title.includes(query) || content.includes(query) || tags.includes(query);
      }

      return true;
    });
  }, [articles, selectedCategory, selectedTag, searchQuery]);

  // Clean excerpt helper
  const getCleanExcerpt = (content: string, length = 110) => {
    if (!content) return '';
    return content
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // unwrap links
      .replace(/[#*`_>]/g, '') // remove markdown symbols
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, length) + '...';
  };

  // Estimate read time
  const getReadTime = (content: string) => {
    const charCount = content ? content.length : 0;
    const mins = Math.max(1, Math.round(charCount / 500));
    return `${mins}分`;
  };

  // Format date ja-JP
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch {
      return isoString;
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setSelectedTag(null);
  };

  const isFiltering = selectedCategory !== 'ALL' || Boolean(searchQuery.trim()) || Boolean(selectedTag);

  // Spotlight article (first item if in ALL and no search/tag)
  const isSpotlightAvailable = !isFiltering && filteredArticles.length > 0;
  const spotlightArticle = isSpotlightAvailable ? filteredArticles[0] : null;
  const gridArticles = isSpotlightAvailable ? filteredArticles.slice(1) : filteredArticles;

  return (
    <div className="space-y-6">
      {/* 1. B2B Filter Toolbar */}
      <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Category Tabs with min-h-[40px] touch target */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="カテゴリー選択">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'ALL'}
              onClick={() => setSelectedCategory('ALL')}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>すべて</span>
              <span className={`tabular-nums text-[11px] font-mono px-1.5 py-0.5 rounded ${
                selectedCategory === 'ALL' ? 'bg-[#143D6C] text-slate-100' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {countAll}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'GUIDE'}
              onClick={() => setSelectedCategory('GUIDE')}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'GUIDE'
                  ? 'bg-[#1B4F8A] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>実践ガイド</span>
              <span className={`tabular-nums text-[11px] font-mono px-1.5 py-0.5 rounded ${
                selectedCategory === 'GUIDE' ? 'bg-[#143D6C] text-slate-100' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {countGuide}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'CAUTION'}
              onClick={() => setSelectedCategory('CAUTION')}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'CAUTION'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>リスク管理・注意点</span>
              <span className={`tabular-nums text-[11px] font-mono px-1.5 py-0.5 rounded ${
                selectedCategory === 'CAUTION' ? 'bg-rose-900 text-rose-100' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {countCaution}
              </span>
            </button>
          </div>

          {/* Search Box with min-h-[40px] touch target */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="タイトル・キーワードで検索..."
              className="w-full min-h-[40px] pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="検索ワードを消去"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Tags Row & Active Tag Indicator */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">頻出テーマ:</span>
            {popularTags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`min-h-[32px] sm:min-h-[28px] text-xs px-2.5 py-1 rounded-md transition-colors flex items-center ${
                    isSelected
                      ? 'bg-[#1B4F8A] text-white font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              該当記事: <strong className="text-slate-900 dark:text-slate-100 font-bold tabular-nums font-mono">{filteredArticles.length}</strong> 件
            </span>

            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[32px] inline-flex items-center gap-1 px-2 py-1 text-[11px] text-[#1B4F8A] dark:text-sky-400 hover:underline font-medium rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>条件をクリア</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Spotlight Hero Article (Only when on ALL and no query) */}
      {spotlightArticle && (
        <section aria-label="注目の最新ガイド" className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg overflow-hidden hover:border-[#1B4F8A]/40 dark:hover:border-sky-500/40 transition-colors">
          <Link href={`/blogs/${spotlightArticle.slug}`} className="group grid grid-cols-1 md:grid-cols-12 gap-5 p-5 md:p-6">
            <div className="md:col-span-5 relative aspect-video md:aspect-[16/10] bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shrink-0">
              {spotlightArticle.featuredImage ? (
                <img
                  src={spotlightArticle.featuredImage}
                  alt={spotlightArticle.title_ja}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  {spotlightArticle.category === 'CAUTION' ? (
                    <AlertTriangle className="w-12 h-12 text-rose-500/50" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-[#1B4F8A]/50" />
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                  {spotlightArticle.category === 'CAUTION' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      リスク管理・注意点
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-sky-300 dark:border-blue-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-sky-400"></span>
                      実務ガイド
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(spotlightArticle.publishDate)}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {getReadTime(spotlightArticle.content_ja || spotlightArticle.content_vi || '')}
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-2 mb-2">
                  {spotlightArticle.title_ja || spotlightArticle.title_vi}
                </h2>

                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {getCleanExcerpt(spotlightArticle.content_ja || spotlightArticle.content_vi || '', 140)}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-wrap gap-1.5">
                  {spotlightArticle.tags?.slice(0, 4).map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4F8A] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  詳細を読む
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 3. Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">該当する記事が見つかりませんでした</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              別の検索キーワードを入力するか、カテゴリーの絞り込みを解除してお試しください。
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>すべての記事を表示</span>
          </button>
        </div>
      ) : (
        /* 4. Article Grid (Responsive 2 to 3 columns on desktop max-w-7xl) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridArticles.map((article) => {
            const isCaution = article.category === 'CAUTION';
            return (
              <article
                key={article.id}
                className="b2b-card bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-lg overflow-hidden flex flex-col hover:border-[#1B4F8A]/40 dark:hover:border-sky-500/40 transition-colors"
              >
                <Link href={`/blogs/${article.slug}`} className="group flex flex-col h-full">
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 overflow-hidden shrink-0">
                    {article.featuredImage ? (
                      <img
                        src={article.featuredImage}
                        alt={article.title_ja}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {isCaution ? (
                          <AlertTriangle className="w-8 h-8 text-rose-500/40" />
                        ) : (
                          <BookOpen className="w-8 h-8 text-[#1B4F8A]/40" />
                        )}
                      </div>
                    )}

                    {/* Solid elegant badge background replacing backdrop-blur-xs */}
                    <div className="absolute top-2.5 left-2.5">
                      {isCaution ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold bg-white/95 dark:bg-zinc-900/95 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          リスク管理
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold bg-white/95 dark:bg-zinc-900/95 text-[#1B4F8A] dark:text-sky-300 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-sky-400"></span>
                          実務ガイド
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 tabular-nums font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(article.publishDate)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {getReadTime(article.content_ja || article.content_vi || '')}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1B4F8A] dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-2">
                        {article.title_ja || article.title_vi}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {getCleanExcerpt(article.content_ja || article.content_vi || '', 90)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4F8A] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                        読む
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
