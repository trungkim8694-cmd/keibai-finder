import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // Basic search on name_ja. Using raw query or Prisma's contains.
    // Example: "Sapporo" => search "札幌" via exact matching or contains
    const stations = await prisma.railwayStation.findMany({
      where: {
        name_ja: {
          contains: q,
          mode: 'insensitive', // For alphabet if needed, else mostly JP kanji doesn't matter
        }
      },
      take: 10,
      orderBy: {
        name_ja: 'asc' // Sort by name
      }
    });

    return NextResponse.json(stations);
  } catch (err) {
    console.error("API /api/stations error:", err);
    return NextResponse.json({ error: "Failed to fetch stations" }, { status: 500 });
  }
}
