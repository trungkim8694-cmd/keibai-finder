/**
 * Autonomous Standalone Cron Runner for AI SEO Article Generation
 * Can be scheduled via:
 * - Windows Task Scheduler
 * - Linux crontab (e.g. 0 9 * * 1 node /path/to/scripts/cron_seo_agent.js)
 * - PM2 cron / Docker
 */

const fs = require('fs');
const path = require('path');

async function runCronJob() {
  console.log('====================================================');
  console.log(`[SEO-AGENT] Cron trigger initiated at: ${new Date().toISOString()}`);
  console.log('====================================================');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || '';

  const headers = {
    'Content-Type': 'application/json',
  };
  if (cronSecret) {
    headers['Authorization'] = `Bearer ${cronSecret}`;
  }

  const endpoint = `${baseUrl}/api/cron/generate-seo-article`;
  console.log(`[SEO-AGENT] Calling endpoint: ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dryRun: false
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error('[SEO-AGENT] Error response:', data);
      process.exit(1);
    }

    console.log('[SEO-AGENT] Generation succeeded!');
    console.log('----------------------------------------------------');
    console.log(`Title: ${data.result?.article?.title}`);
    console.log(`Slug: ${data.result?.article?.slug}`);
    console.log(`Category: ${data.result?.article?.category}`);
    console.log(`Characters: ${data.result?.article?.characterCount} chars`);
    console.log(`Keyword: ${data.result?.seoIntelligence?.primaryKeyword} (Volume: ${data.result?.seoIntelligence?.monthlySearchVolume}/mo)`);
    console.log(`Engine: ${data.result?.seoIntelligence?.generationSource}`);
    console.log(`Duration: ${data.result?.durationMs}ms`);
    console.log(`URL: ${baseUrl}${data.result?.article?.url}`);
    console.log('====================================================');
  } catch (err) {
    console.error('[SEO-AGENT] Fatal execution error:', err.message);
    process.exit(1);
  }
}

runCronJob();
