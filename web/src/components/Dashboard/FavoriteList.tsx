'use client';

import { useState } from 'react';
import PropertyCard from '../PropertyCard';
import FavoriteButton from '../FavoriteButton';
import { removeFavorite } from '@/actions/userDashboardActions';
import { useRouter } from 'next/navigation';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import dayjs from 'dayjs';

interface FavoriteItem {
  propertyId: string;
  property: any | null;
  favoritedAt: Date;
}

export function FavoriteList({ initialFavorites, userId }: { initialFavorites: FavoriteItem[], userId: string }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);
  const router = useRouter();

  const handleRemove = async (sale_unit_id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('お気に入りから削除しますか？')) return;
    
    // Optimistic UI update
    setFavorites(prev => prev.filter(f => f.propertyId !== sale_unit_id));
    
    const res = await removeFavorite(userId, sale_unit_id);
    if (res.success) {
      router.refresh(); // Tells Next.js to re-fetch Server Components softly to sync Header count
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="text-4xl mb-4 opacity-50">💔</div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">お気に入りがありません</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
          気になる物件を見つけて❤️アイコンをクリックすると、<br/>ここに保存されます。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((item) => {
        const id = item.propertyId;
        const p = item.property;
        
        if (!p) {
          // Render Dead Property Card - Make it resemble PropertyCard's proportions
          return (
            <div key={id} className="relative group bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 min-h-[220px] sm:min-h-[192px] flex flex-col items-center justify-center text-center p-6 mb-4 mt-2">
              <div className="absolute top-3 right-3 pointer-events-auto">
                 <FavoriteButton id={id} />
              </div>
              <ExclamationTriangleIcon className="w-10 h-10 text-zinc-400 mb-2" />
              <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2">物件が見つかりません</h4>
              <p className="text-xs text-zinc-500 max-w-[200px]">
                この物件はシステムから削除されたか、情報が非公開になっています。
              </p>
              <div className="mt-3 text-[10px] bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">
                ID: {id}
              </div>
            </div>
          );
        }
        
        return (
          <div key={p.sale_unit_id} className="relative group">
            {/* Added Date Label */}
            <div className="absolute top-2 left-2 z-40 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold pointer-events-none">
              登録日: {dayjs(item.favoritedAt).format('YYYY/MM/DD')}
            </div>

            <PropertyCard property={p} layout="vertical" />
          </div>
        );
      })}
    </div>
  );
}
