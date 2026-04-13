import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
// PRESERVE: PDF & Image Logic - DO NOT REMOVE.
import Link from 'next/link';
import { PropertyImageGallery } from '@/components/PropertyImageGallery';
import { calculateRoi, convertToWesternYear, extractAuctionSchedule, extractAuctionRoundFromData, extractTotalArea } from '@/lib/utils';
import { formatBidPeriod } from '@/utils/dateFormatter';
import MarketComparison from './MarketComparison';
import { getNearestStations, getNearbyAuctionResults } from './actions';
import { getProperties } from '@/actions/propertyActions';
import DetailMapComponent from './DetailMapComponent';
import { PdfLinks } from '@/components/Detail/PdfLinks';
import { CourtValuation } from '@/components/Detail/CourtValuation';
import { MarketValuation } from '@/components/Detail/MarketValuation';
import { AuctionHistoryBadge } from '@/components/Detail/AuctionHistoryBadge';
import { PropertyInfoTags } from '@/components/PropertyInfoTags';
import { ViewTracker } from '@/components/Detail/ViewTracker';
import { StickyActionBar } from '@/components/Detail/StickyActionBar';
import { AiAnalysisPanel } from '@/components/Detail/AiAnalysisPanel';
import { ImageGallery } from '@/components/Detail/ImageGallery';
import { Metadata } from 'next';

export const revalidate = 3600; // Cache property details for 1 hour

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { sale_unit_id: id } });
  
  if (!property) return { title: '物件が見つかりません' };

  const priceFormatted = property.reference_price ? `${(property.reference_price).toLocaleString()}円` : '価格非公開';
  const typeStr = property.property_type || '競売物件';
  const address = property.address?.substring(0, 20) || '';
  
  const title = `【${priceFormatted}】${address}の${typeStr}｜${property.court_name} 競売物件情報`;
  const description = `${property.address}の${typeStr}（競売/公売）。基準価格は${priceFormatted}です。市場価格より安い不動産をお探しならKeibai Finder。過去の落札相場やAIによる価格査定データを公開中。`;
  
  // Use first image as openGraph image
  let ogImage = undefined;
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
     ogImage = property.images[0]?.url || undefined;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    }
  };
}

export default async function PropertyDetail({ params }: { params: { id: string } }) {
  // Fix Next.js 15+ async params error by awaiting params
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { sale_unit_id: id }
  });

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
               propertySections.push({ asset_title: "📋 物件の概況", asset_type: "NTA", data: rawObj.overview });
            }
            if (rawObj.details && Object.keys(rawObj.details).length > 0) {
               propertySections.push({ asset_title: "🔍 詳細情報", asset_type: "NTA", data: rawObj.details });
            }
            if (rawObj.contact && Object.keys(rawObj.contact).length > 0) {
               propertySections.push({ asset_title: "📞 連絡先", asset_type: "NTA", data: rawObj.contact });
            }
            
            ntaMapLink = rawObj.nta_map_link || null;
            eTaxLink = rawObj.etax_link || null;
        } else {
            const sanitizedData = { ...rawObj };
            ntaMapLink = sanitizedData['nta_map_link'] || null;
            eTaxLink = sanitizedData['etax_link'] || null;
            delete sanitizedData['nta_map_link'];
            delete sanitizedData['etax_link'];
            
            propertySections = [{
              asset_title: "📄 公売物件詳細",
              asset_type: "NTA",
              data: sanitizedData
            }];
        }
      }
      if (Array.isArray(rawObj)) {
        const summary = rawObj.find((s: any) => s.asset_title === 'Summary');
        if (summary?.contact_url) bitContactUrl = summary.contact_url;
      }
    } catch (e) {
      console.error('Error parsing raw_display_data:', e);
    }
  }
  if (propertySections.length === 0) {
      propertySections = [{
          asset_title: "📄 基礎物件データ",
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
    
  let westernYear = (property as any).build_year_western;
  if (!westernYear && property.raw_display_data) {
    const rawStr = JSON.stringify(property.raw_display_data);
    const m = rawStr.match(/"[^"]*年月[^"]*"\s*:\s*"([^"]+)"/);
    if (m) {
      westernYear = convertToWesternYear(m[1]);
    }
  }
  if (!westernYear) westernYear = 1990;
    
  const roiPercent = calculateRoi(property.starting_price, (property as any).prefecture, westernYear, property.property_type);
  const dbArea = (property as any).area && (property as any).area > 0 ? (property as any).area : null;
  const parsedArea = dbArea || extractTotalArea(property.raw_display_data);
  
  const displayArea = parsedArea
    ? `${Math.round(parsedArea).toLocaleString('en-US')}m²` 
    : null;
    
  let auctionSchedule = formatBidPeriod((property as any).bid_start_date, (property as any).bid_end_date);
  if (!auctionSchedule) {
     auctionSchedule = extractAuctionSchedule(property.raw_display_data);
  }
  
  const auctionRound = extractAuctionRoundFromData(property.raw_display_data);
  const endDateRaw = (property as any).bid_end_date ? new Date((property as any).bid_end_date) : null;

  const extPropertyStr = {
    ...property,
    auctionSchedule,
    auctionRound,
    prefecture: (property as any).prefecture,
    city: (property as any).city,
    contact_url: ntaMapLink || undefined
  } as any;

  let nearestStations: any[] = [];
  let nearbyActive: any[] = [];
  let nearbySold: any[] = [];
  let avgMargin = 0;
  let formattedWinningBid = '-';

  if (property.lat && property.lng) {
    nearestStations = await getNearestStations(property.lat, property.lng);
    
    // Fetch nearby active properties
    const allNearby = await getProperties({ prefecture: property.prefecture || undefined, limit: 10 });
    nearbyActive = allNearby.filter((p: any) => p.sale_unit_id !== id).slice(0, 10);

    // Fetch past sold auctions for 10km radius to calculate avg margin
    nearbySold = await getNearbyAuctionResults(property.lat, property.lng, 10);
    
    if (nearbySold && nearbySold.length > 0) {
      const totalMargin = nearbySold.reduce((acc, curr) => acc + (curr.marginRate || 0), 0);
      avgMargin = Math.round(totalMargin / nearbySold.length);
    }
  }

  // Calculate final winning bid recommendation
  const basePriceNum = property.starting_price ? Number(property.starting_price) : 0;
  if (basePriceNum > 0) {
    const rawBid = basePriceNum * (1 + avgMargin / 100);
    const winningBid = Math.round(rawBid / 1000) * 1000;
    formattedWinningBid = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(winningBid);
  }

  // Fetch history properties
  let historyItems: { isCurrent: boolean; round: number; price: number; result: string; date: Date }[] = [];
  if (property.address && property.address !== 'Unknown') {
    const similarProps = await prisma.property.findMany({
      where: { 
        address: property.address,
        property_type: property.property_type
      },
      orderBy: { created_at: 'asc' },
      select: {
         sale_unit_id: true,
         starting_price: true,
         created_at: true,
         raw_display_data: true,
      }
    });

    if (similarProps.length > 0) {
      historyItems = similarProps.map((p, idx) => {
        let endDate = null;
        if (p.raw_display_data) {
           const str = typeof p.raw_display_data === 'string' ? p.raw_display_data : JSON.stringify(p.raw_display_data);
           // Try to match "～令和6年...日"
           const match = str.match(/([0-9０-９]+月[0-9０-９]+日)/g);
           if (match && match.length >= 2) endDate = match[match.length - 1];
        }
        
        return {
          isCurrent: p.sale_unit_id === id,
          round: idx + 1,
          price: p.starting_price ? Number(p.starting_price) : 0,
          result: p.sale_unit_id === id ? `(${endDate || '未定'}まで)` : `(不売)`,
          date: p.created_at
        };
      });
      // In case the current property wasn't in DB yet for some reason or wasn't fetched
      if (!historyItems.find(h => h.isCurrent)) {
         historyItems.push({
           isCurrent: true,
           round: historyItems.length + 1,
           price: basePriceNum,
           result: '(受付中)',
           date: property.created_at
         });
      }
    }
  }

  const imagesList = Array.isArray(property.images) ? property.images as Array<any> : [];
  const ogImageUrl = imagesList.length > 0 ? imagesList[0]?.url : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${property.address}の${property.property_type || '競売物件'}`,
    "description": `競売物件: ${property.address}にある${property.property_type || '不動産'}です。`,
    "image": ogImageUrl ? [ogImageUrl] : [],
    "offers": {
      "@type": "Offer",
      "priceCurrency": "JPY",
      "price": property.reference_price || 0,
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-20">
        {property && (
          <ViewTracker 
            id={id} 
            label={property.address || property.court_name || id} 
            image={property.thumbnailUrl} 
          />
        )}
      {/* Sticky Sub-Header Action Bar */}
      <StickyActionBar 
        saleUnitId={property.sale_unit_id} 
        predictedPrice={formattedWinningBid} 
        pdfUrl={property.pdf_url} 
      />

      <main className="max-w-4xl mx-auto mt-6 px-4">
        {/* Short Summary Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black mb-3">{!(property as any).prefecture && !(property as any).city ? '詳細情報' : `${(property as any).prefecture || ''} ${(property as any).city || ''}${(property as any).address}`}</h1>
              
              {/* Quick Stats Block (Single Row Layout) */}
              <div className="mb-3">
                 <PropertyInfoTags property={extPropertyStr as any} displayArea={displayArea} showCourtTag={true}>
                   {historyItems.length > 0 && (
                     <AuctionHistoryBadge history={historyItems} />
                   )}
                 </PropertyInfoTags>
              </div>
            </div>
          </div>
          
          {/* Image Gallery with Lightbox */}
          {(property as any).images && Array.isArray((property as any).images) && (property as any).images.length > 0 && (
            <ImageGallery images={(property as any).images as string[]} />
          )}
          
          <CourtValuation 
            formattedStartPrice={formattedStartPrice} 
            endDate={endDateRaw}
            startDate={(property as any).bid_start_date ? new Date((property as any).bid_start_date) : null}
            nearestStations={nearestStations}
          />

          {/* Action Download Buttons */}
          <PdfLinks 
            saleUnitId={property.sale_unit_id}
            images={(property as any).images ? ((property as any).images as string[]) : []} 
            pdfUrl={(property as any).pdf_url} 
            sourceProvider={(property as any).source_provider}
            sourceUrl={(property as any).source_url}
            bitContactUrl={bitContactUrl}
            rawDisplayData={property.raw_display_data}
          />
          
        </section>



        {/* Dynamic Data Tables (Moved up) */}
        {propertySections.length > 0 ? (
          <div className="space-y-8 mb-8">
            {propertySections.map((section, idx) => {
              const isSummary = section.asset_title === 'Summary';
              const displayTitle = isSummary ? '物件の概況' : section.asset_title;
              
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
                mergedImages = arr;
              } else {
                mergedImages = rawImages.filter(img => !img.toLowerCase().endsWith('.pdf'));
              }

              return (
              <section key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="bg-zinc-200 dark:bg-zinc-800 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="font-bold text-xl text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-3">
                    {displayTitle}
                    {section.asset_type && section.asset_type !== 'Unknown' && section.asset_type !== 'Summary' && (
                      <span className="text-xs font-semibold px-2 py-1 bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md">
                        {section.asset_type}
                      </span>
                    )}
                  </h2>
                </div>
                {mergedImages && mergedImages.length > 0 && !isSummary && (
                  <PropertyImageGallery images={mergedImages} assetTitle={displayTitle} />
                )}
                <div className="p-4 sm:p-6 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                      {Object.entries(section.data).map(([key, value], vIdx) => {
                        const isMissing = !value || value === '-' || value.trim() === '-';
                        return (
                        <tr key={vIdx} className="flex flex-col sm:table-row even:bg-zinc-50/80 odd:bg-white dark:even:bg-zinc-800/30 dark:odd:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors">
                          <th scope="row" className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 bg-transparent sm:bg-transparent sm:w-1/3 border-b sm:border-b-0 border-zinc-100 dark:border-zinc-800">
                            {key}
                          </th>
                          <td className={`px-6 py-4 whitespace-pre-wrap ${isMissing ? 'text-zinc-400 dark:text-zinc-600 italic' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {key === '公法上の規制' || key === '接道状況' || (value && value.length > 200) ? (
                                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar border-l-4 border-zinc-200 dark:border-zinc-700 pl-3">
                                    {value || '-'}
                                </div>
                            ) : (value || '-')}
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
          <div className="text-center py-20 mb-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500">
            <p className="text-4xl mb-4">📭</p>
            <p className="font-medium text-lg">詳細な抽出データがありません</p>
            <p className="text-sm mt-2 opacity-80">Crawler chưa lưu khối raw_display_data cho bất động sản này.</p>
          </div>
        )}

        {/* Advanced Property Detail Map */}
        {property.lat && property.lng && (
            <DetailMapComponent 
              property={property} 
              nearestStations={nearestStations} 
              nearbyActive={nearbyActive} 
              nearbySold={nearbySold}
            />
        )}

        {/* Market Analysis / Near by Phase 3 */}
        {property.lat && property.lng ? (
          <MarketComparison propertyLat={property.lat} propertyLng={property.lng} stations={nearestStations} />
        ) : null}

        {/* MLIT API Real Estate Market Analytics */}
        {property.prefecture && property.city && property.property_type && ['戸建て', 'マンション', '土地'].includes(property.property_type) && (
          <div className="mb-8">
            <React.Suspense fallback={<div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
              <MarketValuation 
                prefecture={property.prefecture}
                city={property.city}
                propertyType={property.property_type}
                basePriceNum={basePriceNum}
                propertyArea={parsedArea}
              />
            </React.Suspense>
          </div>
        )}

        {/* AI Analysis Component (Moved to bottom) */}
        <AiAnalysisPanel 
          data={(property as any).ai_analysis} 
          aiStatus={(property as any).ai_status} 
          propertyType={property.property_type || undefined}
          prefecture={(property as any).prefecture || undefined}
          city={(property as any).city || undefined}
        />
      </main>
    </div>
  );
}
