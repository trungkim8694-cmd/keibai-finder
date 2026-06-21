import { prisma } from "@/lib/prisma";
import { UsersIcon, ChatBubbleLeftRightIcon, HomeIcon, CalendarIcon } from "@heroicons/react/24/outline";

export const revalidate = 0; // Disable static cache for admin dashboard

export default async function AdminDashboardPage() {
  const totalUsers = await prisma.user.count();
  const totalComments = await prisma.comment.count();
  const totalProperties = await prisma.property.count({ where: { status: 'ACTIVE' } });
  
  const latestProperty = await prisma.property.findFirst({
    orderBy: { created_at: 'desc' },
    select: { created_at: true }
  });

  const formattedDate = latestProperty?.created_at 
    ? new Date(latestProperty.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + " JST"
    : "Chưa rõ";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Hệ thống tổng quan</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Theo dõi số liệu hoạt động và trạng thái hệ thống.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Tổng người dùng</span>
            <span className="text-2xl font-black tracking-tight">{totalUsers}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Tổng bình luận</span>
            <span className="text-2xl font-black tracking-tight">{totalComments}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <HomeIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Bất động sản hoạt động</span>
            <span className="text-2xl font-black tracking-tight">{totalProperties}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Cập nhật mới nhất</span>
            <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Welcome Block */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-900 dark:to-zinc-900 p-8 rounded-2xl text-white border border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-xl">
          <h2 className="text-xl font-bold">Chào mừng trở lại, Administrator!</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Hệ thống quản trị Keibai Finder cho phép bạn theo dõi và kiểm duyệt người dùng, quản lý vai trò thành viên cũng như kiểm tra các bình luận spam hoặc không hợp lệ để giữ môi trường tương tác sạch sẽ.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center select-none pointer-events-none">
          <span className="text-9xl">🛡️</span>
        </div>
      </div>
    </div>
  );
}
