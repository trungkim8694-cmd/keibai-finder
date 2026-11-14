import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/*?*keyword=*', // Chống crawl rác query params nội bộ
        ],
      },
      // Hỗ trợ và định hướng AI Search Crawlers (GEO / Perplexity / ChatGPT)
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'],
        allow: [
          '/',
          '/llms.txt',
          '/property/*',
          '/search/*',
          '/blogs/*',
          '/insights/*',
          '/market-insights',
          '/auction-results',
          '/auction/schedule',
          '/agencies*',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/*?*keyword=*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
