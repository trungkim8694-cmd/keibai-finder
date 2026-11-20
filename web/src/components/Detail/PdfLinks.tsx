'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  HelpCircle, 
  Phone, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface PdfLinksProps {
  saleUnitId?: string;
  images: string[];
  pdfUrl?: string | null;
  courtId?: string | null;
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  rawDisplayData?: any;
  bitContactUrl?: string | null;
  courtName?: string | null;
  managingAuthority?: string | null;
}

export function PdfLinks({ 
  saleUnitId, 
  images, 
  pdfUrl, 
  courtId, 
  sourceProvider, 
  sourceUrl, 
  rawDisplayData, 
  bitContactUrl,
  courtName,
  managingAuthority
}: PdfLinksProps) {
  const isBit = !sourceProvider || sourceProvider === 'BIT';
  const isMof = sourceProvider === 'MOF';
  const isNta = sourceProvider === 'NTA';
  const isKsi = sourceProvider === 'KSI';
  const isKoubai = isNta || isKsi;

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

  const bitDirectDownloadUrl = (isBit && finalCourtId && saleUnitId) 
    ? `https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId=${finalCourtId}&saleUnitId=${saleUnitId}` 
    : null;

  const contactUrl = bitContactUrl 
    ? bitContactUrl
    : finalCourtId 
      ? `https://www.bit.courts.go.jp/info/info_${finalCourtId}.html` 
      : `https://www.bit.courts.go.jp/info/index.html`;
    
  const ntaMapUrl = rawDisplayData?.nta_map_link;
  const eTaxLink = rawDisplayData?.etax_link;

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
      <h3 className="font-bold mb-3.5 flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
        <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
        <span>物件資料・入札手続き</span>
      </h3>
      
      {/* Action Bar Container */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch gap-2.5 w-full">
        
        {/* Primary Action (物件資料PDF / 3点セット / 公売明細) */}
        <div className="flex-1 flex flex-wrap gap-2">
          {(() => {
            // A. MOF - Ministry of Finance National Property Sales (物件調書)
            if (isMof) {
              if (pdfUrl) {
                return (
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="nofollow noopener noreferrer"
                    className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>物件調書 (PDF)</span>
                  </a>
                );
              } else if (sourceUrl) {
                return (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="nofollow noopener noreferrer"
                    className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>財務局 公示ページへ</span>
                  </a>
                );
              } else {
                return (
                  <div className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium rounded-md border border-slate-200 dark:border-slate-700 text-xs cursor-not-allowed">
                    物件調書PDF準備中
                  </div>
                );
              }
            }

            // B. NTA - National Tax Agency Public Auction
            if (isNta) {
              let ntaPdfs: string[] = [];
              try {
                if (pdfUrl) {
                  const parsed = JSON.parse(pdfUrl);
                  if (Array.isArray(parsed)) ntaPdfs = parsed.filter((u) => typeof u === 'string' && u.startsWith('http'));
                  else if (typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) ntaPdfs = [pdfUrl];
                }
              } catch {
                if (pdfUrl && pdfUrl.startsWith('http')) ntaPdfs = [pdfUrl];
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
                          rel="nofollow noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold rounded-md transition-colors text-xs shadow-2xs ${
                            doc.isPrimary
                              ? 'bg-rose-700 hover:bg-rose-800 text-white flex-1 min-w-[170px]'
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
                    公売資料準備中
                  </div>
                );
              }
            }

            // C. KSI - Government Auction
            if (isKsi) {
              if (pdfUrl) {
                return (
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="nofollow noopener noreferrer"
                    className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>公売財産明細 (PDF)</span>
                  </a>
                );
              } else if (sourceUrl) {
                return (
                  <a 
                    href={sourceUrl} 
                    target="_blank" 
                    rel="nofollow noopener noreferrer"
                    className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-md transition-colors text-xs shadow-2xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>官公庁公売ページへ</span>
                  </a>
                );
              } else {
                return (
                  <div className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium rounded-md border border-slate-200 dark:border-slate-700 text-xs cursor-not-allowed">
                    公売資料準備中
                  </div>
                );
              }
            }

            // D. BIT - Court Auction (3点セット)
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
                       rel="nofollow noopener noreferrer"
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
                   rel="nofollow noopener noreferrer"
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
          })()}
        </div>

        {/* Secondary Actions (Guide & Authority Links) */}
        <div className="flex flex-wrap items-center gap-2">
          {isMof ? (
            <>
              <a 
                href="https://www.mof.go.jp/policy/national_property/topics/bidding/index.html"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
                title="財務省 国有財産の一般競争入札のご案内"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>国有財産入札ガイド</span>
              </a>
              <a 
                href={sourceUrl || "https://www.mof.go.jp/about_mof/mof_local/index.html"}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-md text-xs transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{courtName || '管轄財務局'} 公式公示</span>
              </a>
            </>
          ) : isNta ? (
            <>
              <a 
                href={eTaxLink || "https://www.koubai.nta.go.jp/auctionx/mngr/MngrLoginInit.action"}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-md text-xs transition-colors shadow-2xs"
              >
                <span>国税庁e-Tax入札システム</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={ntaMapUrl || sourceUrl || 'https://www.nta.go.jp/'}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>所在地図・詳細</span>
              </a>
            </>
          ) : isKsi ? (
            <>
              <a 
                href="https://kankocho.jp/guide/"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
                title="KSI官公庁オークション ガイド"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>官公庁公売ガイド</span>
              </a>
              <a 
                href={sourceUrl || "https://kankocho.jp/"}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-md text-xs transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{managingAuthority || '官公庁公売'} 公示</span>
              </a>
            </>
          ) : (
            <>
              <a 
                href="https://www.bit.courts.go.jp/guidance/guidance03/index.html"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium rounded-md text-xs transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>入札手順ガイド</span>
              </a>
              <a 
                href={contactUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
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
        {isMof ? (
          '※ 入札参加にあたっては、必ず財務省（管轄財務局）が公示する公式「物件調書・入札案内書」の原本をご確認ください。'
        ) : isNta ? (
          '※ 入札参加にあたっては、必ず国税庁（所轄税務署）が公示する公式「公売公告・公売財産明細書」の原本をご確認ください。'
        ) : isKsi ? (
          '※ 入札参加にあたっては、必ず売却元自治体・官公庁が公示する公式「公売財産明細・見積価額」の原本をご確認ください。'
        ) : (
          '※ 入札参加にあたっては、必ず管轄地方裁判所が公示する公式「3点セット（現況調査報告書・評価書・物件明細書）」の原本をご確認ください。'
        )}
      </p>

      {/* --- SEO & BEGINNER GUIDE: Provider-specific Bidding Guide --- */}
      <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/70 dark:bg-zinc-900/60 text-xs">
        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded font-bold text-[11px] ${
              isMof ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' :
              isKoubai ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300' :
              'bg-[#1B4F8A]/10 text-[#1B4F8A] dark:text-sky-400'
            }`}>
              初心者ガイド
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {isMof ? '国有財産売却（財務省）の物件調書の確認点と入札の流れ' :
               isKoubai ? '公売（税務署・自治体）の財産明細の確認点と入札の流れ' :
               '3点セットの読み方・チェックポイントと期間入札の流れ'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <span>{isGuideOpen ? '閉じる' : '解説を見る'}</span>
            {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isGuideOpen && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900">
            {/* 1. Documents Breakdown */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2 text-xs">
                <BookOpen className={`w-3.5 h-3.5 ${
                  isMof ? 'text-amber-600 dark:text-amber-400' :
                  isKoubai ? 'text-rose-600 dark:text-rose-400' :
                  'text-[#1B4F8A] dark:text-sky-400'
                }`} />
                <span>
                  {isMof ? '国有財産売却（財務省資料）の読み方と重要確認ポイント' :
                   isKoubai ? '公売財産明細書（税務署・自治体資料）の重要確認ポイント' :
                   '3点セット（裁判所資料）の読み方と重要確認ポイント'}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {isMof ? (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 text-[11px]">① 物件調書（最重要）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        土地・建物の現況、接道状況、境界確定や地積測量図の有無、埋設物・土壌調査の実施状況を記載。現況有姿での引渡しが基本となります。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 text-[11px]">② 一般競争入札案内書</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        最低入札価格（予定価格）、入札保証金の金額（通常10%以上）、入札書の提出受付期間、開札場所・日時および入札資格が明記されています。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 text-[11px]">③ 売買契約書案</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        国と落札者との間で締結される売買契約の条項。所有権移転登記は国が嘱託で行うため、安心・確実な登記手続きが可能です。
                      </p>
                    </div>
                  </>
                ) : isKoubai ? (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-rose-700 dark:text-rose-400 mb-1 text-[11px]">① 公売財産明細書（最重要）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        滞納処分による差押財産の現況、公売特殊事項、賃貸借等の権利関係。裁判所競売とは異なり、明渡しは落札者の自主交渉となります。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-rose-700 dark:text-rose-400 mb-1 text-[11px]">② 見積価額・公売保証金</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        公売の最低入札価格となる見積価額と、事前納付が必要な公売保証金額（通常見積価額の10%〜20%相当）が明記されています。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-rose-700 dark:text-rose-400 mb-1 text-[11px]">③ 陳述書（必須提出書類）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        入札者が暴力団員等に該当しない旨を誓約する陳述書。公売参加にあたって入札書と併せて事前提出が義務付けられています。
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-[#1B4F8A] dark:text-sky-400 mb-1 text-[11px]">① 物件明細書（最重要）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        落札者が引き受ける権利関係を明記。賃借権が対抗できるか、抵当権が抹消されるか、法定地上権の成立可否を必ず確認します。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-[#1B4F8A] dark:text-sky-400 mb-1 text-[11px]">② 現況調査報告書（占有状況）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        裁判所の執行官が現地訪問した調査結果。債務者が居住中か空き家か、賃借人の有無、室内の損耗や荷物の残置状況が記されています。
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                      <div className="font-bold text-[#1B4F8A] dark:text-sky-400 mb-1 text-[11px]">③ 評価書（価格＆法規制）</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        不動産鑑定士による売却基準価額の算定根拠。用途地域・建蔽率・容積率、再建築不可や接道状況、周辺の市場取引相場が記載されます。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Bidding Process Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2 text-xs">
                <Clock className={`w-3.5 h-3.5 ${
                  isMof ? 'text-amber-600 dark:text-amber-400' :
                  isKoubai ? 'text-rose-600 dark:text-rose-400' :
                  'text-[#1B4F8A] dark:text-sky-400'
                }`} />
                <span>
                  {isMof ? '財務省 国有財産 一般競争入札の手続きと流れ（4ステップ）' :
                   isKoubai ? '公売（税務署・自治体）の入札手続きと流れ（4ステップ）' :
                   '裁判所 期間入札の手続きと流れ（4ステップ）'}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                {isMof ? (
                  <>
                    <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Step 1. 入札保証金納付</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        入札金額の10%以上の入札保証金を国庫指定口座へ事前振込。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Step 2. 入札書の提出</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        入札書および保証金納付証明書を管轄財務局へ郵送または持参。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Step 3. 開札・落札決定</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        開札日時に予定価格以上で最高価格を付けた者が落札者に決定。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Step 4. 契約締結・登記</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        国と売買契約を締結し代金を完納。所有権移転登記は国が嘱託。
                      </span>
                    </div>
                  </>
                ) : isKoubai ? (
                  <>
                    <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Step 1. 公売保証金納付</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        見積価額の指定割合（10%〜20%）を公売実施機関へ事前納付。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Step 2. 入札書・陳述書提出</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        入札期間内に入札書と暴力団排除誓約陳述書を提出。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Step 3. 開札日</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        開札期日に最高価申込者を決定。落札できなかった場合は保証金返還。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Step 4. 売却決定・代金納付</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        売却決定日に残代金を納付。占有者への明渡しは自主交渉。
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                      <span className="font-bold text-[#1B4F8A] dark:text-blue-300 block mb-0.5">Step 1. 保証金納付</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        売却基準価額の20%以上の入札保証金を裁判所指定口座へ事前振込。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                      <span className="font-bold text-[#1B4F8A] dark:text-blue-300 block mb-0.5">Step 2. 期間入札書提出</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        入札書・振込証明書・住民票等を管轄裁判所執行官室へ郵送または持参。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                      <span className="font-bold text-[#1B4F8A] dark:text-blue-300 block mb-0.5">Step 3. 開札日</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        開札期日に最高価買受申出人が決定。落札できなかった場合は保証金が全額返還。
                      </span>
                    </div>
                    <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                      <span className="font-bold text-[#1B4F8A] dark:text-blue-300 block mb-0.5">Step 4. 代金納付・引渡し</span>
                      <span className="text-slate-600 dark:text-slate-400 leading-tight block">
                        残代金を納付して所有権移転登記。占有者がいる場合は引渡命令を申立。
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* In-depth Link */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                さらに詳しい競売・公売・国有財産入札の実務ノウハウや対処法はこちら
              </span>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-1 font-bold text-[#1B4F8A] dark:text-sky-400 hover:underline"
              >
                <span>ナレッジコラムを読む</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
