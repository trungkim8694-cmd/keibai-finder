import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ favorites: [] }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Fetch only the sale_unit_id to make it super fast
    const favs = await prisma.favorite.findMany({
      where: { userId },
      select: { sale_unit_id: true }
    });

    return NextResponse.json({ 
      favorites: favs.map((f: any) => f.sale_unit_id) 
    });
  } catch (error) {
    console.error('Error fetching favorites API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
