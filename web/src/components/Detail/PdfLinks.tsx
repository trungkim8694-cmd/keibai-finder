import React from 'react';
import Link from 'next/link';
import { FileText, Download, ExternalLink, HelpCircle, Phone, MapPin } from 'lucide-react';

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
    <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
      <h3 className="font-bold mb-3.5 flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
        <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
        <span>物件資料・入札手続き</span>
      </h3>
      
      {/* Action Bar Container */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-2.5 w-full">
        
        {/* Primary Action (3点セット / 物件資料PDF) */}
        <div className="flex-1 flex flex-wrap gap-2">
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

               const resolveNtaDoc = (url: string, index: number) => {
                 const u = url.toLowerCase();
                 if (u.includes('_k.pdf')) return { label: '公売公告・財産明細 (PDF)', isPrimary: true };
                 if (u.includes('so04') || url.includes('ＳＯ04')) return { label: '公売のしおり・注意事項①', isPrimary: false };
                 if (u.includes('so05') || url.includes('ＳＯ05')) return { label: '入札手続・注意事項②', isPrimary: false };
                 if (u.includes('doc=3')) return { label: '入札書・保証金納付書様式', isPrimary: false };
                 if (u.includes('doc=4')) return { label: '陳述書様式（必須書類）', isPrimary: false };
                 if (u.includes('ininjou')) return { label: '委任状様式 (PDF)', isPrimary: false };
                 return { label: `公売資料 ${index + 1}`, isPrimary: index === 0 };
               };

               if (ntaPdfs.length > 0) {
                 return (
                   <>
                     {ntaPdfs.map((url, i) => {
                       const doc = resolveNtaDoc(url, i);
                       return (
                         <a 
                           key={i}
                           href={url} 
                           target="_blank" 
                           rel="noreferrer"
                           className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-md transition-colors text-xs shadow-2xs ${
                             doc.isPrimary
                               ? 'bg-[#1B4F8A] hover:bg-[#153e6d] text-white flex-1 min-w-[170px]'
                               : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                           }`}
                         >
                           <Download className="w-3.5 h-3.5" />
                           <span>{doc.label}</span>
                         </a>
                       );
                     })}
                   </>
                 );
               } else {
                 return (
                   <div className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium rounded-md border border-slate-200 dark:border-slate-700 text-xs cursor-not-allowed">
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
                      className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>3点セット一括ダウンロード</span>
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
                          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>3点セット {index > 0 ? index + 1 : ''}</span>
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
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4F8A] hover:bg-[#153e6d] text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>3点セットPDF</span>
                    </a>
                 );
               } else {
                 return (
                    <div className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium rounded-md border border-slate-200 dark:border-slate-700 text-xs cursor-not-allowed">
                      3点セットPDF準備中
                    </div>
                 );
               }
             }
          })()}
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {sourceProvider === 'NTA' ? (
            <>
              <a 
                href={eTaxLink || "https://www.koubai.nta.go.jp/auctionx/mngr/MngrLoginInit.action"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-md text-xs transition-colors shadow-2xs"
              >
                <span>国税庁e-Tax入札システム</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={ntaMapUrl || sourceUrl || 'https://www.nta.go.jp/'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>所在地図・詳細</span>
              </a>
            </>
          ) : (
            <>
              <a 
                href="https://www.bit.courts.go.jp/guidance/guidance03/index.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>入札手順ガイド</span>
              </a>
              <a 
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>管轄裁判所連絡先</span>
              </a>
            </>
          )}
        </div>
        
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
        ※ 入札参加にあたっては、必ず管轄裁判所または国税庁が公示する公式「3点セット（現況調査報告書・評価書・物件明細書）」の原本をご確認ください。
      </p>
    </div>
  );
}
