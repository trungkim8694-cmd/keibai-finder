import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Map, ArrowRight, TrendingUp, Sparkles, MapPin, Calculator, MousePointer2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tìm Nhà Đấu Giá ở Nhật Bản trên Bản Đồ. AI định giá thực tế.',
  description: 'Tra cứu BDS đấu giá và công khố Nhật Bản trực quan trên bản đồ & Phân tích cơ hội đầu tư qua AI.',
  alternates: {
    languages: {
      'ja': '/features/map-search',
      'en': '/en/features/map-search',
      'vi': '/vi/features/map-search',
      'zh': '/zh/features/map-search'
    }
  }
};

export default function MapFeatureLandingPageVI() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50/50 dark:from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-300 text-sm font-semibold mb-6 shadow-sm border border-blue-100 dark:border-indigo-800/50">
          <Sparkles className="w-4 h-4" /> Kỷ nguyên đấu giá kiểu mới
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Tìm Nhà theo Bản Đồ.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">AI định giá đúng thực tế.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Dễ dàng tìm thấy các suất bất động sản phát mãi ở Nhật Bản qua bản đồ giống như Google Maps. Tiết lộ giá trị sinh lời thực tế nhờ công nghệ AI.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Map className="w-5 h-5" /> Tìm bản đồ ngay
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                Trực quan hóa tài sản Nhật Bản
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Đọc danh sách text cũ làm bạn khó hình dung môi trường sống. Tính năng Tìm qua Bản Đồ hiển thị các khu nhà đấu giá dưới dạng Ghim, giúp đánh giá nhanh khoảng cách đến Ga và tiện ích.
              </p>
            </div>
            <Link href="/" className="relative rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 overflow-hidden aspect-video group block cursor-pointer">
              <div className="absolute inset-0 bg-blue-100/50 dark:bg-indigo-900/20 backdrop-blur-[2px] flex items-center justify-center group-hover:opacity-0 transition-opacity z-10 duration-500">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  <MousePointer2 className="w-4 h-4 animate-bounce" /> Kéo thả Bản đồ
                </div>
              </div>
              <img src="/keibaikoubai.webp" alt="Keibai-Koubai Map Search" className="w-full h-full object-cover rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-500" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" /> Xác suất đầu tư (Gap)
                  </h3>
                </div>
                <div className="space-y-6">
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">Giá trị thật (dữ liệu chính phủ Nhật)</p>
                     <p className="text-2xl font-black text-zinc-900 dark:text-white">Ước tính 2,850 <span className="text-base font-normal">Man</span></p>
                   </div>
                   <div>
                     <p className="text-sm text-zinc-500 mb-1">Giá đấu giá cơ cở</p>
                     <p className="text-2xl font-black text-blue-600 dark:text-blue-400">1,420 <span className="text-base font-normal">Man</span></p>
                   </div>
                   <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Đánh giá cơ hội</p>
                       <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                         <TrendingUp className="w-4 h-4" /> Lệch +100.7% (Đáng mua)
                       </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                Đánh giá "Giá trị thực" với Dữ liệu chính quy
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                 Thay vì tính nhẩm, công cụ của chúng tôi kéo trực tiếp dữ liệu sàn giao dịch từ Bộ Đất Đai Nhật Bản (MLIT) để phân tích mức độ sinh lời của món hàng Đấu giá. Tối ưu túi tiền của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
