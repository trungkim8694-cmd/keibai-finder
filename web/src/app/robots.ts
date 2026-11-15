import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';

  return {
    rules: [
      // 1. General Search Engines (Googlebot, Bingbot, DuckDuckBot, etc.)
      // Toàn quyền cào dữ liệu và lập chỉ mục 100% nội dung công khai
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/*?*keyword=*', // Chống lãng phí Crawl Budget vào query params tìm kiếm nội bộ
        ],
      },

      // 2. AI Search & Generative Engine Optimization (GEO Crawlers)
      // Mở toàn diện cho các AI Search lớn (ChatGPT, Perplexity, Claude, Apple, Google Gemini)
      // Định hướng AI đọc trực tiếp bản đồ tri thức /llms.txt
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'Applebot',
          'Applebot-Extended',
          'Google-Extended',
          'cohere-ai',
          'Diffbot',
        ],
        allow: ['/', '/llms.txt'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/login/',
          '/*?*keyword=*',
        ],
      },

      // 3. Toxic, Aggressive & Non-Search Scraper Bots (Phòng ngự bot độc hại / cào trộm tài nguyên VPS)
      // Chặn đứng các bot cào dồn dập không tạo ra lượt click hay giá trị Organic SEO
      {
        userAgent: [
          'Bytespider', // ByteDance scraper gây quá tải server
          'PetalBot', // Huawei scraper không có traffic tại Nhật
          'MJ12bot', // Majestic backlink spam crawler
          'MegaIndex.ru', // Russian SEO scraper
          'MegaIndex',
          'BLEXBot', // WebMeUp scraper
          'ZoominfoBot', // B2B lead scraper thương mại
          'Seekport Crawler',
          'Scrapy', // Scraper tool mặc định của Python
          'DataForSeoBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
