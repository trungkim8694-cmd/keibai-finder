'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  MapPin,
  Train,
  TrendingUp,
  ShieldCheck,
  FileText,
  Layers,
  Globe,
  ExternalLink,
  Flame
} from 'lucide-react';

export default function GlobalFooter() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer completely on full-screen interactive maps to preserve full-bleed view
  if (pathname === '/map' || pathname?.startsWith('/area-map')) {
    return null;
  }

  return (
    <footer className="w-full bg-slate-50 text-slate-600 border-t border-slate-200 text-xs mt-auto">
      {/* 1. TOP SEO SILO MATRIX: PREFECTURES & PROPERTY TYPES */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Major Prefectures Links */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>主要エリアの競売・公売物件一覧</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
                {[
                  { name: '東京都', href: '/search/area/%E6%9D%B1%E4%BA%AC%E9%83%BD' },
                  { name: '神奈川県', href: '/search/area/%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C' },
                  { name: '埼玉県', href: '/search/area/%E5%9F%BC%E7%8E%89%E7%9C%8C' },
                  { name: '千葉県', href: '/search/area/%E5%8D%83%E8%91%89%E7%9C%8C' },
                  { name: '大阪府', href: '/search/area/%E5%A4%A7%E9%98%AA%E5%BA%9C' },
                  { name: '兵庫県', href: '/search/area/%E5%85%B5%E5%BA%AB%E7%9C%8C' },
                  { name: '京都府', href: '/search/area/%E4%BA%AC%E9%83%BD%E5%BA%9C' },
                  { name: '愛知県', href: '/search/area/%E6%84%9B%E7%9F%A5%E7%9C%8C' },
                  { name: '福岡県', href: '/search/area/%E7%A6%8F%E5%B2%A1%E7%9C%8C' },
                  { name: '北海道', href: '/search/area/%E5%8C%97%E6%B5%B7%E9%81%93' },
                  { name: '宮城県', href: '/search/area/%E5%AE%AE%E5%9F%8E%E7%9C%8C' },
                  { name: '広島県', href: '/search/area/%E5%BA%83%E5%B3%B6%E7%9C%8C' },
                  { name: '静岡県', href: '/search/area/%E9%9D%99%E5%B2%A1%E7%9C%8C' },
                  { name: '茨城県', href: '/search/area/%E8%8C%A8%E5%9F%8E%E7%9C%8C' },
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="hover:text-blue-700 hover:underline transition-colors"
                  >
                    {item.name}の競売物件
                  </Link>
                ))}
                <Link href="/search/area" className="text-blue-600 font-medium hover:underline">
                  すべての都道府県を見る →
                </Link>
              </div>
            </div>

            {/* Property Types & Investment Signals Links */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>物件種別・こだわり条件から探す</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
                <Link href="/map?types[]=%E6%88%B8%E5%BB%BA%E3%81%A6" className="hover:text-blue-700 hover:underline transition-colors">
                  一戸建て競売物件
                </Link>
                <Link href="/map?types[]=%E3%83%9E%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%B3" className="hover:text-blue-700 hover:underline transition-colors">
                  マンション競売物件
                </Link>
                <Link href="/map?types[]=%E5%9C%9F%E5%9C%B0" className="hover:text-blue-700 hover:underline transition-colors">
                  土地・宅地競売物件
                </Link>
                <Link href="/map?types[]=%E8%BE%B2%E5%9C%B0" className="hover:text-blue-700 hover:underline transition-colors">
                  農地公売物件
                </Link>
                <Link href="/map?maxPrice=3000000" className="hover:text-blue-700 hover:underline transition-colors">
                  300万円以下の格安物件
                </Link>
                <Link href="/map?maxPrice=5000000" className="hover:text-blue-700 hover:underline transition-colors">
                  500万円以下物件
                </Link>
                <Link href="/map?maxPrice=10000000" className="hover:text-blue-700 hover:underline transition-colors">
                  1,000万円以下物件
                </Link>
                <Link href="/map?minGap=30" className="hover:text-blue-700 hover:underline transition-colors">
                  市場価格比+30%超 割安物件
                </Link>
                <Link href="/map?provider=NTA" className="hover:text-blue-700 hover:underline transition-colors">
                  国税庁公売物件
                </Link>
                <Link href="/map?provider=BIT" className="hover:text-blue-700 hover:underline transition-colors">
                  地方裁判所競売物件
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4-COLUMN B2B SITEMAP DIRECTORY */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1: Search Features */}
          <div>
            <h3 className="text-slate-800 font-semibold text-xs tracking-wider uppercase mb-3.5">
              物件を探す
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li>
                <Link href="/" className="hover:text-blue-700 hover:underline transition-colors">
                  ホーム (Portal Hub)
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-blue-700 hover:underline transition-colors">
                  全国物件マップ検索
                </Link>
              </li>
              <li>
                <Link href="/search/area" className="hover:text-blue-700 hover:underline transition-colors">
                  地域・都道府県から探す
                </Link>
              </li>
              <li>
                <Link href="/search/station" className="hover:text-blue-700 hover:underline transition-colors">
                  沿線・駅から探す
                </Link>
              </li>
              <li>
                <Link href="/auction-results" className="hover:text-blue-700 hover:underline transition-colors">
                  全国落札結果データベース
                </Link>
              </li>
              <li>
                <Link href="/auction/schedule" className="hover:text-blue-700 hover:underline transition-colors flex items-center gap-1 font-semibold text-[#1B4F8A]">
                  <span>売却スケジュールカレンダー</span>
                  <span className="text-[9px] px-1 rounded bg-blue-100 text-[#1B4F8A] font-bold">NEW</span>
                </Link>
              </li>
              <li>
                <Link href="/agencies" className="hover:text-blue-700 hover:underline transition-colors">
                  全国不動産会社データベース
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Market Analysis & Tools */}
          <div>
            <h3 className="text-slate-800 font-semibold text-xs tracking-wider uppercase mb-3.5">
              相場・分析ツール
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li>
                <Link href="/features/keyword-trends" className="hover:text-blue-700 hover:underline transition-colors flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                  <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>検索需要トレンド分析</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200/60 font-bold">AI</span>
                </Link>
              </li>
              <li>
                <Link href="/market-insights" className="hover:text-blue-700 hover:underline transition-colors">
                  市場分析ダッシュボード
                </Link>
              </li>
              <li>
                <Link href="/trade-find" className="hover:text-blue-700 hover:underline transition-colors">
                  不動産取引価格検索 (MLIT)
                </Link>
              </li>
              <li>
                <Link href="/area-map" className="hover:text-blue-700 hover:underline transition-colors">
                  エリア分析マップ (災害・用途地域)
                </Link>
              </li>
              <li>
                <Link href="/extension" className="hover:text-blue-700 hover:underline transition-colors">
                  Keibai Lens Chrome拡張機能
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-700 hover:underline transition-colors">
                  機能一覧・活用ガイド
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Knowledge */}
          <div>
            <h3 className="text-slate-800 font-semibold text-xs tracking-wider uppercase mb-3.5">
              ナレッジ & サポート
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li>
                <Link href="/agencies" className="hover:text-blue-700 hover:underline transition-colors">
                  全国の不動産会社を探す（宅建DB）
                </Link>
              </li>
              <li>
                <Link href="/insights" className="hover:text-blue-700 hover:underline transition-colors">
                  本日の注目物件レポート
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-blue-700 hover:underline transition-colors">
                  競売・公売ナレッジ & コラム
                </Link>
              </li>
              <li>
                <Link href="/features/trade-price-search" className="hover:text-blue-700 hover:underline transition-colors">
                  価格査定の仕組み
                </Link>
              </li>
              <li>
                <Link href="/features/map-search" className="hover:text-blue-700 hover:underline transition-colors">
                  地図検索の使い方
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporate & Legal */}
          <div>
            <h3 className="text-slate-800 font-semibold text-xs tracking-wider uppercase mb-3.5">
              企業・運営情報
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-600">
              <li>
                <Link href="/company" className="hover:text-blue-700 hover:underline transition-colors">
                  運営会社概要 (Company)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-700 hover:underline transition-colors">
                  お問い合わせ (Contact)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-700 hover:underline transition-colors">
                  利用規約 (Terms of Service)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-700 hover:underline transition-colors">
                  プライバシーポリシー (Privacy)
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. CORPORATE E-E-A-T INFORMATION BLOCK */}
      <div className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
            <p className="text-slate-900 font-bold text-xs">
              TQC株式会社 (TQC Corporation)
            </p>
            <p>所在地: 〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F</p>
            <p>代表連絡先: TEL (03) 6907-1219 / FAX (03) 6701-2399</p>
            <p>お問い合わせ: <Link href="/contact" className="text-blue-600 font-medium hover:underline">お問い合わせフォーム</Link>（<a href="mailto:info@keibai-koubai.com" className="text-blue-600 hover:underline">info@keibai-koubai.com</a>）</p>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1.5 max-w-md">
            <p className="text-slate-800 font-semibold text-[11px]">データ出典・免責事項</p>
            <p className="leading-relaxed">
              本サイトの公示情報は最高裁判所競売物件情報サイト（BIT）、国税庁公売情報、および国土交通省不動産情報ライブラリ（MLIT API）のオープンデータを正規に集約・分析したものです。入札参加にあたっては各管轄裁判所・行政機関の公式資料をご確認ください。
            </p>
          </div>
        </div>
      </div>

      {/* 4. COPYRIGHT BAR */}
      <div className="border-t border-slate-200 bg-slate-100 py-4 px-4 text-center text-[11px] text-slate-500">
        <p>© {currentYear} TQC Corporation / Keibai-Koubai Finder. All rights reserved.</p>
      </div>
    </footer>
  );
}
