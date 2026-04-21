import React from 'react';
import { getAreaStats } from '@/actions/propertyActions';
import Link from 'next/link';
import { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import AreaSearchFilter from '@/components/AreaSearchFilter';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: '地域・都道府県から競売物件を探す | Keibai-Koubai Finder',
  description: '全国47都道府県の地域から不動産競売・公売物件を検索。希望のエリアで相場より安い戸建てやマンションを見つけることができます。',
};

// Japanese regions mapping
const REGIONS = [
  { name: '北海道・東北', prefs: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { name: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { name: '北陸・甲信越', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県'] },
  { name: '東海', prefs: ['岐阜県', '静岡県', '愛知県', '三重県'] },
  { name: '関西', prefs: ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { name: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { name: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { name: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
];

export default async function AreaIndexPage() {
  const areaStats = await getAreaStats();
  const totalProperties = areaStats['全国'] || 0;

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-500" />
            地域から探す
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            全国で<span className="font-bold text-zinc-800 dark:text-zinc-200">{totalProperties}</span>件の不動産競売・公売物件が募集されています。
          </p>
        </div>
      </div>

      <AreaSearchFilter areaStats={areaStats} regions={REGIONS} />
    </div>
  );
}
