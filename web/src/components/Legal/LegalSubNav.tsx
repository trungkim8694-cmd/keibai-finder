'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, FileText, Shield, ChevronRight } from 'lucide-react';

interface LegalSubNavProps {
  currentPageTitle: string;
}

export default function LegalSubNav({ currentPageTitle }: LegalSubNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/company', label: '会社概要 (Company Profile)', icon: Building2 },
    { href: '/terms', label: '利用規約 (Terms of Service)', icon: FileText },
    { href: '/privacy', label: 'プライバシーポリシー (Privacy Policy)', icon: Shield },
  ];

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
        <Link href="/" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
          ホーム
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">
          {currentPageTitle}
        </span>
      </nav>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#1B4F8A] text-[#1B4F8A] dark:border-blue-400 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/30 rounded-t-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
