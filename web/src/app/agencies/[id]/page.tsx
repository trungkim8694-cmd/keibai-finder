import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
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
      title: '会社情報が見つかりません',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/agencies/${id}`;

  return {
    title: `${agency.companyName} - 競売サポート会社`,
    description: `${agency.companyName}の連絡先、宅建業免許、対応エリア、お客様によるクチコミや評価を表示しています。`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${agency.companyName} - 競売サポート会社｜Keibai Finder`,
      description: `${agency.companyName}の連絡先、宅建業免許、対応エリア、お客様によるクチコミや評価を表示しています。`,
      url: canonicalUrl,
      siteName: 'Keibai Finder',
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/keibaikoubai.webp', width: 1200, height: 630, alt: agency.companyName }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/keibaikoubai.webp'],
    },
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

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';
  const agencyJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        '@id': `${baseUrl}/agencies/${id}#agent`,
        name: agencyProfile.companyName,
        url: `${baseUrl}/agencies/${id}`,
        ...(agencyProfile.phone ? { telephone: agencyProfile.phone } : {}),
        ...(agencyProfile.email ? { email: agencyProfile.email } : {}),
        ...(agencyProfile.website ? { sameAs: agencyProfile.website } : {}),
        ...(agencyProfile.prefectures && agencyProfile.prefectures.length > 0
          ? {
              areaServed: agencyProfile.prefectures.map((p) => ({
                '@type': 'AdministrativeArea',
                name: p,
              })),
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: '全国不動産会社データベース', item: `${baseUrl}/agencies` },
          { '@type': 'ListItem', position: 3, name: agencyProfile.companyName, item: `${baseUrl}/agencies/${id}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agencyJsonLd).replace(/</g, '\\u003c') }}
      />
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
