'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  ExternalLink,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { CompanyClaimModal } from '@/components/Agency/CompanyClaimModal';
import { AgencyLeadModal } from '@/components/Detail/AgencyLeadModal';

export interface PropertyCompanyItem {
  id: string;
  companyName: string;
  licenseNumber: string;
  houjinNumber?: string | null;
  phone?: string | null;
  prefecture: string;
  city: string;
  address: string;
  isVerified: boolean;
  isClaimed: boolean;
  specialties?: string[];
  logoUrl?: string | null;
  description?: string | null;
}

interface PropertyAgenciesProps {
  prefecture: string;
  city?: string;
  agencies: PropertyCompanyItem[];
}

export function PropertyAgencies({ prefecture, city, agencies }: PropertyAgenciesProps) {
  const [claimTarget, setClaimTarget] = useState<PropertyCompanyItem | null>(null);
  const [leadTarget, setLeadTarget] = useState<{ id: string; name: string } | null>(null);

  if (!agencies || agencies.length === 0) {
    return null;
  }

  const locationLabel = city ? `${prefecture} ${city}` : prefecture;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 md:p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-300">
                <ShieldCheck className="w-3 h-3" />
                宅建免許データベース連携
              </span>
              <span className="text-[10px] text-slate-400">公的登記データ</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-1">
              <Building2 className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              <span>{locationLabel}周辺の不動産会社（入札・売買サポート）</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              この物件の入札代行、現地権利調査、占有者との明渡し交渉を相談できる近隣の宅建免許保有業者です。
            </p>
          </div>
          
          <Link
            href={`/agencies?prefecture=${encodeURIComponent(prefecture)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0"
          >
            <span>{prefecture}の不動産会社をもっと探す</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agencies.map((company) => {
            return (
              <div
                key={company.id}
                className={`flex flex-col justify-between p-4 rounded-lg bg-slate-50/70 dark:bg-zinc-950 border transition-all ${
                  company.isVerified
                    ? 'border-blue-200/90 dark:border-blue-900/60 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Verification Badge */}
                  <div className="flex items-center justify-between gap-2">
                    {company.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        公式認証企業
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                        <Info className="w-3 h-3" />
                        公的登記情報
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-slate-400 truncate">
                      {company.city}
                    </span>
                  </div>

                  {/* Company Name & License */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {company.companyName}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                      {company.licenseNumber}
                    </p>
                  </div>

                  {/* Specialties Pills */}
                  {(() => {
                    const displaySpecialties = company.isVerified
                      ? (company.specialties && company.specialties.length > 0 ? company.specialties : ['宅建免許保有'])
                      : ['宅建免許保有'];
                    return (
                      <div className="flex flex-wrap gap-1">
                        {displaySpecialties.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium border ${
                              spec === '宅建免許保有'
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-300'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Description snippet if any */}
                  {company.description && (
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {company.description}
                    </p>
                  )}

                  {/* Contact Phone & Kigyoulist Profile Link */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    {company.phone ? (
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${company.phone}`} className="hover:underline font-mono">
                          {company.phone}
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-400">電話番号: 登記参照</span>
                    )}

                    {company.houjinNumber && (
                      <a
                        href={`https://kigyoulist.com/ja/company/${company.houjinNumber}`}
                        target="_blank"
                        rel="noopener"
                        title={`${company.companyName}の企業登記・信用情報をkigyoulist.comで確認`}
                        className="inline-flex items-center gap-0.5 text-[10.5px] text-[#1B4F8A] dark:text-blue-400 hover:underline"
                      >
                        <span>企業詳細</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-zinc-800 space-y-2">
                  {company.isVerified ? (
                    <button
                      type="button"
                      onClick={() => setLeadTarget({ id: company.id, name: company.companyName })}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1B4F8A] hover:bg-blue-800 text-white font-medium text-xs py-2 rounded-md transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>入札・売買の無料相談</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setClaimTarget(company)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 text-[#1B4F8A] dark:text-blue-300 font-semibold text-xs py-2 rounded-md transition-colors shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                        <span>この企業のオーナー確認（無料）</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Modal */}
      <CompanyClaimModal
        isOpen={Boolean(claimTarget)}
        onClose={() => setClaimTarget(null)}
        company={claimTarget}
      />

      {/* Lead Inquiry Modal */}
      {leadTarget && (
        <AgencyLeadModal
          isOpen={Boolean(leadTarget)}
          onClose={() => setLeadTarget(null)}
          saleUnitId={undefined}
          agencyProfileId={leadTarget.id}
          agencyName={leadTarget.name}
        />
      )}
    </>
  );
}
