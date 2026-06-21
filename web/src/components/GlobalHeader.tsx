import Link from 'next/link';
import HeaderFavLink from './HeaderFavLink';
import UserMenu from './UserMenu';
import HeaderTotalCount from './HeaderTotalCount';
import { getTotalPropertiesCount } from '@/actions/propertyActions';

export default async function GlobalHeader() {
  const totalCount = await getTotalPropertiesCount();

  return (
    <header className="sticky top-0 z-[10000] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 lg:py-2 flex items-center justify-between shadow-sm">
       <Link href="/" className="text-lg lg:text-base font-bold flex items-center shrink-0 gap-2 group">
          <img src="/extension-icon.png" alt="Keibai-Koubai Finder Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm group-hover:opacity-90 transition-opacity" />
           <span className="hidden sm:flex tracking-tight items-center text-zinc-900 dark:text-white">
             <span className="text-blue-600 dark:text-blue-500">keibai</span>
             <span className="text-zinc-400 dark:text-zinc-600">-</span>
             <span className="text-red-600 dark:text-red-500">koubai</span>
             <span className="text-zinc-500 dark:text-zinc-400">.com</span>
           </span>
       </Link>
       <div className="flex items-center gap-2 sm:gap-3 lg:gap-2">
         <HeaderTotalCount initialCount={totalCount} />
         <HeaderFavLink />
         <UserMenu />
       </div>
    </header>
  );
}
