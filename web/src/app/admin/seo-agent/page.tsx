import React from 'react';
import { prisma } from '@/lib/prisma';
import { KEIBAI_TREND_DATABASE, getMacroTrendStats } from '@/lib/keibaiTrendEngine';
import SeoAgentClient from './SeoAgentClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI 記事自動生成・SEO Agent 管理｜Keibai Admin',
  description: '検索需要急上昇キーワードに基づく自律型SEO記事生成エンジンの管理コンソール。'
};

export default async function AdminSeoAgentPage() {
  const [stats, recentDigests] = await Promise.all([
    Promise.resolve(getMacroTrendStats()),
    prisma.dailyDigest.findMany({
      orderBy: { publishDate: 'desc' },
      take: 20,
      select: {
        id: true,
        slug: true,
        title_ja: true,
        category: true,
        publishDate: true,
        tags: true,
        content_ja: true,
      }
    })
  ]);

  const recentArticles = recentDigests.map(d => ({
    id: d.id,
    slug: d.slug,
    title_ja: d.title_ja || '無題',
    category: d.category || 'GUIDE',
    publishDate: d.publishDate.toISOString(),
    tags: d.tags || [],
    characterCount: d.content_ja ? d.content_ja.length : 0
  }));

  // Sắp xếp topics theo độ ưu tiên tăng trưởng
  const sortedTopics = [...KEIBAI_TREND_DATABASE].sort((a, b) => b.growthMoM - a.growthMoM);

  return (
    <SeoAgentClient
      topics={sortedTopics}
      stats={stats}
      recentArticles={recentArticles}
    />
  );
}
