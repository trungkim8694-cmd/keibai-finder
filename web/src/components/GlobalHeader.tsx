import Link from 'next/link';
import HeaderFavLink from './HeaderFavLink';
import UserMenu from './UserMenu';
import GlobalHeaderMenu from './GlobalHeaderMenu';
import HeaderTotalCount from './HeaderTotalCount';
import { getTotalPropertiesCount } from '@/actions/propertyActions';

export default async function GlobalHeader() {
  const totalCount = await getTotalPropertiesCount();

  return (
    <header className="sticky top-0 z-[10000] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 lg:py-2 flex items-center justify-between shadow-sm">
       <a href="/" className="text-lg lg:text-base font-bold flex items-center shrink-0">
          <span className="text-blue-600 dark:text-blue-500">Keibai</span><span className="text-red-600 dark:text-red-500">K<span className="text-red-600 dark:text-red-500">o</span><span className="text-red-600 dark:text-red-500">u</span>bai</span><span className="text-zinc-900 dark:text-white">Finder</span>
       </a>
       <div className="flex items-center gap-2 sm:gap-3 lg:gap-2">
         <HeaderTotalCount initialCount={totalCount} />
         <HeaderFavLink />
         <UserMenu />
         <GlobalHeaderMenu />
       </div>
    </header>
  );
}
