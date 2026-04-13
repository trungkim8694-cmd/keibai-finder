import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getUserFavorites } from '@/actions/userDashboardActions';
import { FavoriteList } from '@/components/Dashboard/FavoriteList';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/?login=true');
  }

  const userId = (session.user as any).id;
  const favorites = await getUserFavorites(userId);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* User Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-white shrink-0">
               {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                    {session.user.name?.[0] || 'U'}
                  </div>
               )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                こんにちは、{session.user.name}さん
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-3 sm:py-2">
             <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mr-2 uppercase tracking-wide">現在のプラン</span>
             <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded shadow-sm">
               無料プラン
             </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-8">
           <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
             ❤️ お気に入り物件
             <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
               ({favorites.length}/20)
             </span>
           </h2>
        </div>

        {/* Content Area */}
        <FavoriteList initialFavorites={favorites} userId={userId} />
      </div>
    </div>
  );
}
