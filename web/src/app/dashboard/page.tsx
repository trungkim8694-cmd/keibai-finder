import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getUserFavorites } from '@/actions/userDashboardActions';
import { FavoriteList } from '@/components/Dashboard/FavoriteList';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const maskName = (name: string | null): string => {
  if (!name) return '匿名ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '匿名ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/?login=true');
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role || 'USER';
  const favorites = await getUserFavorites(userId);

  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { userId }
  });
  const hasAgency = !!agencyProfile;

  const maskedName = session.user.name ? maskName(session.user.name) : '匿名ユーザー';

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* User Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
              {Array.from(maskedName)[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                こんにちは、{maskedName}さん
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {session.user.email}
              </p>
            </div>
          </div>

        </div>

        {/* Agency CTA/Management Card */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl border border-blue-500/20 dark:border-blue-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                💼 {hasAgency ? 'サポート会社・プロフィール管理' : '競売不動産のサポート会社様へ（掲載無料）'}
              </h3>
              
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 space-y-2">
                <p>
                  {hasAgency
                    ? '連絡先情報の更新、対応エリアの編集、および受け取った評価・クチコミの確認が行えます。'
                    : '会社情報と対応エリアをご登録いただくことで、該当エリアの物件詳細ページに連絡先を表示し、効率的に集客を行えます。'}
                </p>
                <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2 mt-2">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">【掲載登録のメリット】</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <li>対応エリア内での見込み客（顧客）の自然流入・直接問い合わせの獲得</li>
                    <li>月間数百万ユーザーが閲覧する keibai-koubai.com での貴社アピール・PR</li>
                    <li>会社専用の紹介ページ（SEO最適化）および評価・クチコミ機能の無料利用</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/agency"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-3 sm:py-2.5 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all shrink-0 group"
          >
            {hasAgency ? 'プロフィール編集' : 'サポート会社表示の申請'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
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
        <FavoriteList initialFavorites={favorites as any} userId={userId} />
      </div>
    </div>
  );
}
