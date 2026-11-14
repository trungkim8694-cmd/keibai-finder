import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Search, TrendingUp, Sparkles, Building2, ShieldCheck, JapaneseYen, ArrowRight, MousePointer2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: 'Định giá nhà đất Nhật Bản | Tra cứu giá giao dịch từ Bộ Đất Đai',
  description: 'Công cụ miễn phí giúp nhà đầu tư tra cứu lịch sử giá bán thực tế của bất động sản tại Nhật Bản. Tránh bị mua hớ, tối ưu hóa lợi nhuận đầu tư bằng dữ liệu chính phủ.',
  alternates: {
    languages: {
      'ja': '/features/trade-price-search',
      'en': '/en/features/trade-price-search',
      'vi': '/vi/features/trade-price-search',
      'zh': '/zh/features/trade-price-search'
    }
  }
};

export default function TradePriceFeatureLandingPageVI() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/70 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> Hệ thống định giá chuyên nghiệp
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Khám phá Giá Trị Thực của <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Bất Động Sản Nhật Bản.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Dừng ngay việc tin tưởng tuyệt đối vào giá bán do Fudosan (Môi giới) báo lại. Chúng tôi dùng dữ liệu lịch sử đóng thuế từ chính phủ Nhật để bạn tự kiểm chứng giá nhà đất chỉ trong 1 giây.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trade-find"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Search className="w-5 h-5" /> Trải nghiệm Miễn phí
          </Link>
        </div>
      </section>

      {/* Feature 1: Problem vs Solution */}
      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                Giá nhà đó có đang bị "Hớ" ?
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Trên các trang rao vặt là giá "rao bán", còn thực tế giao dịch lại là một con số khác. Nếu bạn đầu tư mua nhà bãi (nhà cũ) hoặc đấu giá mà không biết hàng xóm xung quanh đã bán bao nhiêu, bạn rủi ro mất tiền rất lớn.
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ShieldCheck className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>Nền tảng Pháp lý 100%:</strong> Kéo trực tiếp dữ liệu công bố từ Bộ Đất Đai, Hạ Tầng và Giao Thông Nhật Bản (MLIT).</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  <p><strong>Biểu đồ biến động 5 năm:</strong> Dễ dàng nhìn thấy xu hướng giá bất động sản trong khu vực bạn sắp mua đang tăng hay giảm.</p>
                </li>
              </ul>
            </div>
            
            <Link href="/trade-find" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/30 dark:bg-indigo-900/20 backdrop-blur-[1px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> Click để dùng phần mềm
                </div>
              </div>
              <img src="/trade-price-search.webp" alt="Trade Price Search UI" className="w-full h-full object-cover rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
             <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-10 border border-indigo-100 dark:border-indigo-800/30">
               <JapaneseYen className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
               <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-4">La bàn không thể thiếu của Nhà đầu tư</h2>
               <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
                 Tính toán được "Biên Độ Lợi Nhuận" (Capital Gain) chính xác trước khi ra quyết định xuống tiền mua căn nhà.
               </p>
               <Link
                 href="/trade-find"
                 className="inline-flex justify-center items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3.5 text-base font-bold shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105"
               >
                 Tra giá nhà đất ngay <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
      </section>
    </div>
  );
}
