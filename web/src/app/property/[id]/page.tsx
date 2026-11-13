import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
// PRESERVE: PDF & Image Logic - DO NOT REMOVE.
import Link from 'next/link';
import { PropertyImageGallery } from '@/components/PropertyImageGallery';
import { calculateRoi, convertToWesternYear, extractAuctionSchedule, extractAuctionRoundFromData, extractTotalArea, cleanAddress } from '@/lib/utils';
import { formatBidPeriod } from '@/utils/dateFormatter';
import MarketComparison from './MarketComparison';
import { getNearestStations, getNearbyAuctionResults } from './actions';
import { getProperties } from '@/actions/propertyActions';
import DetailMapComponent from './DetailMapComponent';
import { PdfLinks } from '@/components/Detail/PdfLinks';
import { CourtContactLink } from '@/components/CourtContactLink';
import { CourtValuation } from '@/components/Detail/CourtValuation';
import { AiAnalysisPanel } from '@/components/Detail/AiAnalysisPanel';
import { resolvePropertyAiAnalysis } from '@/lib/aiRiskExtractor';
import { getSourceProviderMeta, isPublicAuctionProvider } from '@/lib/sourceProviderConfig';
import { MarketValuation } from '@/components/Detail/MarketValuation';
import { RoiCalculator } from '@/components/Detail/RoiCalculator';
import { AuctionHistoryBadge } from '@/components/Detail/AuctionHistoryBadge';
import { PropertyInfoTags } from '@/components/PropertyInfoTags';
import { ViewTracker } from '@/components/Detail/ViewTracker';
import { StickyActionBar } from '@/components/Detail/StickyActionBar';
import { PropertySpiderwebHub } from '@/components/Detail/PropertySpiderwebHub';
import { NearbyActiveGrid } from '@/components/Detail/NearbyActiveGrid';
import { Inbox } from 'lucide-react';
import { ImageGallery } from '@/components/Detail/ImageGallery';
import { Metadata } from 'next';
import { PropertyComments } from '@/components/Detail/PropertyComments';
import { PropertyAgencies } from '@/components/Detail/PropertyAgencies';
import { getCompaniesForProperty } from '@/actions/companyActions';
import { cache } from 'react';
import { 
  resolveAccuratePropertyType, 
  extractDualAreasAndYear, 
  extractValuationSummary, 
  sortAndFormatSectionData,
  resolveAuctionRelistHistory
} from '@/lib/propertyDataNormalizer';
import { Phone } from 'lucide-react';

const getPropertyById = cache(async (id: string) => {
  return prisma.property.findUnique({ where: { sale_unit_id: id } });
});

/**
 * Deeply serializes data to be JSON-safe for RSC/Client passage.
 * Specifically converts BigInt to Number.
 */
function deepSerialize(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') return Number(data);
  if (Array.isArray(data)) return data.map(deepSerialize);
  if (typeof data === 'object' && !(data instanceof Date)) {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = deepSerialize(data[key]);
    }
    return serialized;
  }
  return data;
}

export const revalidate = 3600; // Cache property details for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  
  if (!property) return { title: '物件が見つかりません' };

  const priceNum = property.starting_price ? Number(property.starting_price) : 0;
  // Format price in Man-yen for better CTR
  const priceFormatted = priceNum > 0 ? `${Math.round(priceNum / 10000).toLocaleString('ja-JP')}万円` : '価格非公開';
  const typeStr = resolveAccuratePropertyType(property);
  const address = property.address?.substring(0, 20) || '';
  const providerMeta = getSourceProviderMeta(property.source_provider);
  const tagStr = property.source_provider === 'BIT' ? '競売物件' : `${providerMeta.badgeText}物件`;
  
  const title = `【${priceFormatted}】${address}の${typeStr}｜${property.court_name ? property.court_name + ' ' : ''}${tagStr}情報`;
  const description = `${property.address}の${typeStr}（${tagStr}）。基準価格は${priceFormatted}です。市場価格より安い不動産をお探しならKeibai Finder. 過去の落札相場やAIによる価格査定データを公開中。`;
  
  // Use first permanent image as openGraph image (fallback to first image)
  let ogImage = undefined;
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
     const isPerm = (u: string) => Boolean(u && (u.startsWith('/vps-images/') || u.includes('r2.dev') || u.includes('supabase.co')));
     ogImage = property.images.find(isPerm) || property.images[0] || undefined;
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';
  const canonicalUrl = `${baseUrl}/property/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: ogImage ? [{ url: ogImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  // Fix Next.js 15+ async params error by awaiting params
  const { id } = await params;

  const property = await getPropertyById(id);

  if (!property) {
    return notFound();
  }

  console.log('PropertyDetail render -> prefecture:', property.prefecture, 'city:', property.city);

  // Parse raw display data
  type AssetGroupInfo = {
    asset_title: string;
    asset_type?: string;
    data: Record<string, string>;
    images?: string[];
  };

  let propertySections: AssetGroupInfo[] = [];
  let ntaMapLink: string | null = null;
  let eTaxLink: string | null = null;
  let bitContactUrl: string | null = null;

  if (property.raw_display_data) {
    try {
      console.log('--- DB RAW DATA TYPE:', typeof property.raw_display_data);
      console.log('--- DB RAW DATA VALUE:', typeof property.raw_display_data === 'string' ? property.raw_display_data.substring(0, 50) + '...' : JSON.stringify(property.raw_display_data).substring(0, 50) + '...');
      
      let parsed = property.raw_display_data;
      
      // Handle the case where JSON is encoded as String literal from DB
      if (typeof parsed === 'string') {
        try {
           parsed = JSON.parse(parsed);
        } catch { }
      }
      
      // Deep clone to safely manipulate
      const rawObj = JSON.parse(JSON.stringify(parsed));
      
      if (Array.isArray(rawObj)) {
        if (rawObj.length > 0 && ('group' in rawObj[0])) {
          // Old format: {group, key, value}[]
          const grouped: Record<string, Record<string, string>> = {};
          rawObj.forEach((item: any) => {
             if (!grouped[item.group]) grouped[item.group] = {};
             grouped[item.group][item.key] = item.value;
          });
          propertySections = Object.entries(grouped).map(([title, data]) => ({
            asset_title: title,
            asset_type: 'Unknown',
            data
          }));
        } else {
          // New Format
          propertySections = rawObj as AssetGroupInfo[];
        }
      } else if (rawObj && typeof rawObj === 'object') {
        // NTA Dictionary Format
        if (rawObj.overview || rawObj.details || rawObj.contact) {
            if (rawObj.overview && Object.keys(rawObj.overview).length > 0) {
               propertySections.push({ asset_title: "物件の概況", asset_type: "NTA", data: rawObj.overview });
            }
            if (rawObj.details && Object.keys(rawObj.details).length > 0) {
               propertySections.push({ asset_title: "詳細情報", asset_type: "NTA", data: rawObj.details });
            }
            if (rawObj.contact && Object.keys(rawObj.contact).length > 0) {
               propertySections.push({ asset_title: "連絡先・機関情報", asset_type: "NTA", data: rawObj.contact });
            }
            
            ntaMapLink = rawObj.nta_map_link || null;
            eTaxLink = rawObj.etax_link || null;
        } else if (rawObj.summary && typeof rawObj.summary === 'object') {
            // KSI / Public auction dictionary format with nested summary
            const summaryData: Record<string, string> = {};
            for (const [k, v] of Object.entries(rawObj.summary)) {
              if (v !== null && v !== undefined) {
                summaryData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
              }
            }
            propertySections.push({
              asset_title: "物件概要・公売情報",
              asset_type: property.source_provider || "KSI",
              data: summaryData
            });

            const extraData: Record<string, string> = {};
            for (const [k, v] of Object.entries(rawObj)) {
              if (!['summary', 'title', 'source_url', 'bidding_period', 'nta_map_link', 'etax_link'].includes(k) && v !== null && v !== undefined) {
                extraData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
              }
            }
            if (Object.keys(extraData).length > 0) {
              propertySections.push({
                asset_title: "補足情報",
                asset_type: property.source_provider || "KSI",
                data: extraData
              });
            }
            ntaMapLink = rawObj.nta_map_link || null;
            eTaxLink = rawObj.etax_link || null;
        } else {
            const sanitizedData: Record<string, string> = {};
            for (const [k, v] of Object.entries(rawObj)) {
              if (['nta_map_link', 'etax_link'].includes(k)) continue;
              if (v !== null && v !== undefined) {
                sanitizedData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
              }
            }
            ntaMapLink = rawObj.nta_map_link || null;
            eTaxLink = rawObj.etax_link || null;
            
            propertySections = [{
              asset_title: "公売物件詳細",
              asset_type: property.source_provider || "NTA",
              data: sanitizedData
            }];
        }
      }
      if (Array.isArray(rawObj)) {
        const summary = rawObj.find((s: any) => s.asset_title === 'Summary');
        if (summary?.data?.contact_url) bitContactUrl = summary.data.contact_url;
      }
    } catch (e) {
      console.error('Error parsing raw_display_data:', e);
    }
  }
  if (propertySections.length === 0) {
      propertySections = [{
          asset_title: "基礎物件データ",
          asset_type: property.source_provider === 'NTA' ? "NTA" : "BIT",
          data: {
             "種類": property.property_type || '不明',
             "所在地": property.address || '不明',
             "裁判所/管轄": property.court_name || '不明',
             "状態": property.status === 'ACTIVE' ? '公開中' : property.status
          }
      }];
  }

  // Ensure priority sorting
  if (propertySections.length > 0) {
    propertySections.sort((a, b) => {
      const getPriority = (title: string) => {
        if (title === 'Summary') return 1;
        if (title.includes('物件詳細') || title === '競売物件詳細') return 2;
        return 3;
      };
      return getPriority(a.asset_title) - getPriority(b.asset_title);
    });
  }

  // Format price in Man-yen (万円) — Japanese convention (e.g. 1,309万円)
  const formattedStartPrice = (() => {
    if (!property.starting_price) return '未定';
    const yen = Number(property.starting_price);
    const man = Math.round(yen / 10000);
    return `${man.toLocaleString('ja-JP')}万円`;
  })();
    
  const accurateType = resolveAccuratePropertyType(property);
  const dualSpecs = extractDualAreasAndYear(property);
  const valuationSummary = extractValuationSummary(property);

  let westernYear = dualSpecs.buildYearWestern || (property as any).build_year_western;
  if (!westernYear && property.raw_display_data) {
    const rawStr = JSON.stringify(property.raw_display_data);
    const m = rawStr.match(/"[^"]*年月[^"]*"\s*:\s*"([^"]+)"/);
    if (m) {
      westernYear = convertToWesternYear(m[1]);
    }
  }
  if (!westernYear) westernYear = 1990;
    
  const roiPercent = calculateRoi(property.starting_price, (property as any).prefecture, westernYear, accurateType);
  const dbArea = (property as any).area && (property as any).area > 0 ? (property as any).area : null;
  const parsedArea = dualSpecs.buildingAreaSqm || dualSpecs.landAreaSqm || dbArea || extractTotalArea(property.raw_display_data);
  
  const displayArea = parsedArea
    ? `${Math.round(parsedArea).toLocaleString('en-US')}m²` 
    : null;
    
  let auctionSchedule = formatBidPeriod((property as any).bid_start_date, (property as any).bid_end_date);
  if (!auctionSchedule) {
     auctionSchedule = extractAuctionSchedule(property.raw_display_data);
  }
  
  const auctionRound = extractAuctionRoundFromData(property.raw_display_data);

  // --- Sharing Info ---
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';
  const propertyUrl = `${baseUrl}/property/${property.sale_unit_id}`;
  const addressShort = property.address?.substring(0, 30) || id;
  const propertyTitle = `【${formattedStartPrice}】${addressShort} - ${accurateType}`;
  const endDateRaw = (property as any).bid_end_date ? new Date((property as any).bid_end_date) : null;

  // Prepare coordinates for markers
  const propertyLat = property.lat;
  const propertyLng = property.lng;

  let nearestStations: any[] = [];
  let nearbyActive: any[] = [];
  let nearbySold: any[] = [];
  let avgMargin = 0;
  let formattedWinningBid = '-';

  // Define queries for parallel execution
  const stationsPromise = property.lat && property.lng ? getNearestStations(property.lat, property.lng) : Promise.resolve([]);
  const nearbyActivePromise = getProperties({ prefecture: property.prefecture || undefined, limit: 10 });
  const nearbySoldPromise = property.lat && property.lng ? getNearbyAuctionResults(property.lat, property.lng, 20) : Promise.resolve([]);
  
  // Similar Properties (History) - Match by Address and Type (Area disambiguation with float tolerance is handled in resolveAuctionRelistHistory)
  const historyPromise = (property.address && property.address !== 'Unknown') 
    ? prisma.property.findMany({
        where: { 
          address: property.address, 
          property_type: property.property_type,
        },
        orderBy: { created_at: 'asc' },
        select: { sale_unit_id: true, starting_price: true, status: true, area: true, created_at: true, raw_display_data: true, thumbnailUrl: true, images: true, source_provider: true }
      })
    : Promise.resolve([]);

  const commentsPromise = prisma.comment.findMany({
    where: { sale_unit_id: id },
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    }
  });

  const agenciesPromise = property.prefecture
    ? getCompaniesForProperty({
        prefecture: property.prefecture,
        city: property.city || undefined,
        limit: 3,
      }).then(res => res.companies || [])
    : Promise.resolve([]);

  // RUN ALL 6 IN PARALLEL
  const [stationsResult, nearbyResult, soldResult, similarProps, propertyComments, agenciesResult] = await Promise.all([
    stationsPromise,
    nearbyActivePromise,
    nearbySoldPromise,
    historyPromise,
    commentsPromise,
    agenciesPromise
  ]);

  const safeComments = deepSerialize(propertyComments || []);
  const safeAgencies = deepSerialize(agenciesResult || []);

  nearestStations = stationsResult;
  nearbyActive = nearbyResult.filter((p: any) => p.sale_unit_id !== id).slice(0, 10);
  nearbySold = soldResult;

  if (nearbySold && nearbySold.length > 0) {
    const totalMargin = nearbySold.reduce((acc: number, curr: any) => acc + (curr.marginRate || 0), 0);
    avgMargin = Math.round(totalMargin / nearbySold.length);
  }

  // Calculate final winning bid recommendation
  const basePriceNum = property.starting_price ? Number(property.starting_price) : 0;
  if (basePriceNum > 0) {
    const rawBid = basePriceNum * (1 + avgMargin / 100);
    const winningBid = Math.round(rawBid / 1000) * 1000;
    formattedWinningBid = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(winningBid);
  }

  // Resolve multi-round auction relist history (including 期間入札 & 特別売却 cycles and exact price drops)
  const relistSummary = resolveAuctionRelistHistory(property, similarProps);
  const historyItems = relistSummary.history;

  const imagesList = Array.isArray(property.images) ? property.images as string[] : [];
  const ogImageUrl = imagesList.length > 0 ? imagesList[0] : undefined;
  // Metadata for SEO
  const jsonLdPrice = Number(property.starting_price || 0);

  // Safe date parsing and offer status calculation for Google Rich Snippets
  const now = new Date();
  const bidEndDate = property.bid_end_date ? new Date(property.bid_end_date) : null;
  const isBidEndDateValid = bidEndDate !== null && !isNaN(bidEndDate.getTime());
  const isExpired = isBidEndDateValid && bidEndDate < now;
  const isAvailable = property.status === 'ACTIVE' && !isExpired;

  const validThroughStr = isBidEndDateValid ? bidEndDate.toISOString() : undefined;
  const priceValidUntilStr = isBidEndDateValid ? bidEndDate.toISOString().split('T')[0] : undefined;

  let accommodationType = "Accommodation";
  if (property.property_type === "戸建て") {
    accommodationType = "House";
  } else if (property.property_type === "マンション") {
    accommodationType = "Apartment";
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `${property.address}の${property.property_type || '競売物件'}`,
    "description": `${property.source_provider === 'NTA' ? '公売物件' : '競売物件'}: ${property.address}にある${property.property_type || '不動産'}です。基準価格: ${jsonLdPrice > 0 ? Math.round(jsonLdPrice / 10000).toLocaleString('ja-JP') + '万円' : '未定'}。AI査定と過去の取引相場から、あなたに最適な競売・公売物件を見つけます。`,
    "url": `${baseUrl}/property/${id}`,
    "image": ogImageUrl ? [ogImageUrl] : [],
    "datePosted": property.created_at && !isNaN(new Date(property.created_at).getTime()) ? new Date(property.created_at).toISOString() : new Date().toISOString(),
    "about": {
      "@type": accommodationType,
      "name": property.address || "競売物件",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "JP",
        "addressRegion": property.prefecture || undefined,
        "addressLocality": property.city || undefined,
        "streetAddress": property.address || undefined
      },
      ...(property.lat && property.lng ? {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": Number(property.lat),
          "longitude": Number(property.lng)
        }
      } : {}),
      ...(parsedArea ? {
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": Number(parsedArea),
          "unitCode": "MTK"
        }
      } : {})
    },
    ...(jsonLdPrice > 0 ? {
      "offers": {
        "@type": "Offer",
        "priceCurrency": "JPY",
        "price": jsonLdPrice,
        "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/Discontinued",
        ...(validThroughStr ? { "validThrough": validThroughStr } : {}),
        ...(priceValidUntilStr ? { "priceValidUntil": priceValidUntilStr } : {}),
        "url": `${baseUrl}/property/${id}`
      }
    } : {})
  };

  // Dynamic Breadcrumb Schema
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": `${baseUrl}/`
    }
  ];

  let currentPosition = 2;
  if (property.prefecture) {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": currentPosition++,
      "name": property.prefecture,
      "item": `${baseUrl}/search/area/${encodeURIComponent(property.prefecture)}`
    });
  }

  if (property.prefecture && property.city) {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": currentPosition++,
      "name": property.city,
      "item": `${baseUrl}/search/area/${encodeURIComponent(property.prefecture)}/${encodeURIComponent(property.city)}`
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    "position": currentPosition,
    "name": property.address || "物件詳細",
    "item": `${baseUrl}/property/${id}`
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  };

  // 5. PROCESS FINAL OBJECTS (SAFE SERIALIZATION FOR RSC)
  const effectiveRound = relistSummary.totalRounds > 1 ? relistSummary.totalRounds : auctionRound;
  const serializedProperty = deepSerialize({
    ...property,
    auctionSchedule,
    auctionRound: effectiveRound,
    priceDropYen: relistSummary.priceDropYen,
    prefecture: (property as any).prefecture || null,
    city: (property as any).city || null,
    contact_url: ntaMapLink || undefined,
  });

  // Sanitize history items & relist summary (BigInt to Number)
  const serializedHistory = deepSerialize(historyItems || []);
  const serializedRelistSummary = deepSerialize(relistSummary);

  // Sanitize all other props for Client Components
  const safeNearestStations = deepSerialize(nearestStations);
  const safeNearbyActive = deepSerialize(nearbyActive);
  const safeNearbySold = deepSerialize(nearbySold);
  const safeProperty = deepSerialize(property);

  // Synthesize AI Legal & Risk Analysis (Zero-Wait Fallback + Deep PDF AI)
  const propertyAiAnalysis = resolvePropertyAiAnalysis(property);

  // --- UI CHUNKS ---
  const TitleAndTagsUI = (
    <div className="w-full">
      <div className="mb-2 flex justify-between items-center w-full gap-2">
        <div className="min-w-[0]">
          <span className="text-xs font-semibold block truncate">
            {isPublicAuctionProvider(property.source_provider) ? (() => {
              const meta = getSourceProviderMeta(property.source_provider);
              return (
                <CourtContactLink 
                  courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : (property.court_name || meta.authorityFallback)} 
                  contactUrl={(property as any).contact_url || property.source_url} 
                  theme={meta.linkTheme}
                />
              );
            })() : (
              <CourtContactLink courtName={property.court_name} contactUrl={bitContactUrl} />
            )}
          </span>
        </div>
        {property.mlit_investment_gap !== null && property.mlit_investment_gap !== undefined && property.mlit_investment_gap > 0 && (() => {
          const startNum = property.starting_price ? Number(property.starting_price) : 0;
          const estNum = property.mlit_estimated_price ? Number(property.mlit_estimated_price) : 0;
          const diffMan = estNum > startNum ? Math.round((estNum - startNum) / 10000) : 0;

          return (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 border border-blue-200/90 dark:border-blue-800/60 tabular-nums shadow-2xs">
              <span className="text-[10px]">🏷️</span>
              {diffMan > 0 
                ? `市場比 約${diffMan.toLocaleString()}万円安 (${property.mlit_investment_gap.toFixed(0)}%割安)`
                : `市場相場より ${property.mlit_investment_gap.toFixed(0)}% 割安`
              }
            </span>
          );
        })()}
      </div>
      <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        {!(property as any).prefecture && !(property as any).city ? '詳細情報' : cleanAddress((property as any).address, (property as any).prefecture, (property as any).city)}
      </h1>
      
      <div className="mb-3">
         <PropertyInfoTags property={serializedProperty} displayArea={displayArea} showCourtTag={false} variant="detail-header">
           {serializedHistory.length > 1 && (
             <AuctionHistoryBadge history={serializedHistory} relistSummary={serializedRelistSummary} variant="compact" />
           )}
         </PropertyInfoTags>
      </div>
    </div>
  );

  const isPerm = (u: string) => Boolean(u && (u.includes('r2.dev') || u.includes('supabase.co')));
  const rawPropImages = Array.isArray((property as any).images) ? (property as any).images as string[] : [];
  const sortedGalleryImages = [...rawPropImages].sort((a, b) => {
    const aP = isPerm(a);
    const bP = isPerm(b);
    if (aP && !bP) return -1;
    if (!aP && bP) return 1;
    return 0;
  });

  const ImageGalleryUI = sortedGalleryImages.length > 0 ? (
    <ImageGallery images={sortedGalleryImages} />
  ) : null;

  const CourtValuationUI = (
    <CourtValuation 
      formattedStartPrice={formattedStartPrice} 
      endDate={endDateRaw}
      startDate={(property as any).bid_start_date ? new Date((property as any).bid_start_date) : null}
      nearestStations={safeNearestStations}
      analysis={propertyAiAnalysis}
      sourceProvider={property.source_provider}
      valuationSummary={valuationSummary}
      relistSummary={serializedRelistSummary}
    />
  );

  const AiAnalysisUI = (
    <AiAnalysisPanel 
      analysis={propertyAiAnalysis}
      saleUnitId={property.sale_unit_id}
      sourceProvider={property.source_provider}
      pdfUrl={property.pdf_url}
    />
  );

  const PdfLinksUI = (
    <PdfLinks 
      saleUnitId={property.sale_unit_id}
      images={(property as any).images ? ((property as any).images as string[]) : []} 
      pdfUrl={(property as any).pdf_url} 
      sourceProvider={(property as any).source_provider}
      sourceUrl={(property as any).source_url}
      bitContactUrl={bitContactUrl}
      rawDisplayData={property.raw_display_data}
    />
  );

  const nodePropertySections = propertySections.length > 0 ? (
    <div className="space-y-6 mb-8 lg:mb-0">
      {propertySections.map((section, idx) => {
        const isSummary = section.asset_title === 'Summary';
        const rawTitle = isSummary ? '物件の概況' : section.asset_title;
        const displayTitle = rawTitle.replace(/[📋🔍📞📄]/g, '').trim();
        const isContactSection = displayTitle.includes('連絡先') || displayTitle.includes('機関');
        
        let rawImages = section.images || [];
        let mergedImages: string[] = [];
        
        if (isSummary) {
          const globalImages = Array.isArray((property as any).images) ? (property as any).images : [];
          const tUrl = property.thumbnailUrl ? property.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp') : null;
          const arr: string[] = [];
          if (tUrl && !arr.includes(tUrl) && !tUrl.toLowerCase().endsWith('.pdf')) arr.push(tUrl);
          
          rawImages.forEach(img => { 
             if (!arr.includes(img) && !img.toLowerCase().endsWith('.pdf')) arr.push(img) 
          });
          globalImages.forEach((img: string) => { 
             if (!arr.includes(img) && !img.toLowerCase().endsWith('.pdf')) arr.push(img) 
          });
          const isPerm = (u: string) => Boolean(u && (u.startsWith('/vps-images/') || u.includes('r2.dev') || u.includes('supabase.co')));
          mergedImages = arr.sort((a, b) => {
             const aP = isPerm(a);
             const bP = isPerm(b);
             if (aP && !bP) return -1;
             if (!aP && bP) return 1;
             return 0;
          });
        } else {
          mergedImages = rawImages.filter(img => !img.toLowerCase().endsWith('.pdf'));
        }

        // 1. Specialized B2B Layout for Contact Information
        if (isContactSection) {
          const contactOrg = String(section.data['お問い合せ先'] || section.data['お問い合わせ先'] || property.managing_authority || property.court_name || '管轄機関');
          const dept = section.data['担当部署名'];
          const phone = section.data['電話番号'] || section.data['電話'];
          const extension = section.data['内線'];
          const hours = section.data['電話受付時間'] || section.data['受付時間'];
          const addr = section.data['所在地'];
          const zip = section.data['郵便番号'];

          return (
            <section key={idx} className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800">
              <div className="bg-slate-50 dark:bg-zinc-800/80 px-4 py-3 md:px-5 md:py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-sm md:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{displayTitle}</span>
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                  {property.source_provider === 'NTA' ? '国税局・税務署' : (property.source_provider === 'KSI' ? '公売実施機関' : '管轄裁判所')}
                </span>
              </div>

              <div className="p-4 md:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">担当機関・部署</div>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {contactOrg.split('\n').join('').replace(/\s+/g, ' ').trim()}
                    </div>
                    {dept && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {String(dept)}
                      </div>
                    )}
                  </div>

                  {phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${String(phone).replace(/[^0-9]/g, '')}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#1B4F8A] hover:bg-[#153e6d] text-white text-xs font-bold shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{String(phone)}</span>
                      </a>
                      {extension && (
                        <span className="px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-zinc-700 tabular-nums">
                          内線: {extension}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {hours && (
                    <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded border border-slate-200/80 dark:border-zinc-800">
                      <div className="text-slate-500 dark:text-slate-400 font-medium mb-1">受付時間</div>
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">{hours}</div>
                    </div>
                  )}
                  {addr && (
                    <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded border border-slate-200/80 dark:border-zinc-800">
                      <div className="text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
                        <span>所在地</span>
                        {zip && <span className="text-[10px] text-slate-400">〒{zip}</span>}
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                        <span className="truncate">{addr}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0 text-[11px] font-medium"
                        >
                          地図 ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        // 2. Structured B2B Table for Overview and Asset Details
        const enrichedSectionData = { ...section.data };
        if (isSummary && property.source_provider !== 'NTA') {
          if (property.court_name && !enrichedSectionData['管轄裁判所']) {
            enrichedSectionData['管轄裁判所'] = property.court_name;
          }
          if (relistSummary.caseNumberJa && !enrichedSectionData['事件番号']) {
            enrichedSectionData['事件番号'] = relistSummary.caseNumberJa;
          }
        }
        const formattedRows = sortAndFormatSectionData(displayTitle, enrichedSectionData);

        return (
        <section key={idx} className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-none border border-slate-200 dark:border-zinc-800">
          <div className="bg-slate-50 dark:bg-zinc-800/80 px-4 py-3 md:px-5 md:py-3.5 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="font-semibold text-sm md:text-base text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2.5">
              <span>{displayTitle}</span>
              {section.asset_type && section.asset_type !== 'Unknown' && section.asset_type !== 'Summary' && (
                <span className="text-[11px] font-normal px-2 py-0.5 bg-slate-200/60 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 rounded">
                  {section.asset_type}
                </span>
              )}
            </h2>
          </div>
          {mergedImages && mergedImages.length > 0 && !isSummary && (
            <PropertyImageGallery images={mergedImages} assetTitle={displayTitle} />
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {formattedRows.map((row, vIdx) => {
                  const isMissing = !row.value || row.value === '-' || row.value.trim() === '-';
                  return (
                  <tr 
                    key={vIdx} 
                    className={`transition-colors ${
                      row.isSpecial 
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30' 
                        : 'even:bg-slate-50/50 odd:bg-white dark:even:bg-zinc-800/30 dark:odd:bg-transparent hover:bg-slate-50/80 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    <th scope="row" className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 bg-transparent w-1/3 min-w-[120px] max-w-[200px] align-top text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        {row.isSpecial && <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] shrink-0" />}
                        <span>{row.key}</span>
                      </div>
                    </th>
                    <td className={`px-4 py-3 align-top text-xs md:text-sm ${isMissing ? 'text-slate-400 dark:text-zinc-600 italic' : 'text-slate-800 dark:text-slate-200'}`}>
                      {row.isParagraph ? (
                        <div className="whitespace-pre-line leading-relaxed font-sans text-slate-800 dark:text-slate-200">
                          {row.value}
                        </div>
                      ) : (
                        <span className={`font-sans ${row.isSpecial ? 'font-bold text-slate-900 dark:text-slate-100' : ''}`}>
                          {row.value}
                        </span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>
      )})}
    </div>
  ) : (
    <div className="text-center py-16 mb-8 lg:mb-0 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400">
      <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
      <p className="font-medium text-sm text-slate-600 dark:text-slate-300">抽出詳細データは登録されていません</p>
      <p className="text-xs mt-1 text-slate-400">物件調書PDFまたは競売サイト原本にてご確認ください。</p>
    </div>
  );

  const nodeDetailMap = property.lat && property.lng ? (
    <div className="mb-8 lg:mb-0">
      <React.Suspense fallback={<div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
        <DetailMapComponent 
          property={safeProperty}
          nearestStations={safeNearestStations}
          nearbyActive={safeNearbyActive}
          nearbySold={safeNearbySold}
        />
      </React.Suspense>
    </div>
  ) : null;

  const nodeMarketComparison = property.lat && property.lng ? (
    <div className="mb-8 lg:mb-0">
      <React.Suspense fallback={<div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
        <MarketComparison 
          nearbySold={safeNearbySold} 
          stations={safeNearestStations} 
          prefecture={property.prefecture || undefined}
          city={property.city || undefined}
        />
      </React.Suspense>
    </div>
  ) : null;

  const nodeMarketValuation = property.prefecture && property.city ? (
    <div className="mb-8 lg:mb-0">
      <React.Suspense fallback={<div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
        <MarketValuation 
          prefecture={property.prefecture}
          city={property.city}
          rawAddress={(property as any).address}
          propertyType={property.property_type || '戸建て'}
          basePriceNum={basePriceNum}
          propertyArea={parsedArea}
          dbMlitEstimatedPrice={property.mlit_estimated_price ? Number(property.mlit_estimated_price) : null}
          dbMlitInvestmentGap={property.mlit_investment_gap ? Number(property.mlit_investment_gap) : null}
          sourceProvider={property.source_provider}
          displayPropertyType={resolveAccuratePropertyType(property)}
        />
      </React.Suspense>
    </div>
  ) : null;

  const nodeRoiCalculator = (
    <div className="mb-8 lg:mb-0">
      <RoiCalculator
        basePrice={basePriceNum}
        propertyArea={parsedArea}
        propertyType={property.property_type}
        prefecture={property.prefecture || '東京都'}
        initialArrearsMan={propertyAiAnalysis.estimatedHiddenCosts.arrearsMan}
        initialEvictionMan={propertyAiAnalysis.estimatedHiddenCosts.evictionCostMan}
        initialRepairMan={propertyAiAnalysis.estimatedHiddenCosts.repairCostMan}
        isAiSynced={true}
      />
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans pb-20 overflow-x-hidden w-full overflow-y-auto">
        {property && (
          <ViewTracker 
            id={id} 
            label={property.address || property.court_name || id} 
            image={sortedGalleryImages.find(isPerm) || property.thumbnailUrl} 
          />
        )}
      {/* Sticky Sub-Header Action Bar with Breadcrumbs */}
      <StickyActionBar 
        saleUnitId={property.sale_unit_id} 
        predictedPrice={formattedWinningBid} 
        pdfUrl={property.pdf_url} 
        propertyUrl={propertyUrl}
        shareTitle={propertyTitle}
        prefecture={property.prefecture || undefined}
        city={property.city || undefined}
      />

      <main className="w-full max-w-7xl mx-auto mt-6 px-4 overflow-x-hidden">
        
        {/* --- MOBILE LAYOUT (Single Column) --- */}
        <div className="flex lg:hidden max-w-4xl mx-auto flex-col w-full">
          <section className="bg-white dark:bg-zinc-900 rounded-lg p-5 shadow-none border border-slate-200 dark:border-zinc-800 mb-6">
            {TitleAndTagsUI}
            {ImageGalleryUI && <div className="mt-4">{ImageGalleryUI}</div>}
            {CourtValuationUI}
            {PdfLinksUI}
          </section>

          {AiAnalysisUI}
          {nodePropertySections}
          {nodeRoiCalculator}
          {nodeDetailMap}
          {nodeMarketComparison}
          {nodeMarketValuation}
          <div id="property-agencies-section" className="mt-6">
            <PropertyAgencies prefecture={property.prefecture || "東京都"} city={property.city || undefined} agencies={safeAgencies} />
          </div>
          <div className="mt-6">
            <PropertyComments saleUnitId={id} initialComments={safeComments} />
          </div>
        </div>

        {/* --- DESKTOP LAYOUT (2 Columns) --- */}
        <div className="hidden lg:grid grid-cols-12 gap-6 items-start pb-6 w-full">
          
          {/* LEFT COLUMN */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <section className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-none border border-slate-200 dark:border-zinc-800">
              {TitleAndTagsUI}
              {ImageGalleryUI && <div className="mt-4">{ImageGalleryUI}</div>}
              {CourtValuationUI}
              {PdfLinksUI}
            </section>

            {AiAnalysisUI}
            {nodePropertySections}
            <div id="property-agencies-section">
              <PropertyAgencies prefecture={property.prefecture || "東京都"} city={property.city || undefined} agencies={safeAgencies} />
            </div>
            <PropertyComments saleUnitId={id} initialComments={safeComments} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {nodeRoiCalculator}
            {nodeMarketValuation}
            {nodeMarketComparison}
            {nodeDetailMap}
          </div>

        </div>

        {/* --- INTERNAL LINKING SPIDERWEB HUB & ACTIVE NEARBY CARDS (SEO SILO MATRIX) --- */}
        <div className="w-full mt-10 space-y-10">
          {safeNearbyActive && safeNearbyActive.length > 0 && (
            <NearbyActiveGrid 
              properties={safeNearbyActive} 
              currentPrefecture={property.prefecture || ''} 
              currentCity={property.city || ''} 
            />
          )}
          <PropertySpiderwebHub 
            prefecture={property.prefecture || ''} 
            city={property.city || ''} 
            propertyType={property.property_type || ''} 
            nearestStations={safeNearestStations} 
          />
        </div>

      </main>
    </div>
    </>
  );
}
