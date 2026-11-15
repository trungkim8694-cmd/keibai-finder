import React from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { HOMEPAGE_FAQS } from '@/data/homepageFaqs';

export default function HomeFaqAccordion() {
  return (
    <section className="w-full max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/90 dark:border-zinc-800 p-6 shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            競売物件（けいばい）・公売に関するよくある質問
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">
          実務・3点セット・占有者・入札ルールの基礎知識
        </span>
      </div>

      {/* Accordion List */}
      <div className="mt-6 space-y-3">
        {HOMEPAGE_FAQS.map((faq, index) => (
          <details
            key={faq.id}
            open={index === 0}
            className="group rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-zinc-700"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer select-none list-none text-slate-900 dark:text-slate-100 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3 pr-2">
                <span className="shrink-0 w-6 h-6 rounded bg-blue-50 dark:bg-blue-950/70 text-[#1B4F8A] dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                  Q
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  {faq.question}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
            </summary>

            <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100/80 dark:border-zinc-800/80">
              <div className="flex items-start gap-3 pt-3">
                <span className="shrink-0 w-6 h-6 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center mt-0.5">
                  A
                </span>
                <div className="flex-1 space-y-2.5">
                  <p>{faq.answer}</p>
                  {faq.relatedLink && (
                    <div className="pt-1">
                      {/* Deep knowledge article link under /blogs/ */}
                      <Link
                        href={faq.relatedLink.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline"
                      >
                        <span>{faq.relatedLink.text}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
