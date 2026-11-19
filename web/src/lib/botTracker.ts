import { prisma } from '@/lib/prisma';

const BOT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Googlebot-Image', pattern: /Googlebot-Image/i },
  { name: 'Googlebot-Mobile', pattern: /Googlebot.*Mobile/i },
  { name: 'Googlebot', pattern: /Googlebot/i },
  { name: 'Google-Extended', pattern: /Google-Extended/i },
  { name: 'Bingbot', pattern: /bingbot/i },
  { name: 'IndexNow', pattern: /IndexNow/i },
  { name: 'YandexBot', pattern: /YandexBot/i },
  { name: 'Applebot', pattern: /Applebot/i },
  { name: 'GPTBot', pattern: /GPTBot/i },
  { name: 'PerplexityBot', pattern: /PerplexityBot/i },
  { name: 'ClaudeBot', pattern: /ClaudeBot/i },
];

export function detectSearchBot(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return name;
    }
  }
  return null;
}

export function logBotHitAsync(params: {
  url: string;
  userAgent?: string | null;
  ip?: string | null;
  httpStatus?: number;
  responseTimeMs?: number;
}) {
  const botName = detectSearchBot(params.userAgent);
  if (!botName) return;

  // Execute asynchronously in background; never block or throw
  setImmediate(async () => {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO seo_bot_hits (bot_name, url, ip_address, user_agent, http_status, response_time_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        botName,
        params.url.slice(0, 500),
        (params.ip || '').slice(0, 100),
        (params.userAgent || '').slice(0, 500),
        params.httpStatus ?? 200,
        params.responseTimeMs ?? 0
      );
    } catch (e) {
      // Silently ignore logging errors to preserve zero-impact on latency
    }
  });
}
