import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import { 
  getUserFavorites, 
  getUserLeads, 
  getUserClaimedCompanies, 
  getUserClaimRequests, 
  getPartnerIncomingLeads 
} from '@/actions/userDashboardActions';
import { DashboardClient } from '@/components/Dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/?login=true');
  }

  const userId = (session.user as any).id;
  const userEmail = session.user.email || '';
  const userRole = (session.user as any).role || 'USER';

  // Fetch all user and partner data in parallel
  const [favorites, userLeads, claimedCompanies, claimRequests] = await Promise.all([
    getUserFavorites(userId),
    getUserLeads(userEmail),
    getUserClaimedCompanies(userId, userEmail),
    getUserClaimRequests(userId, userEmail)
  ]);

  const companyIds = claimedCompanies.map((c: any) => c.id);
  const partnerLeads = companyIds.length > 0 
    ? await getPartnerIncomingLeads(companyIds)
    : [];

  return (
    <DashboardClient
      sessionUser={{
        id: userId,
        email: userEmail,
        name: session.user.name,
        role: userRole
      }}
      initialFavorites={favorites}
      userLeads={userLeads}
      claimedCompanies={claimedCompanies}
      claimRequests={claimRequests}
      partnerLeads={partnerLeads}
    />
  );
}
