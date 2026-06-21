import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AgencyForm } from '@/components/Dashboard/AgencyForm';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AgencyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/?login=true');
  }

  const userId = (session.user as any).id;

  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { userId },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            ダッシュボードに戻る
          </Link>

          {agencyProfile && (
            <Link
              href={`/agencies/${agencyProfile.id}`}
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-650 dark:text-blue-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
              target="_blank"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              詳細・クチコミを見る
            </Link>
          )}
        </div>

        <AgencyForm initialProfile={agencyProfile} />
      </div>
    </div>
  );
}
