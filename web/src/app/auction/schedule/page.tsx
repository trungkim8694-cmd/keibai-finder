import { Metadata } from 'next';
import Link from 'next/link';
import { getAuctionSchedule } from '@/actions/scheduleActions';
import AuctionScheduleClient from './AuctionScheduleClient';

export const revalidate = 3600; // ISR 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const title = `【${year}年${month}月最新】不動産競売・公売売却スケジュールカレンダー｜入札締切・開札日一覧`;
  const description = `全国47都道府県の地方裁判所（BIT）および国税庁（NTA）公売の売却スケジュールカレンダー。入札開始日、入札締切日、開札期日を日付・裁判所別に網羅。投資計画と資金手当てをサポート。`;

  return {
    title,
    description,
    keywords: [
      '競売 スケジュール',
      '公売 スケジュール',
      '裁判所 入札期間',
      '開札日 カレンダー',
      '不動産競売 カレンダー',
      'BIT スケジュール',
      '公売 入札締切日',
      '競売 日程'
    ],
    openGraph: {
      title: `${title}｜Keibai Finder`,
      description,
      url: 'https://www.keibai-koubai.com/auction/schedule',
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: '不動産競売・公売 売却スケジュールカレンダー' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
    alternates: {
      canonical: 'https://www.keibai-koubai.com/auction/schedule',
    },
  };
}

export default async function AuctionSchedulePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Pre-fetch initial schedule data on server
  const scheduleData = await getAuctionSchedule(year, month, 'ALL', 'end_date');

  // Breadcrumbs Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://www.keibai-koubai.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '競売スケジュール',
        item: 'https://www.keibai-koubai.com/auction/schedule',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '売却スケジュールカレンダー',
        item: 'https://www.keibai-koubai.com/auction/schedule',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="パンくずリスト" className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#1B4F8A] transition-colors">
              ホーム
            </Link>
            <span>/</span>
            <Link href="/auction/schedule" className="hover:text-[#1B4F8A] transition-colors">
              競売スケジュール
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              売却スケジュールカレンダー
            </span>
          </nav>

          {/* Interactive Schedule Component */}
          <AuctionScheduleClient initialData={scheduleData} />
        </div>
      </div>
    </>
  );
}
