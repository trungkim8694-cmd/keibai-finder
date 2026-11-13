'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import SignupModal from '@/components/SignupModal';
import { addFavorite, removeFavorite } from '@/actions/userDashboardActions';
import { Bookmark } from 'lucide-react';

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-app-client': 'keibai-finder-client'
  }
}).then(res => res.json());

export default function FavoriteButton({ 
  id,
  compact = false,
  className = ''
}: { 
  id: string;
  compact?: boolean;
  className?: string;
}) {
   const { data: session, status } = useSession();
   const [isFavLocal, setIsFavLocal] = useState(false);
   const [isAnimating, setIsAnimating] = useState(false);
   const [showModal, setShowModal] = useState(false);

   const { data: serverFavs, mutate } = useSWR(
     status === 'authenticated' ? '/api/favorites' : null, 
     fetcher
   );

   const isFav = status === 'authenticated' 
     ? serverFavs?.favorites?.includes(id) || false
     : isFavLocal;

   useEffect(() => {
     if (status !== 'authenticated') {
       try {
         const favs = JSON.parse(localStorage.getItem('keibai_favorites') || '[]');
         setIsFavLocal(favs.includes(id));
       } catch(e){}
     }
   }, [id, status]);

   const toggleFav = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newFavState = !isFav;
      
      if (status === 'authenticated') {
        const userId = (session.user as any).id;
        const currentFavs = serverFavs?.favorites || [];
        
        if (newFavState) {
           if (currentFavs.length >= 20) {
             alert('お気に入り登録は最大20件までです。\n不要な物件を整理してください。');
             return;
           }
           mutate({ favorites: [...currentFavs, id] }, false);
           setIsAnimating(true);
           setTimeout(() => setIsAnimating(false), 300);
           
           const res = await addFavorite(userId, id);
           if (!res.success) {
             if (res.error === 'LIMIT_REACHED') alert('制限に達しました。');
             mutate();
           }
        } else {
           mutate({ favorites: currentFavs.filter((f: string) => f !== id) }, false);
           await removeFavorite(userId, id);
        }
      } else {
        setShowModal(true);
      }
   };

   return (
     <>
       <button 
          onClick={toggleFav}
          className={`${compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'} rounded-md border flex items-center justify-center gap-1.5 transition-colors font-medium shadow-2xs ${
            isFav 
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800'
          } ${isAnimating ? 'scale-105' : 'scale-100'} ${className}`}
          title={isFav ? 'お気に入り解除' : 'お気に入り登録'}
          aria-label={isFav ? 'お気に入り解除' : 'お気に入り登録'}
       >
          <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-blue-600 text-blue-600' : 'text-slate-500'}`} />
          {!compact && <span className="hidden sm:inline">{isFav ? '保存済み' : 'お気に入り'}</span>}
       </button>
       <SignupModal isOpen={showModal} onClose={() => setShowModal(false)} />
     </>
   );
}
