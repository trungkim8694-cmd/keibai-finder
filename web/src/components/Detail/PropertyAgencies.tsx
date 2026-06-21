'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Star, ArrowRight, Info } from 'lucide-react';

interface Agency {
  id: string;
  companyName: string;
  licenseNumber: string;
  phone: string;
  logoUrl: string | null;
  reviews: { rating: number }[];
}

interface PropertyAgenciesProps {
  prefecture: string;
  agencies: Agency[];
}

export function PropertyAgencies({ prefecture, agencies }: PropertyAgenciesProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            💼 {prefecture} エリアの競売サポート会社
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            {prefecture}エリアのサポートに対応している競売サポート会社
          </p>
        </div>
        
        <Link
          href="/dashboard/agency"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          掲載ご希望の不動産会社様はこちら
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {agencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agencies.map((agency) => {
            const totalReviews = agency.reviews.length;
            const avgRating = totalReviews > 0
              ? (agency.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
              : '0.0';

            return (
              <div
                key={agency.id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-blue-500/30 dark:hover:border-blue-500/20 shadow-sm transition-all group"
              >
                <div className="space-y-4">
                  {/* Agency Logo & Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.companyName} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {agency.companyName}
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                        免許: {agency.licenseNumber}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(Number(avgRating))
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-300 dark:text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{avgRating}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold">({totalReviews})</span>
                  </div>

                  {/* Contact Phone */}
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-bold text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <a href={`tel:${agency.phone}`} className="hover:underline text-zinc-900 dark:text-zinc-100">
                      {agency.phone}
                    </a>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Link
                    href={`/agencies/${agency.id}`}
                    className="w-full inline-flex items-center justify-center gap-1 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    詳細・クチコミを見る
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              このエリアに対応可能な会社はまだ登録されていません。
            </p>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium space-y-1.5">
              <p>競売不動産のサポート対応が可能な会社様は、こちらからプロフィールをご登録いただけます（無料）。</p>
              <ul className="text-left list-disc pl-5 space-y-0.5 inline-block text-[11px] text-zinc-500">
                <li>該当エリアの物件ページに連絡先情報を無料表示</li>
                <li>月間数百万ユーザーが利用する keibai-koubai.com での貴社PR</li>
                <li>対応エリアからの直接的な見込み客の自然流入と獲得</li>
              </ul>
            </div>
          </div>
          <Link
            href="/dashboard/agency"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors mt-2"
          >
            今すぐ掲載登録する
          </Link>
        </div>
      )}
    </div>
  );
}
