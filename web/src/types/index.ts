export enum PropertyType {
  KODATE = '戸建て',
  MANSION = 'マンション',
  TAKUCHI = '宅地',
  NOUCHI = '農地',
  LAND = '土地',
  OTHER = 'その他'
}

export function getPropertyTypeColor(type: string | undefined): { bg: string, text: string, border: string } {
  if (!type) return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' };

  if (type.includes('店舗') || type.includes('旅館') || type.includes('ホテル')) {
    return { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' };
  }
  if (type.includes('事務所') || type.includes('ビル') || type.includes('オフィス')) {
    return { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' };
  }
  if (type.includes('工場') || type.includes('倉庫')) {
    return { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-800 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' };
  }
  if (type.includes('一棟') || type.includes('共同住宅') || type.includes('アパート')) {
    return { bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-800 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' };
  }

  switch (type) {
    case PropertyType.KODATE:
      return { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case PropertyType.MANSION:
      return { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case PropertyType.TAKUCHI:
    case '宅地（更地）':
      return { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' };
    case PropertyType.NOUCHI:
      return { bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' };
    case PropertyType.LAND:
      return { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    default:
      return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' };
  }
}

export interface AnalysisPayload {
  risk_analysis?: {
    issues: string[];
  };
  estimated_costs?: {
    arrears: number;
    eviction_cost: number;
    repair_estimate: number;
  };
  winning_price_analysis?: {
    estimated_winning_price: number;
    reasoning: string;
  };
  roi_analysis?: {
    yield_percent: number;
    profit_vs_base_price: number;
  };
}

export interface AiAnalysisData {
  ja: AnalysisPayload;
  en: AnalysisPayload;
  vi: AnalysisPayload;
}

export interface StructuredAiAnalysis {
  complexityLevel: 'A' | 'B' | 'C' | 'D'; // A: 標準(初心者向), B: 確認要, C: 慎重(経験者向), D: 複雑(プロ向)
  levelLabel: string;
  sourceType: 'DEEP_PDF_AI' | 'STRUCTURED_DATA_AI';
  summaryText: string;
  metrics: {
    assumedRights: {
      status: 'CLEAR' | 'CAUTION' | 'COMPLEX' | 'UNKNOWN';
      value: string;
      sourceRef: string;
    };
    occupancy: {
      status: 'VACANT' | 'OWNER' | 'THIRD_PARTY' | 'UNKNOWN';
      value: string;
      evictionNote: string;
    };
    arrears: {
      amountYen: number;
      formatted: string;
      isApplicable: boolean;
    };
    landAndBuilding: {
      rightType: string;
      buildingIssues: string;
    };
  };
  estimatedHiddenCosts: {
    arrearsMan: number;
    evictionCostMan: number;
    repairCostMan: number;
  };
  keyPoints: string[];
}

export interface SharedProperty {
  sale_unit_id: string;
  court_name: string;
  property_type: string;
  source_provider?: string;
  source_url?: string;
  address: string;
  prefecture?: string;
  city?: string;
  lat: number;
  lng: number;
  starting_price?: string | number;
  distance_km?: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  images?: string[];
  pdf_url?: string;
  roiPercent?: number;
  nearest_station?: string;
  status?: string;
  totalArea?: string | null;
  views?: number;
  auctionSchedule?: string | null;
  auctionRound?: number;
  managing_authority?: string | null;
  contact_url?: string | null;
  ai_analysis?: AiAnalysisData | null;
  ai_status?: string | null;
  mlit_estimated_price?: number | null;
  mlit_investment_gap?: number | null;
  raw_display_data?: any;
}
