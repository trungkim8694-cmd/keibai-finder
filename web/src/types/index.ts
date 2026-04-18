export enum PropertyType {
  KODATE = '戸建て',
  MANSION = 'マンション',
  TAKUCHI = '宅地',
  NOUCHI = '農地',
  LAND = '土地',
  OTHER = 'その他'
}

export function getPropertyTypeColor(type: string | undefined): { bg: string, text: string, border: string } {
  switch (type) {
    case PropertyType.KODATE:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case PropertyType.MANSION:
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case PropertyType.TAKUCHI:
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case PropertyType.NOUCHI:
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case PropertyType.LAND:
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    default:
      return { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
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
