'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalFooter from './GlobalFooter';

export default function AppLayoutWrapper({
  header,
  children,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isMapRoute = pathname === '/map' || pathname?.startsWith('/area-map');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isMapRoute) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden">
        {header}
        <main className="flex-1 w-full min-h-0 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      {header}
      <main className="flex-1 w-full">
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
}
