import sys

with open("web/src/app/property/[id]/page.tsx", "r") as f:
    text = f.read()

start_idx = text.find('  return (\n    <>\n      <script')
if start_idx == -1:
    print("Could not find start index")
    sys.exit(1)

new_return = """  // --- UI CHUNKS ---
  const TitleAndTagsUI = (
    <div className="w-full">
      <div className="mb-2 flex justify-between items-center w-full gap-2">
        <div className="min-w-[0]">
          <span className="text-[13px] font-bold block truncate">
            {property.source_provider === 'NTA' ? (
              <CourtContactLink 
                courtName={property.managing_authority ? property.managing_authority.split('\\n').join('').replace(/\\s+/g, ' ').trim() : 'NTA 税務署'} 
                contactUrl={property.contact_url || property.source_url} 
                theme="red"
              />
            ) : (
              <CourtContactLink courtName={property.court_name} contactUrl={bitContactUrl} />
            )}
          </span>
        </div>
        {property.mlit_investment_gap !== null && property.mlit_investment_gap !== undefined && property.mlit_investment_gap > 0 && (
          <span className="shrink-0 inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 shadow-sm whitespace-nowrap transition-transform hover:scale-105">
            <span className="text-[11px] sm:text-[12px]">📈</span> ギャップ +{property.mlit_investment_gap.toFixed(1)}%
          </span>
        )}
      </div>
      <h1 className="text-lg md:text-xl font-black mb-2">{!(property as any).prefecture && !(property as any).city ? '詳細情報' : `${(property as any).prefecture || ''} ${(property as any).city || ''}${(property as any).address}`}</h1>
      
      <div className="mb-3">
         <PropertyInfoTags property={serializedProperty} displayArea={displayArea} showCourtTag={false}>
           {serializedHistory.length > 0 && (
             <AuctionHistoryBadge history={serializedHistory} />
           )}
         </PropertyInfoTags>
      </div>
    </div>
  );

  const ImageGalleryUI = (property as any).images && Array.isArray((property as any).images) && (property as any).images.length > 0 ? (
    <ImageGallery images={(property as any).images as string[]} />
  ) : null;

  const CourtValuationUI = (
    <CourtValuation 
      formattedStartPrice={formattedStartPrice} 
      endDate={endDateRaw}
      startDate={(property as any).bid_start_date ? new Date((property as any).bid_start_date) : null}
      nearestStations={safeNearestStations}
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
    <div className="space-y-8 mb-8 lg:mb-0">
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
          <div className="bg-zinc-200 dark:bg-zinc-800 px-4 py-3 md:px-6 md:py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="font-bold text-lg md:text-xl text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-3">
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
          <div className="sm:p-2 overflow-x-auto">
            <table className="w-full text-[13px] md:text-sm text-left">
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                {Object.entries(section.data).map(([key, value], vIdx) => {
                  const isMissing = !value || value === '-' || value.trim() === '-';
                  return (
                  <tr key={vIdx} className="flex flex-col sm:table-row even:bg-zinc-50/80 odd:bg-white dark:even:bg-zinc-800/30 dark:odd:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors">
                    <th scope="row" className="px-4 py-3 md:px-6 md:py-4 font-semibold text-zinc-600 dark:text-zinc-400 bg-transparent sm:bg-transparent sm:w-1/3 border-b sm:border-b-0 border-zinc-100 dark:border-zinc-800 min-w-[35%]">
                      {key}
                    </th>
                    <td className={`px-4 py-3 md:px-6 md:py-4 whitespace-pre-wrap break-words ${isMissing ? 'text-zinc-400 dark:text-zinc-600 italic' : 'text-zinc-900 dark:text-zinc-100'}`}>
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
    <div className="text-center py-20 mb-8 lg:mb-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500">
      <p className="text-4xl mb-4">📭</p>
      <p className="font-medium text-lg">詳細な抽出データがありません</p>
      <p className="text-sm mt-2 opacity-80">Crawler chưa lưu khối raw_display_data cho bất động sản này.</p>
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
    <div className="mb-8 lg:mb-0 mt-2">
      <React.Suspense fallback={<div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
        <MarketComparison nearbySold={safeNearbySold} stations={safeNearestStations} />
      </React.Suspense>
    </div>
  ) : null;

  const nodeMarketValuation = property.prefecture && property.city && property.property_type && ['戸建て', 'マンション', '土地'].includes(property.property_type) ? (
    <div className="mb-8 lg:mb-0">
      <React.Suspense fallback={<div className="h-48 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />}>
        <MarketValuation 
          prefecture={property.prefecture}
          city={property.city}
          propertyType={property.property_type}
          basePriceNum={basePriceNum}
          propertyArea={parsedArea}
          dbMlitEstimatedPrice={property.mlit_estimated_price ? Number(property.mlit_estimated_price) : null}
          dbMlitInvestmentGap={property.mlit_investment_gap ? Number(property.mlit_investment_gap) : null}
        />
      </React.Suspense>
    </div>
  ) : null;

  const nodeAiAnalysisPanel = <AiAnalysisPanel />;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-20 overflow-x-hidden w-full overflow-y-auto">
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

      <main className="w-full max-w-7xl mx-auto mt-6 px-4 overflow-x-hidden">
        
        {/* --- MOBILE LAYOUT (Single Column) --- */}
        <div className="flex lg:hidden max-w-4xl mx-auto flex-col w-full">
          <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
            {TitleAndTagsUI}
            {ImageGalleryUI && <div className="mt-4">{ImageGalleryUI}</div>}
            {CourtValuationUI}
            {PdfLinksUI}
          </section>

          {nodePropertySections}
          {nodeDetailMap}
          {nodeMarketComparison}
          {nodeMarketValuation}
          {nodeAiAnalysisPanel}
        </div>

        {/* --- DESKTOP LAYOUT (2 Columns) --- */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-start pb-12 w-full">
          
          {/* LEFT COLUMN */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
            {ImageGalleryUI && (
              <section className="bg-transparent border-none p-0">
                {ImageGalleryUI}
              </section>
            )}

            {nodeMarketComparison}
            {nodeDetailMap}
            {nodePropertySections}
            {nodeMarketValuation}
            {nodeAiAnalysisPanel}
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-4 sticky top-24 flex flex-col gap-6">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
              {TitleAndTagsUI}
              <div className="mt-4">
                {CourtValuationUI}
              </div>
              <div className="mt-4">
                {PdfLinksUI}
              </div>
            </section>
          </div>

        </div>

      </main>
    </div>
    </>
  );
}
"""

with open("web/src/app/property/[id]/page.tsx", "w") as f:
    f.write(text[:start_idx] + new_return)

print("Replaced layout successfully")
