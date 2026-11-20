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

/**
 * Get accurate Japanese price label depending on auction legal framework
 */
export function getPriceLabel(provider?: string | null, aucType?: string | null): string {
  if (provider === 'MOF') return '予定価格';
  if (provider === 'KSI') {
    return aucType === '公売' ? '見積価額' : '予定価格';
  }
  if (provider === 'NTA') return '見積価額';
  return '売却基準価額';
}

/**
 * Get compact Japanese price prefix (e.g. for pills, chips, sticky bars)
 */
export function getShortPriceLabel(provider?: string | null, aucType?: string | null): string {
  if (provider === 'MOF') return '予定';
  if (provider === 'KSI') {
    return aucType === '公売' ? '見積' : '予定';
  }
  if (provider === 'NTA') return '見積';
  return '基準';
}

/**
 * Get accurate official document label (3点セット vs 物件調書 vs 入札案内書 vs 公売明細)
 */
export function getDocumentLabel(provider?: string | null, aucType?: string | null): string {
  if (provider === 'MOF') return '物件調書';
  if (provider === 'KSI') {
    return aucType === '公売' ? '公売案内書・明細' : '入札案内書・物件調書';
  }
  if (provider === 'NTA') return '公売明細';
  return '3点セット';
}

/**
 * Clean & resolve accurate managing authority display name
 */
export function getAuthorityDisplayName(property?: { 
  managing_authority?: string | null; 
  court_name?: string | null; 
  source_provider?: string | null; 
} | null): string {
  if (!property) return '地方裁判所';
  if (property.source_provider === 'KSI' || property.source_provider === 'MOF' || property.source_provider === 'NTA') {
    if (property.managing_authority && property.managing_authority.trim()) {
      return property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim();
    }
  }
  return property.court_name?.trim() || getSourceProviderMeta(property.source_provider).authorityFallback;
}
