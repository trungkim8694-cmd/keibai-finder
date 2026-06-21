import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  HomeIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col shrink-0 border-r border-zinc-800">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Keibai Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link
            id="admin-nav-dashboard"
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Tổng quan</span>
          </Link>

          <Link
            id="admin-nav-users"
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
          >
            <UsersIcon className="w-5 h-5" />
            <span>Người dùng</span>
          </Link>

          <Link
            id="admin-nav-comments"
            href="/admin/comments"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>Bình luận</span>
          </Link>

          <hr className="border-zinc-800 my-4" />

          <Link
            id="admin-nav-home"
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-all"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Trang chủ chính</span>
          </Link>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
          Đăng nhập: {session.user.email}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-lg">Bảng quản trị</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-full">
              ADMIN
            </span>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
