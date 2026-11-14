import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowRight, Sparkles, AlertTriangle, Building2 } from 'lucide-react';
import LanguageBanner from '@/components/LanguageBanner';

export const metadata: Metadata = {
  title: 'Bản Đồ Phân Tích Khu Vực (Rủi ro & Quy Hoạch) | Keibai Finder',
  description: 'Tích hợp dữ liệu siêu tốc từ Bộ Quốc Thổ Nhật Bản. Phân tích diện tích xây dựng (建蔽率), quy mô sàn (容積率) và cảnh báo lũ lụt chỉ với một cú click chuột.',
  alternates: {
    languages: {
      'ja': '/features/area-map',
      'en': '/en/features/area-map',
      'vi': '/vi/features/area-map',
      'zh': '/zh/features/area-map'
    }
  }
};

export default function AreaMapFeatureLandingPageVI() {
  return (
    <div className="min-h-[100dvh] bg-white dark:bg-zinc-950 font-sans pb-20">
      <LanguageBanner />
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-rose-50/50 dark:from-rose-950/20 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-sm font-semibold mb-6 shadow-sm border border-rose-100 dark:border-rose-800/50">
          <Sparkles className="w-4 h-4" /> Loại Bỏ Rủi Ro Mua Lầm Đất
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          Vạch Trần "Cạm Bẫy Ẩn"<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500 dark:from-rose-400 dark:to-orange-300">Của Bất Động Sản Trong 1 Nốt Nhạc.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mx-auto font-medium">
          Xem ngay Bản đồ Rủi ro Thiên tai (Lũ lụt, Sạt lở, Sóng thần) và Thông tin Quy hoạch (Phân vùng, Mật độ xây dựng) trước khi đặt cọc. Keibai Finder liên kết trực tiếp với dữ liệu Chính phủ.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/area-map"
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-rose-600 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Layers className="w-5 h-5" /> Sử Dụng Bản Đồ Miễn Phí
          </Link>
        </div>
      </section>

      {/* 2. Feature 1: Hazard Map */}
      <section className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                Bản đồ Cảnh Báo Thiên Tai Chuẩn Quốc Gia (GSI)
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Được tích hợp trực tiếp từ cổng Disaportal của Cục Thông tin Không gian Địa lý Nhật Bản. Quên việc phải truy cập các trang web chính phủ khó hiểu phức tạp đi. Mọi thứ được đổ lên hệ thống của chúng tôi chỉ dưới dạng một lớp màu siêu nhẹ!
              </p>
              <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  Giám sát 4 lớp rủi ro: Lũ lụt sông xung quanh, Sạt lở núi, Sóng thần và Triều cường.
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-1 bg-green-100 dark:bg-green-900/40 p-1 rounded-full"><ArrowRight className="w-3 h-3 text-green-600 dark:text-green-400" /></div>
                  Hệ thống AI tự động đo khoảng cách đến nơi tránh trú an toàn gần nhất và quy đổi ra số phút đi bộ thực tế.
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8 flex flex-col gap-4">
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-red-700 dark:text-red-400">
                    <span className="text-lg">🌊</span> Rủi Ro Ngập Lụt
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Mức độ ngập dự kiến: Dưới 3.0m</div>
               </div>
               <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-orange-700 dark:text-orange-400">
                    <span className="text-lg">⛰️</span> Sạt lở đất (Đai Sơn)
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Khu vực cảnh báo (Yellow Zone)</div>
               </div>
               <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="text-lg">🏕</span> Nơi trú ẩn khẩn cấp
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-bold">Trường Tiểu học ABC (Khoảng 6 phút)</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature 2: Zoning & Urban Planning */}
      <section className="py-16 sm:py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center flex-col-reverse lg:flex-row-reverse">
            
            <div className="order-2 lg:order-1 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4 mb-4">
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" /> Dữ Liệu Quy Hoạch
                </h3>
              </div>
              <div className="space-y-6">
                 <div>
                   <p className="text-sm text-zinc-500 mb-1">Mục Đích Sử Dụng Đất</p>
                   <p className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                     Khu Dân Cư Loại 1
                   </p>
                 </div>
                 <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-zinc-500">Mật Độ Xây Dựng (建蔽率)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">60%</p>
                   </div>
                   <div>
                     <p className="text-sm font-medium text-zinc-500">Hệ số sử dụng đất (容積率)</p>
                     <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">200%</p>
                   </div>
                 </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
                 <span>💡 Lời khuyên đầu tư: Với tỷ lệ này, hoàn toàn có tiềm năng đập đi xây dựng lại thành một tòa chung cư mini để cho thuê.</span>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                Kiểm Tra Giới Hạn Xây Dựng Chuẩn Xác Tới Từng Mét Đất.
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Giá trị thực sự của một mảnh đất được quyết định bởi việc bạn có thể xây nhà lớn tới đâu. Nhưng việc tự đi đào bới đống giấy tờ tại Tòa thị chính thật sự hao tổn thời gian.
              </p>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Với Tab "Quy Hoạch" của Keibai Finder, bạn chỉ cần chấm vào 1 mảnh đất trên Bản Đồ. Thuật toán của chúng tôi sẽ gọi trực tiếp sang Server của Bộ Môi trường Đất Đai (MLIT) để đem về chính xác 3 chỉ số tối quan trọng: Tên Loại Đất, Tỷ lệ diện tích xây (Coverage) và Tỷ lệ Khối lượng sàn (FAR). Đặc biệt, khu vực đó sẽ sáng màu nổi bật đầy sang trọng!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
