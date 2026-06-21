import { prisma } from "@/lib/prisma";
import { UsersIcon, ChatBubbleLeftRightIcon, HomeIcon, CalendarIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";

export const revalidate = 0; // Disable static cache for admin dashboard

export default async function AdminDashboardPage() {
  const totalUsers = await prisma.user.count();
  const totalComments = await prisma.comment.count();
  const totalProperties = await prisma.property.count({ where: { status: 'ACTIVE' } });
  const totalAgencies = await prisma.agencyProfile.count();
  
  const latestProperty = await prisma.property.findFirst({
    orderBy: { created_at: 'desc' },
    select: { created_at: true }
  });

  const formattedDate = latestProperty?.created_at 
    ? new Date(latestProperty.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + " JST"
    : "不明";

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-black">管理システム概要</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          システムの動作数値および稼働ステータスをリアルタイムで監視します。
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Users */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">登録ユーザー数</span>
            <span className="text-2xl font-black tracking-tight">{totalUsers}</span>
          </div>
        </div>

        {/* Card 2: Agencies */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <BuildingOffice2Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">サポート会社数</span>
            <span className="text-2xl font-black tracking-tight">{totalAgencies}</span>
          </div>
        </div>

        {/* Card 3: Properties */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <HomeIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">稼働中の物件数</span>
            <span className="text-2xl font-black tracking-tight">{totalProperties}</span>
          </div>
        </div>

        {/* Card 4: Comments */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl shrink-0">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">総コメント数</span>
            <span className="text-2xl font-black tracking-tight">{totalComments}</span>
          </div>
        </div>

        {/* Card 5: Last Update */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">最終更新日時</span>
            <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate" title={formattedDate}>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Welcome Block */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-8 rounded-2xl text-zinc-900 border border-blue-100/60 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <h2 className="text-xl font-bold text-zinc-900">お帰りなさい、管理者様！</h2>
          <p className="text-zinc-650 text-sm leading-relaxed font-medium">
            Keibai Finderの管理画面へようこそ。ここでは、登録された一般ユーザーの管理、コメントの監視・検閲、稼働中の競売物件データの把握、および競売サポート会社の新規登録確認・宅建免許承認といった操作を一括して行うことができます。セキュリティと信頼性の高い環境維持にご協力をお願いいたします。
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 flex items-center justify-center select-none pointer-events-none">
          <span className="text-9xl">🛡️</span>
        </div>
      </div>
    </div>
  );
}
