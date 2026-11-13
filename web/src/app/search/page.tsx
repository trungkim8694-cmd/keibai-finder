import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '物件検索 | Keibai Finder',
  description: '全国の競売物件・公売物件を一括検索。',
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const targetParams = new URLSearchParams();

  // Normalize keyword from various search query formats (keyword, q, search_term_string)
  const rawKeyword = resolvedParams.keyword || resolvedParams.q || resolvedParams.search_term_string;
  if (typeof rawKeyword === 'string' && rawKeyword.trim()) {
    targetParams.set('keyword', rawKeyword.trim());
  }

  // Normalize property_type or type -> types[]
  const rawType = resolvedParams.property_type || resolvedParams.type;
  if (typeof rawType === 'string' && rawType.trim()) {
    targetParams.append('types[]', rawType.trim());
  } else if (Array.isArray(rawType)) {
    rawType.forEach(t => {
      if (typeof t === 'string' && t.trim()) targetParams.append('types[]', t.trim());
    });
  }

  // Normalize authority / provider (NTA vs BIT)
  const rawAuthority = resolvedParams.managing_authority || resolvedParams.authority;
  if (typeof rawAuthority === 'string' && (rawAuthority.includes('国税') || rawAuthority.toUpperCase() === 'NTA')) {
    targetParams.set('provider', 'NTA');
  } else if (typeof rawAuthority === 'string' && (rawAuthority.includes('裁判所') || rawAuthority.toUpperCase() === 'BIT')) {
    targetParams.set('provider', 'BIT');
  }

  // Preserve all other valid filters (prefecture, types, minPrice, maxPrice, provider, sort, etc.)
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (['keyword', 'q', 'search_term_string', 'property_type', 'type', 'managing_authority', 'authority'].includes(key)) continue;
    if (typeof value === 'string' && value.trim()) {
      targetParams.set(key, value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(v => {
        if (typeof v === 'string' && v.trim()) {
          targetParams.append(key, v.trim());
        }
      });
    }
  }

  const queryString = targetParams.toString();
  redirect(queryString ? `/map?${queryString}` : '/map');
}
