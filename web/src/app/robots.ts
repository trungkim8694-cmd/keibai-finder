import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.keibai-koubai.com';

  return {
    rules: [
      // 1. General Search Engines (Googlebot, Bingbot, DuckDuckBot, Yahoo! Slurp, etc.)
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/auth/session',
          '/llms.txt',
          '/llms-full.txt',
          '/api/public/',
          '/.well-known/ai-plugin.json',
        ],
        disallow: [
          '/api/admin/',
          '/api/auth/',
          '/api/cron/',
          '/api/upload/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/*?*keyword=*',
          '/en/',
          '/vi/',
          '/zh/',
          '/ja/',
        ],
      },

      // 2. AI Search & Generative Engine Optimization (GEO Crawlers)
      // Open access to all authoritative pages, llms.txt, llms-full.txt, and public AI JSON feed
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',
          'Claude-Web',
          'Claude-SearchBot',
          'Claude-User',
          'anthropic-ai',
          'Applebot',
          'Applebot-Extended',
          'Google-Extended',
          'GoogleOther',
          'Google-CloudVertexBot',
          'Amazonbot',
          'Meta-ExternalAgent',
          'Meta-ExternalFetcher',
          'DuckAssistBot',
          'YouBot',
          'MistralAI-User',
          'cohere-ai',
          'Diffbot',
        ],
        allow: [
          '/',
          '/api/auth/session',
          '/llms.txt',
          '/llms-full.txt',
          '/api/public/',
          '/.well-known/ai-plugin.json',
        ],
        disallow: [
          '/api/admin/',
          '/api/auth/',
          '/api/cron/',
          '/api/upload/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/en/',
          '/vi/',
          '/zh/',
          '/ja/',
        ],
      },

      // 3. Aggressive Non-Search Scraper Bots (Block to protect server resources)
      {
        userAgent: [
          'Bytespider',
          'PetalBot',
          'MJ12bot',
          'MegaIndex.ru',
          'MegaIndex',
          'BLEXBot',
          'ZoominfoBot',
          'Seekport Crawler',
          'Scrapy',
          'DataForSeoBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap/core.xml`,
    ],
  };
}
