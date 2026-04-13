'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import SignupModal from './SignupModal';
import { addFavorite, removeFavorite } from '@/actions/userDashboardActions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FavoriteButton({ id }: { id: string }) {
   const { data: session, status } = useSession();
   const [isFavLocal, setIsFavLocal] = useState(false);
   const [isAnimating, setIsAnimating] = useState(false);
   const [showModal, setShowModal] = useState(false);

   // For authenticated users, SWR shares global state for all FavoriteButtons automatically based on the URL key
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
      e.preventDefault(); // prevent navigation if wrapped in link
      e.stopPropagation();

      const newFavState = !isFav;
      
      if (status === 'authenticated') {
        const userId = (session.user as any).id;
        const currentFavs = serverFavs?.favorites || [];
        
        if (newFavState) {
           if (currentFavs.length >= 20) {
             alert('お気に入り登録は最大20件までです。(Giới hạn 20 tài sản)\n不要な物件を削除するか、有料プランをご検討ください。');
             return;
           }
           // Optimistic update
           mutate({ favorites: [...currentFavs, id] }, false);
           setIsAnimating(true);
           setTimeout(() => setIsAnimating(false), 300);
           
           const res = await addFavorite(userId, id);
           if (!res.success) {
             if (res.error === 'LIMIT_REACHED') alert('制限に達しました。');
             mutate(); // Re-fetch correct state on failure
           }
        } else {
           mutate({ favorites: currentFavs.filter((f: string) => f !== id) }, false);
           await removeFavorite(userId, id);
        }
      } else {
        // LocalStorage for Guest
        try {
           let favs = JSON.parse(localStorage.getItem('keibai_favorites') || '[]');
           if (newFavState) {
              if (!favs.includes(id)) {
                 if (favs.length >= 5) {
                   setShowModal(true);
                   return;
                 }
                 favs.push(id);
              }
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 300);
           } else {
              favs = favs.filter((f: string) => f !== id);
           }
           localStorage.setItem('keibai_favorites', JSON.stringify(favs));
           setIsFavLocal(newFavState);
           window.dispatchEvent(new Event('favorites_updated'));
        } catch(e) {}
      }
   };

   return (
     <button 
        onClick={toggleFav}
        className={`relative rounded-full flex items-center justify-center transition-all duration-300 z-20 group shrink-0 ` + 
        (isFav 
            ? `bg-white/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${isAnimating ? 'scale-125' : 'scale-100 hover:scale-110'}` 
            : `bg-black/30 backdrop-blur-sm border border-white/50 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-black/40 hover:scale-110`)}
        style={{ width: '36px', height: '36px' }}
        aria-label="お気に入り"
     >
        {isFav ? (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="#E11D48" className="drop-shadow-sm">
             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
           </svg>
        ) : (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/60 drop-shadow-md group-hover:text-white transition-colors">
             <path fillRule="evenodd" clipRule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM12 19.9l1.1-1.02c4.9-4.51 8-7.39 8-10.38 0-2.22-1.78-4-4-4-1.54 0-3.04.88-3.79 2.22h-2.62c-.75-1.34-2.25-2.22-3.79-2.22-2.22 0-4 1.78-4 4 0 2.99 3.1 5.87 8 10.38l1.1 1.02z" />
           </svg>
        )}
        <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity pointer-events-none drop-shadow-md">
          {isFav ? 'お気に入り解除' : 'お気に入り登録'}
        </span>
        <SignupModal isOpen={showModal} onClose={() => setShowModal(false)} />
     </button>
   )
}
