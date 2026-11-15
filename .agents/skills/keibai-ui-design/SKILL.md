---
name: keibai-ui-design
description: >-
  Chuẩn mực thiết kế giao diện (UI/UX Design System) cho các nền tảng Bất Động Sản, 
  Đấu giá nhà đất (Keibai/Koubai) và ứng dụng bản đồ tương tác chuẩn phong cách Nhật Bản. 
  Sử dụng khi thiết kế, audit, refactor giao diện web BĐS, bản đồ Leaflet, card tài sản, 
  và tối ưu trải nghiệm Mobile-First.
---

# 🎨 Keibai UI/UX Design System & Standards

Bộ quy chuẩn thiết kế giao diện độc quyền cho nền tảng BĐS Đấu giá Nhật Bản (Keibai Finder). Đảm bảo tính thẩm mỹ cao cấp (WOW factor), tối ưu hiển thị Mobile-first và độ tin cậy tuyệt đối theo văn hoá người dùng Nhật Bản.

---

## 1. 🇯🇵 Phong cách Thiết kế Nhật Bản (Modern Japanese Aesthetics)

- **Airy & Compact (Thoáng đãng nhưng cô đọng):**
  - Tránh các khối màu sặc sỡ không cần thiết. Sử dụng bảng màu tối giản: Trắng (`#ffffff`), Xám kim loại (`zinc-50` đến `zinc-900`), Xanh thương hiệu (`blue-600`), Cam cảnh báo (`orange-500` / `amber-500`), Đỏ đấu thầu NTA (`rose-600`).
  - Font chữ ưu tiên font hình học sạch: `Geist`, `Inter`, `Noto Sans JP`, kết hợp `text-justify: inter-character` cho nội dung đọc dài.
- **Văn phong & Thuật ngữ UI 100% tiếng Nhật (Keigo):**
  - Tuyệt đối không dùng tiếng Anh/Việt trên UI chính.
  - Giá khởi điểm: `売却基準価額` (hoặc `開始価格` đối với NTA).
  - Giá trị thị trường ước tính: `推定市場価格`.
  - Tỷ suất sinh lời dự kiến: `予想利回り` (kèm tooltip công thức tính minh bạch).
  - Thông báo tải: `地図を読み込み中...`, `物件データを取得中...`.
  - Ghi chú pháp lý: `※農地法第3条の許可が必要です`, `正確な情報については必ず原本（3点セット等）をご確認ください。`.

---

## 2. 📱 Kiến trúc Layout Mobile-First & Bản đồ (Map/List Decoupling)

- **Layout Phân mảnh Linh hoạt (Decoupled Layout):**
  - **Desktop:** Chia đôi màn hình (Split screen) với danh sách cuộn mượt bên trái (40-50% width) và bản đồ tương tác cố định bên phải (50-60% width).
  - **Mobile:** Sử dụng `flex-col` hoặc `flex-col-reverse` linh hoạt. Tích hợp nút Floating Action Button (FAB) `[🗺️ 地図を表示 / 📋 リストを表示]` để chuyển đổi không gian mà không làm tải lại trang.
- **Chống chặn Zoom di động (A11y Compliance):**
  - Trong `layout.tsx`, thuộc tính `viewport` tuyệt đối **KHÔNG** đặt `userScalable: false` hoặc `maximumScale: 1`. Cho phép người dùng phóng to thu nhỏ tự do theo chuẩn Lighthouse Accessibility.

---

## 3. 🗺️ Quy chuẩn Bản đồ Tương tác Leaflet

- **Bản đồ nền sáng (Light Basemap):**
  - Sử dụng CartoDB Positron (`light_all`) hoặc GSI Pale Tile (`cyberjapandata.gsi.go.jp/xyz/pale`) để tạo cảm giác sạch sẽ, hiện đại.
- **Tập hợp Marker (Clustering) & Chân nhện (Spiderfy):**
  - Dùng `react-leaflet-cluster` với `disableClusteringAtZoom={18}` để các tài sản cùng địa chỉ (như toà nhà chung cư nhiều căn hộ) tự động xoè chân nhện (`spiderfy`) khi zoom tối đa.
- **Đồng bộ Hai chiều (Two-Way Hover/Click Sync):**
  - Hover Card -> Phóng to Marker tương ứng (`scale-125`), đẩy `zIndex` lên 1000.
  - Click Marker -> Bản đồ Pan tới trung tâm, Sidebar tự động cuộn mượt (`scrollIntoView({ behavior: 'smooth' })`) tới thẻ tài sản.
- **Độc lập CDN (Zero External Dependency):**
  - Marker Icons phải lưu trực tiếp trong `/public/leaflet/` (`marker-icon.png`, `marker-shadow.png`), không gọi từ `unpkg.com` để tránh lỗi mất icon khi mạng chậm.

---

## 4. 🏷️ Quy chuẩn Hiển thị Thẻ Bất Động Sản (PropertyCard)

- **Đơn vị Tiền tệ:** Luôn tính theo **Vạn Yên (万円)** hoặc Yên có dấu phẩy ngăn cách hàng nghìn (`¥12,500,000`).
- **Thời gian đi bộ tới Ga Tàu (Chuẩn 80m/phút):**
  - Tính toán bằng công thức Haversine nội bộ kết hợp hệ số uốn lượn: `Khoảng cách * 1.25 / 80`.
  - Hiển thị badge: `🚉 JR山手線 / 渋谷駅 徒歩8分` (màu xanh lá thân thiện).
  - Nếu khoảng cách > 5km, tự động đổi nhãn phương tiện sang `🚗 車XX分`.
- **Thẻ Đếm ngược Thời gian (Countdown Badges):**
  - Sử dụng `dayjs.utc(date)` để fix cứng mốc múi giờ Nhật Bản `Asia/Tokyo (+09:00)`, không dùng giờ local của máy khách tránh sai lệch ngày đấu thầu.
  - Cảnh báo sát hạn: `あと3日` (nền đỏ/cam nổi bật khi còn <= 3 ngày).

---

## 5. 🧩 Nguyên tắc Tách nhỏ Component (Component Isolation)

- Khi một file UI vượt quá **500 dòng code** (như `SearchBar.tsx`), bắt buộc phải module hoá thành các sub-components:
  - `PriceRangeFilter.tsx`
  - `StationSelectModal.tsx`
  - `AuthorityDropdown.tsx`
  - `HazardLayerToggle.tsx`
- Đảm bảo mỗi Component chỉ chịu trách nhiệm duy nhất (Single Responsibility) và truyền state qua props hoặc lightweight context.

---

## 6. 📐 Quy Chuẩn Chiều Rộng Màn Hình PC (1280px `max-w-7xl`) & Bố Cục Thống Nhất Lấy Trang `/auction-results` Làm Chuẩn

Để loại bỏ hoàn toàn tình trạng **"trang thì rộng thênh thang, trang thì co rúm hẹp lại"** làm mất tính nhất quán và giảm độ uy tín B2B của dự án, toàn bộ hệ thống giao diện Keibai Finder lấy trang **`/auction-results` (全国競売・公売 落札結果データベース)** làm **GIAO DIỆN MẪU CHUẨN MỰC (Gold Standard Reference)**.

### 6.1. Tỷ lệ & Chiều rộng khung hình chuẩn trên PC:
- **Chiều rộng tối đa (Max Width Container):** Bắt buộc sử dụng class **`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`** (chuẩn **1280px** trên PC).
- **CẤM TUYỆT ĐỐI:** Không sử dụng các container hẹp như `max-w-3xl` (768px), `max-w-4xl` (896px), `max-w-5xl` (1024px) hay `max-w-6xl` (1152px) cho các trang danh sách, thư viện, kết quả tìm kiếm, công cụ tra cứu.
- **Ngoại lệ duy nhất:** Trang bản đồ tương tác Leaflet toàn màn hình (`/map` split-screen full bleed).

### 6.2. Cấu trúc Khung Giao Diện Chuẩn 3 Tầng (Standard 3-Tier Layout):
Mọi trang nghiệp vụ phải tuân thủ đúng khung bố cục sau:

```tsx
<div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
  
  {/* TẦNG 1: HEADER BANNER NỀN TRẮNG ĐỒNG BỘ 1280px */}
  <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* 1.1 Breadcrumbs vi mô */}
      <nav className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        <Link href="/" className="hover:text-[#1B4F8A]">ホーム</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-800 dark:text-slate-200">[Tên Trang]</span>
      </nav>

      {/* 1.2 Tiêu đề & Diễn giải */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        [Tiêu đề trang chuẩn B2B Nhật Bản]
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
        [Đoạn văn bản diễn giải mục đích công năng của trang, tối đa 3 dòng]
      </p>

      {/* 1.3 Quick Aggregate KPI Stats Bar (Nếu có dữ liệu tổng hợp) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded border border-slate-200/80 dark:border-zinc-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Chỉ số 1</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">4,156 件</span>
        </div>
        ...
      </div>
    </div>
  </header>

  {/* TẦNG 2: THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
  <main className="max-w-7xl mx-auto px-4 mt-6">
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 mb-6">
      {/* Search Bar / Filter Toolbar */}
    </div>

    {/* TẦNG 3: LƯỚI / BẢNG DỮ LIỆU CHÍNH */}
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
      {/* Content Table / Cards Grid */}
    </div>
  </main>
</div>
```

### 6.3. Bảng Màu Nền & Thẻ Chuẩn (Visual Harmony Standard):
- **Màu nền toàn trang:** `#F8FAFC` (chuẩn `bg-slate-50`), Chế độ tối: `dark:bg-zinc-950`.
- **Màu nền Khối Header & Card:** `#FFFFFF` (chuẩn `bg-white`), Chế độ tối: `dark:bg-zinc-900`.
- **Đường viền phân tách:** `border-slate-200 dark:border-zinc-800` (mảnh 1px, dứt khoát, không bóng đổ rực rỡ).
- **Màu nhấn thương hiệu:** Kachi-iro `#1B4F8A` (Deep Indigo Navy) cho link hover, số liệu quan trọng, active tab.
- **Thẻ KPI nhỏ:** `bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800 rounded p-3`.
- **Typography:** Số liệu bắt buộc có `tabular-nums font-mono`.

### 6.4. Danh Sách Các Trang Bắt Buộc Chuẩn Hóa Chiều Rộng Về `max-w-7xl`:
Mọi tác vụ refactor giao diện trong dự án phải kiểm tra và đưa các trang sau về đúng chuẩn `max-w-7xl`:
1. `http://localhost:3000/blogs` (Trang danh sách bài viết)
2. `http://localhost:3000/` (Trang chủ - Toàn bộ các section nội dung, trừ full-bleed map)
3. `http://localhost:3000/search/area` (Trang tìm kiếm theo khu vực)
4. `http://localhost:3000/search/station` (Trang tìm kiếm theo tuyến ga)
5. `http://localhost:3000/extension` (Landing page tiện ích Keibai Lens)
6. `http://localhost:3000/trade-find` (Trang tra cứu giá giao dịch thực tế)
7. `http://localhost:3000/market-insights` (Trang bảng phân tích thị trường)
8. `http://localhost:3000/area-map` (Trang bản đồ phân tích khu vực)
