export type SourceProvider = 'BIT' | 'NTA' | 'KSI' | 'MOF';

export interface SourceProviderMeta {
  id: SourceProvider;
  label: string;
  shortLabel: string;
  badgeText: string;
  badgeClass: string;
  markerBgClass: string;
  markerArrowClass: string;
  authorityFallback: string;
  linkTheme: 'blue' | 'red' | 'teal' | 'amber';
}

export const ALL_SOURCE_PROVIDERS: SourceProvider[] = ['BIT', 'NTA', 'KSI', 'MOF'];

export const SOURCE_PROVIDER_CONFIG: Record<SourceProvider, SourceProviderMeta> = {
  BIT: {
    id: 'BIT',
    label: '裁判所競売 (BIT)',
    shortLabel: '競売 (BIT)',
    badgeText: '競売',
    badgeClass: 'bg-[#1B4F8A] text-white',
    markerBgClass: 'bg-[#1B4F8A]',
    markerArrowClass: 'border-t-[#1B4F8A]',
    authorityFallback: '地方裁判所',
    linkTheme: 'blue',
  },
  NTA: {
    id: 'NTA',
    label: '国税庁公売 (NTA)',
    shortLabel: '国税庁公売',
    badgeText: '国税公売',
    badgeClass: 'bg-[#991B1B] text-white',
    markerBgClass: 'bg-[#B91C1C]',
    markerArrowClass: 'border-t-[#B91C1C]',
    authorityFallback: 'NTA 税務署',
    linkTheme: 'red',
  },
  KSI: {
    id: 'KSI',
    label: '官公庁公売 (KSI)',
    shortLabel: '官公庁公売',
    badgeText: '官公庁公売',
    badgeClass: 'bg-[#0F766E] text-white',
    markerBgClass: 'bg-[#0F766E]',
    markerArrowClass: 'border-t-[#0F766E]',
    authorityFallback: '自治体・官公庁',
    linkTheme: 'teal',
  },
  MOF: {
    id: 'MOF',
    label: '国有財産売却 (財務省)',
    shortLabel: '国有財産売却',
    badgeText: '国有財産',
    badgeClass: 'bg-[#B45309] text-white',
    markerBgClass: 'bg-[#B45309]',
    markerArrowClass: 'border-t-[#B45309]',
    authorityFallback: '財務局',
    linkTheme: 'amber',
  },
};

export function getSourceProviderMeta(provider?: string | null): SourceProviderMeta {
  if (provider === 'NTA' || provider === 'KSI' || provider === 'MOF') {
    return SOURCE_PROVIDER_CONFIG[provider];
  }
  return SOURCE_PROVIDER_CONFIG.BIT;
}

/**
 * Providers that use auction countdown / managing_authority style metadata
 */
export function isPublicAuctionProvider(provider?: string | null): boolean {
  return provider === 'NTA' || provider === 'KSI' || provider === 'MOF';
}
