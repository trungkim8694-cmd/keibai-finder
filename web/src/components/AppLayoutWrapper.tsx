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
      <>
        {header}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative w-full h-full">
          <main className="flex-1 w-full min-h-0 flex flex-col overflow-hidden h-full">
            {children}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full">
        <main className="flex-1 w-full">
          {children}
        </main>
        <GlobalFooter />
      </div>
    </>
  );
}
