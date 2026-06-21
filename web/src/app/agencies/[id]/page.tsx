import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AgencyProfileClient } from '@/components/Agency/AgencyProfileClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

interface AgencyPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const agency = await prisma.agencyProfile.findUnique({
    where: { id },
  });

  if (!agency || !agency.isVerified) {
    return {
      title: '会社情報が見つかりません | Keibai Finder',
    };
  }

  return {
    title: `${agency.companyName} - 競売サポート会社 | Keibai Finder`,
    description: `${agency.companyName}の連絡先、宅建業免許、対応エリア、お客様によるクチコミや評価を表示しています。`,
  };
}

export default async function AgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUser = session?.user ? (session.user as any) : null;

  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { id },
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

  if (!agencyProfile) {
    notFound();
  }

  const isOwnProfile = currentUser && currentUser.id === agencyProfile.userId;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  if (!agencyProfile.isVerified && !isOwnProfile && !isAdmin) {
    notFound();
  }

  // Check if current user has already reviewed this agency
  let hasReviewed = false;
  if (currentUser) {
    const review = await prisma.agencyReview.findUnique({
      where: {
        agencyProfileId_userId: {
          agencyProfileId: id,
          userId: currentUser.id,
        },
      },
    });
    hasReviewed = !!review;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          ホームに戻る
        </Link>

        <AgencyProfileClient
          agencyProfile={agencyProfile}
          currentUser={currentUser}
          hasReviewed={hasReviewed}
        />
      </div>
    </div>
  );
}
