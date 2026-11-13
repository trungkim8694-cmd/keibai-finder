import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  HomeIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  InboxArrowDownIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  // Count pending reviews
  const [pendingClaimsCount, pendingDelistsCount] = await Promise.all([
    prisma.companyClaimRequest.count({ where: { status: 'PENDING' } }),
    prisma.companyDelistRequest.count({ where: { status: 'PENDING' } }),
  ]);
  const totalPendingReviews = pendingClaimsCount + pendingDelistsCount;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex flex-col shrink-0 border-r border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Keibai Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            id="admin-nav-dashboard"
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <ChartBarIcon className="w-4 h-4 text-zinc-500" />
            <span>システム概要</span>
          </Link>

          <Link
            id="admin-nav-claims"
            href="/admin/claims"
            className="flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
              <span>オーナー認証・削除審査</span>
            </div>
            {totalPendingReviews > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                {totalPendingReviews}
              </span>
            )}
          </Link>

          <Link
            id="admin-nav-companies"
            href="/admin/companies"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <BuildingOffice2Icon className="w-4 h-4 text-blue-500" />
            <span>全国宅建会社DB管理</span>
          </Link>

          <Link
            id="admin-nav-leads"
            href="/admin/leads"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <InboxArrowDownIcon className="w-4 h-4 text-emerald-500" />
            <span>顧客リード・配信管理</span>
          </Link>

          <Link
            id="admin-nav-users"
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <UsersIcon className="w-4 h-4 text-purple-500" />
            <span>ユーザー管理</span>
          </Link>

          <Link
            id="admin-nav-comments"
            href="/admin/comments"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-sky-500" />
            <span>コメント管理</span>
          </Link>

          <Link
            id="admin-nav-seo-agent"
            href="/admin/seo-agent"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all"
          >
            <SparklesIcon className="w-4 h-4 text-amber-500" />
            <span>AI記事自動生成 (SEO Agent)</span>
          </Link>

          <hr className="border-zinc-200 dark:border-zinc-800 my-4" />

          <Link
            id="admin-nav-home"
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-all"
          >
            <HomeIcon className="w-4 h-4 text-zinc-400" />
            <span>メインホーム</span>
          </Link>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 text-center font-medium">
          管理者: {session.user.email}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-base">総合管理コンソール</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-full">
              ADMINISTRATOR
            </span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              ユーザーマイページ ↗
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
