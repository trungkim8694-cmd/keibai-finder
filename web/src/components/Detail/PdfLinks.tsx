import React from 'react';

interface PdfLinksProps {
  saleUnitId?: string;
  images: string[];
  pdfUrl?: string | null;
  courtId?: string | null;
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  rawDisplayData?: any;
  bitContactUrl?: string | null;
}

export function PdfLinks({ saleUnitId, images, pdfUrl, courtId, sourceProvider, sourceUrl, rawDisplayData, bitContactUrl }: PdfLinksProps) {
  const allGlobalFiles = Array.isArray(images) ? images : [];
  const pdfFiles = allGlobalFiles.filter((url: string) => typeof url === 'string' && url.toLowerCase().endsWith('.pdf'));

  let finalCourtId = courtId;
  if (!finalCourtId && pdfUrl) {
    try {
      const parsedUrl = new URL(pdfUrl);
      finalCourtId = parsedUrl.searchParams.get('courtId') || parsedUrl.searchParams.get('courtCd');
    } catch {
       // Ignore
    }
  }

  // Khôi phục CourtId từ contactUrl để phục vụ cho tính năng link trực tiếp PDF (Bypass Hotlink)
  if (!finalCourtId && bitContactUrl) {
    const match = bitContactUrl.match(/info_([A-Za-z0-9_]+)\.html/);
    if (match) {
        finalCourtId = match[1];
    }
  }

  if (!finalCourtId && sourceUrl) {
    try {
      const parsedSrc = new URL(sourceUrl);
      finalCourtId = parsedSrc.searchParams.get('courtId') || parsedSrc.searchParams.get('courtCd');
    } catch {
       // Ignore
    }
  }

  // Tái tạo link tải trực tiếp giống đối thủ: `.../pd001/h04?courtId=xxx&saleUnitId=xxx`
  const bitDirectDownloadUrl = (sourceProvider !== 'NTA' && finalCourtId && saleUnitId) 
    ? `https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId=${finalCourtId}&saleUnitId=${saleUnitId}` 
    : null;

  const contactUrl = bitContactUrl 
    ? bitContactUrl
    : finalCourtId 
      ? `https://www.bit.courts.go.jp/info/info_${finalCourtId}.html` 
      : `https://www.bit.courts.go.jp/info/index.html`;
    
  const ntaMapUrl = rawDisplayData?.nta_map_link;
  const eTaxLink = rawDisplayData?.etax_link;

  return (
    <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6 overflow-hidden">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
        📄 アクション (手続き・問い合わせ)
      </h3>
      
      {/* Action Bar Container */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-3">
        
        {/* Primary Action (3点セット) */}
        <div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 min-w-[280px]">
          {(() => {
             if (sourceProvider === 'NTA') {
               let ntaPdfs: string[] = [];
               try {
                 if (pdfUrl) {
                   const parsed = JSON.parse(pdfUrl);
                   if (Array.isArray(parsed)) ntaPdfs = parsed;
                   else ntaPdfs = [pdfUrl];
                 }
               } catch {
                 if (pdfUrl) ntaPdfs = [pdfUrl];
               }

               const ntaLabels = ['物件情報PDF', '公売公告PDF', 'その他情報PDF'];
               if (ntaPdfs.length > 0) {
                 return (
                   <>
                     {ntaPdfs.map((url, i) => (
                        <a 
                          key={i}
                          href={url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-auto inline-flex items-center justify-center px-1.5 py-2.5 sm:py-0 min-h-[48px] bg-white dark:bg-zinc-900 border border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-lg transition-all active:scale-95 text-xs sm:text-sm"
                        >
                          <span className="text-sm shrink-0">📄</span> 
                          <span className="ml-1 whitespace-nowrap text-[11px] sm:text-xs">{ntaLabels[i] || `PDF ${i + 1}`}</span>
                        </a>
                     ))}
                   </>
                 );
               } else {
                 return (
                   <div className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:py-0 min-h-[56px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-not-allowed">
                     PDF準備中
                   </div>
                 );
               }
             } else {
               if (bitDirectDownloadUrl) {
                 return (
                   <a 
                      href={bitDirectDownloadUrl} 
                      target="_blank" 
                      rel="nofollow noopener noreferrer"
                      download=""
                      className="flex-1 inline-flex items-center justify-center px-2 sm:px-4 py-2 sm:py-0 min-h-[44px] sm:min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.4)] border border-blue-500 transition-all active:scale-95"
                    >
                      <span className="text-lg sm:text-xl shrink-0">📥</span> 
                      <span className="ml-1.5 sm:ml-2 whitespace-nowrap text-[13px] sm:text-base">物件資料PDF</span>
                    </a>
                 );
               } else if (pdfFiles.length > 0) {
                 return (
                   <>
                     {pdfFiles.map((pdfStr: string, index: number) => (
                        <a 
                          key={index}
                          href={pdfStr} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center px-2 sm:px-4 py-2 sm:py-0 min-h-[44px] sm:min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.4)] border border-blue-500 transition-all active:scale-95"
                        >
                          <span className="text-lg sm:text-xl shrink-0">📥</span> 
                          <span className="ml-1.5 sm:ml-2 whitespace-nowrap text-[13px] sm:text-base">3点セット {index > 0 ? index + 1 : ''}</span>
                        </a>
                     ))}
                   </>
                 );
               } else if (pdfUrl) {
                 return (
                   <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-2 sm:px-4 py-2 sm:py-0 min-h-[44px] sm:min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.4)] border border-blue-500 transition-all active:scale-95"
                    >
                      <span className="text-lg sm:text-xl shrink-0">📥</span> 
                      <span className="ml-1.5 sm:ml-2 whitespace-nowrap text-[13px] sm:text-base">3点セット</span>
                    </a>
                 );
               } else {
                 return (
                    <div className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:py-0 min-h-[56px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-not-allowed">
                      PDF準備中
                    </div>
                 );
               }
             }
          })()}
        </div>

        {/* Secondary Actions (Row on Mobile, Side on Desktop) */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          {sourceProvider === 'NTA' ? (
            <>
              <a 
                href={eTaxLink || "https://www.koubai.nta.go.jp/auctionx/mngr/MngrLoginInit.action"}
                target="_blank"
                rel="noreferrer"
                className="flex-[2] sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-0 min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-sm"
              >
                <span className="whitespace-nowrap text-xs sm:text-sm">電子で入札される方はこちらからログイン ↗</span>
              </a>
              <a 
                href={ntaMapUrl || sourceUrl || 'https://www.nta.go.jp/'}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-0 min-h-[48px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg transition-all active:scale-95"
              >
                <span className="whitespace-nowrap text-xs sm:text-sm font-semibold">📍 所在地図 ・ 📞 問い合わせ</span>
              </a>
            </>
          ) : (
            <>
              <a 
                href="https://www.bit.courts.go.jp/guidance/guidance03/index.html"
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-0 min-h-[48px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg transition-all active:scale-95"
              >
                <span className="text-lg">🔨</span>
                <span className="ml-1.5 whitespace-nowrap text-xs sm:text-sm">入札方法</span>
              </a>
              <a 
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2.5 sm:py-0 min-h-[48px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg transition-all active:scale-95"
              >
                <span className="text-lg">📞</span>
                <span className="ml-1 whitespace-nowrap text-xs sm:text-sm">問い合わせ</span>
              </a>
            </>
          )}
        </div>
        
      </div>

      <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-4 max-w-2xl font-medium">
        「※入札前に必ず3点セットの内容を十分にご確認ください。」詳細な仕様や寸法については必ずご自身でダウンロードしてご確認ください。
      </p>
    </div>
  );
}
