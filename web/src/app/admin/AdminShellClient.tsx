'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  InboxArrowDownIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface AdminShellClientProps {
  adminEmail: string;
  totalPendingReviews: number;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

export default function AdminShellClient({
  adminEmail,
  totalPendingReviews,
  children,
}: AdminShellClientProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      id: "admin-nav-dashboard",
      href: "/admin",
      label: "システム概要",
      icon: ChartBarIcon,
    },
    {
      id: "admin-nav-claims",
      href: "/admin/claims",
      label: "オーナー認証・削除審査",
      icon: ShieldCheckIcon,
      badge: totalPendingReviews > 0 ? totalPendingReviews : undefined,
    },
    {
      id: "admin-nav-companies",
      href: "/admin/companies",
      label: "全国宅建会社DB管理",
      icon: BuildingOffice2Icon,
    },
    {
      id: "admin-nav-agencies",
      href: "/admin/agencies",
      label: "パートナー事務所管理",
      icon: BriefcaseIcon,
    },
    {
      id: "admin-nav-leads",
      href: "/admin/leads",
      label: "顧客リード・配信管理",
      icon: InboxArrowDownIcon,
    },
    {
      id: "admin-nav-users",
      href: "/admin/users",
      label: "ユーザー管理",
      icon: UsersIcon,
    },
    {
      id: "admin-nav-comments",
      href: "/admin/comments",
      label: "コメント管理",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: "admin-nav-seo-agent",
      href: "/admin/seo-agent",
      label: "AI記事自動生成 (SEO Agent)",
      icon: DocumentTextIcon,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="管理メニュー">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.id}
            id={item.id}
            href={item.href}
            className={`flex items-center justify-between px-3 min-h-[44px] text-xs font-semibold rounded-lg transition-colors ${
              active
                ? "bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-[#1B4F8A]/25 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-[#1B4F8A] dark:text-blue-300" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full tabular-nums shrink-0">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      <hr className="border-slate-200 dark:border-slate-800 my-3" />

      <Link
        id="admin-nav-home"
        href="/"
        className="flex items-center gap-3 px-3 min-h-[44px] text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
      >
        <HomeIcon className="w-4 h-4 text-slate-400 shrink-0" />
        <span>メインホームへ戻る</span>
      </Link>
    </nav>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#151B22] text-slate-800 dark:text-slate-200 flex-col shrink-0 border-r border-slate-200 dark:border-slate-800">
        <div className="h-14 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1B4F8A]" />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Keibai Admin
            </span>
          </Link>
        </div>

        {renderNavLinks()}

        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 truncate">
          管理者: {adminEmail}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#151B22] text-slate-800 dark:text-slate-200 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 z-10">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <Link href="/admin" className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1B4F8A]" />
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Keibai Admin
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="メニューを閉じる"
                className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {renderNavLinks()}

            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              管理者: {adminEmail}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white dark:bg-[#151B22] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="管理メニューを開く"
              className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              総合管理コンソール
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center text-[11px] px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40 font-semibold rounded-md">
              ADMINISTRATOR
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 min-h-[36px] px-2.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              <span>マイページ</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Single Top-Level Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
