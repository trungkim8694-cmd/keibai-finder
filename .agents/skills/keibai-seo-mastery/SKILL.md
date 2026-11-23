---
name: keibai-seo-mastery
description: >-
  Chuẩn mực tối ưu hoá công cụ tìm kiếm (Technical SEO Mastery, Programmatic SEO & GEO) chuyên sâu 
  cho ngành Bất Động Sản, Đấu giá Nhật Bản (Keibai/Koubai) và kiến trúc Next.js 15 App Router. 
  Sử dụng khi thực hiện Technical SEO Audit, cấu hình Schema.org JSON-LD (google/schema-dts), 
  Programmatic Landing Pages, tối ưu Core Web Vitals (Leaflet Map/LCP/INP/CLS), Sitemap động, 
  AI Search Readiness (llms.txt / GEO) và cấu trúc Internal Link Silos.
---

# 🚀 Keibai Technical SEO Mastery, Programmatic SEO & GEO Standards

Bộ quy chuẩn Technical SEO tối cao của **Keibai Finder (`https://www.keibai-koubai.com`)**, được chắt lọc và hợp nhất từ 5 kho mã nguồn mở hàng đầu trên GitHub dành cho Next.js 15 & AI Agents:
1. **`laguagu/claude-code-nextjs-skills` (`nextjs-seo`)**: Quy chuẩn Metadata API Next.js 15+, tách biệt `Viewport`, chiến lược Render (SSR/ISR/RSC Boundaries), ngăn chặn lỗi phần tử Client làm mất SSR và tối ưu Core Web Vitals.
2. **`google/schema-dts`**: Hệ thống định kiểu dữ liệu cấu trúc Type-safe JSON-LD (`@graph` liên kết `WebSite` + `Organization` + `RealEstateListing` + `Residence`/`SingleFamilyResidence`/`Apartment` + `Offer` + `Place` + `ItemList` + `BreadcrumbList`) kèm cơ chế chống XSS (`\u003c`).
3. **`AgriciDaniel/claude-seo`**: Kiến trúc kiểm toán Technical SEO đa tầng, Dynamic CTR-Magnet Title, tối ưu Crawl Budget và khả năng hiển thị trên AI Search (GEO).
4. **`seo-skills/seo-audit-skill` (SEOmator)**: Bộ quy tắc kiểm toán 373 tiêu chuẩn kỹ thuật: đối chiếu Raw SSR HTML vs. Rendered DOM, kiểm soát `llms.txt`, HTTP/HTTPS Canonicalization và phân tích điểm nghẽn LCP/INP/CLS trên ứng dụng bản đồ.
5. **`coreyhaines31/marketingskills`**: Chiến lược Programmatic SEO (pSEO) quy mô lớn, bộ lọc Thin Content / Soft-404 Guard và mô hình liên kết nội bộ Hub & Spoke.

---

## 1. 🏗️ Kiến Trúc Next.js 15 App Router & Metadata API (`laguagu/claude-code-nextjs-skills`)

### 1.1. Quy tắc `metadataBase`, `title.template` & Chống Trùng Lặp Hậu Tố
- Tại `app/layout.tsx`:
  - Khai báo `metadataBase: new URL('https://www.keibai-koubai.com')` và `Viewport` tách rời.
  - Khi `layout.tsx` đã khai báo `title.template: "%s｜Keibai Finder"`, các trang con (`page.tsx`) **KHÔNG ĐƯỢC** tự nối thêm hậu tố `｜Keibai Finder` vào chuỗi `title` tĩnh (tránh lỗi Google render thành `...｜Keibai Finder｜Keibai Finder`). Hoặc trang chủ (`app/page.tsx`) phải dùng `title: { absolute: '...' }` nếu muốn ghi đè hoàn toàn template.
- **Canonical Tự Thân (Self-Referencing Canonical):**
  - Mọi `page.tsx` bắt buộc phải khai báo `alternates.canonical` riêng biệt của chính trang đó. Tuyệt đối không để trang con kế thừa nhầm `canonical: '/'` từ `RootLayout`!

### 1.2. RSC Boundaries & SSR Payload Guard (Đặc thù BĐS có Bản đồ Leaflet)
- **Tách biệt Server Component (`page.tsx`) và Client Component (`'use client'`):**
  - Toàn bộ nội dung SEO cốt lõi (Thẻ `<h1>`, `<h2>`, số liệu thống kê thị trường, danh sách `PropertyCard`, liên kết 47 tỉnh thành, tuyến tàu và khối `<script type="application/ld+json">`) **BẮT BUỘC** được render từ Server Component trong Raw HTML đầu tiên.
  - Các thành phần tương tác nặng như bản đồ Leaflet (`HomeMapPreview`, `KeibaiMapInner`) phải được bọc `next/dynamic(..., { ssr: false })` kèm khung giữ chỗ có kích thước cố định (`aspect-ratio` hoặc `h-[420px]`) để **CLS = 0**.
- **Chống Phình To RSC Payload (Anti-RSC-Bloat):**
  - Tuyệt đối **KHÔNG** truy vấn toàn bộ hàng nghìn bản ghi tọa độ (`prisma.property.findMany` không có `take` limit) rồi truyền thẳng vào Client Component trên trang chủ `/` hoặc các trang Hub. Điều này làm phình kích thước HTML/RSC payload (`__NEXT_DATA__` / RSC chunks), tăng TTFB và làm giảm tốc độ cào của Googlebot.
  - **Giải pháp chuẩn:** Giới hạn `take: 200`–`500` tài sản tiêu biểu cho bản đồ xem trước trên `/`, hoặc tải dữ liệu pin bản đồ bất đồng bộ qua API có cache khi người dùng tương tác.

---

## 2. 📑 Chuẩn Hóa Schema.org JSON-LD Đa Tầng (`google/schema-dts` & `AgriciDaniel/claude-seo`)

### 2.1. Quy tắc An Toàn & Kết Nối Thực Thể (`@graph` + `@id`)
- Luôn dùng `.replace(/</g, '\\u003c')` khi `JSON.stringify` vào `dangerouslySetInnerHTML`.
- Mọi thực thể trên các trang phải nối kết về `@id: "https://www.keibai-koubai.com/#organization"` và `@id: "https://www.keibai-koubai.com/#website"`.
- **Chỉ khai báo dữ liệu có thật và hiển thị trên trang** (Zero-Fake Schema): Không tự bịa `AggregateRating` nếu trang không hiển thị đánh giá thật.

### 2.2. Bản Đồ Schema Bắt Buộc Theo Từng Loại Trang

1. **Trang Chủ (`/` - Portal Root):**
   - `WebSite` (kèm `SearchAction` trỏ đúng route tìm kiếm thực tế của hệ thống).
   - `Organization` (kèm `name`, `url`, `logo` chuẩn kích thước, `description`, `knowsAbout`: `["不動産競売", "公売物件", "BIT不動産競売物件情報", "国土交通省不動産取引価格情報"]`).
   - `WebPage` / `CollectionPage` + `ItemList` (liệt kê 12 bất động sản đấu giá mới nhất đang hiển thị trên trang chủ với đường dẫn tuyệt đối `/property/[id]`, giá khởi điểm `JPY` và địa chỉ).
   - `Dataset` (mô tả cơ sở dữ liệu tổng hợp đấu giá BIT Tòa án & Công bán Quốc세청 kết hợp dữ liệu giá giao dịch MLIT).

2. **Trang Chi Tiết Tài Sản (`/property/[id]`):**
   - Tổ hợp chuẩn `google/schema-dts`: `RealEstateListing` + `itemOffered` (`SingleFamilyResidence` / `Apartment` / `Residence` / `Landform`) + `offers` (`Offer` với `price`, `priceCurrency: "JPY"`, `availability`, `validThrough: bid_end_date`) + `geo` (`GeoCoordinates`) + `address` (`PostalAddress` chuẩn Nhật Bản: `addressRegion`, `addressLocality`, `streetAddress`, `addressCountry: "JP"`).
   - `BreadcrumbList` 4 cấp: `ホーム` ➔ `[都道府県]` ➔ `[市区町村]` ➔ `[物件名]`.

3. **Trang Danh Mục Programmatic (`/search/area/...`, `/search/station/...`):**
   - `CollectionPage` + `ItemList` (danh sách BĐS trong khu vực/nhà ga) + `BreadcrumbList`.

4. **Trang Bài Viết & Phân Tích (`/blogs/[slug]`, `/insights/[slug]`):**
   - `Article` / `AnalysisNewsArticle` + `BreadcrumbList` kèm `datePublished`, `dateModified`, `author`, `publisher`.

---

## 3. 🗺️ Programmatic SEO (pSEO) & Thin Content Guard (`coreyhaines31/marketingskills`)

### 3.1. Router SEO Hành Chính & Tuyến Tàu Điện
- **Khu vực hành chính:** `app/search/area/[prefecture]/[city]/page.tsx` (Mục tiêu: `[都道府県][市区町村] 競売物件・公売物件`).
- **Tuyến tàu & Nhà ga:** `app/search/station/[line]/[station]/page.tsx` (Mục tiêu: `[駅名] 競売物件`).

### 3.2. Bộ Lọc Chống Nội Dung Mỏng (Thin Content & Soft-404 Guard)
- Trong `generateMetadata` của mọi trang Programmatic (`area`, `station`, `area-map`), kiểm tra số lượng tài sản thực tế (`count`):
  - Nếu `count === 0`: Bắt buộc trả về `robots: { index: false, follow: true }` để bảo vệ 100% Crawl Budget khỏi lỗi *Soft 404 / Thin Doorway Page*, nhưng vẫn cho bot đi theo các liên kết vùng lân cận (`follow: true`).
  - Nếu `count >= 1`: Trả về `robots: { index: true, follow: true }` kèm **Dynamic CTR-Magnet Title**:
    `【${count}件・最安${minPrice}万円〜】${pref}${city}の競売物件・公売物件一覧`
- **Khối dữ liệu độc bản (Unique Data Block):** Mỗi trang pSEO có dữ liệu phải hiển thị bảng tóm tắt số liệu riêng của khu vực đó (Tổng số tài sản, Giá chuẩn tòa án thấp nhất/trung bình, Độ lệch trung bình so với giá MLIT `%`).

---

## 4. ⚡ Core Web Vitals & Mobile-First Parity (`seo-skills/seo-audit-skill`)

Theo chuẩn Google Search Central ở phân vị thứ 75 (p75):
- **LCP (Largest Contentful Paint) $\le 2.5\text{s}$**:
  - Phần tử Hero trên `/` và ảnh đầu tiên trên `/property/[id]` phải render ngay bằng SSR HTML, sử dụng `priority` / `fetchPriority="high"`, tuyệt đối không chặn bởi JS bundle của Leaflet hoặc Recharts.
- **INP (Interaction to Next Paint) $\le 200\text{ms}$**:
  - Giảm số lượng DOM node đồng thời trên trang chủ; phân tách bộ lọc tìm kiếm (`HomeSmartSearch`) nhẹ nhàng, không chạy vòng lặp nặng trên Main Thread khi gõ phím.
- **CLS (Cumulative Layout Shift) $\le 0.1$**:
  - Tuyệt đối cẩn trọng với `className="h-[100dvh] overflow-hidden"` trên thẻ `<html>` hoặc `<body>` nếu nó ngăn cản Googlebot Mobile Viewport mở rộng trang để lập chỉ mục các phần tử bên dưới màn hình đầu tiên (Below-the-fold).
  - Mọi khung bản đồ (`HomeMapPreview`), biểu đồ và ảnh thẻ BĐS (`PropertyCard`) phải có chiều cao hoặc `aspect-ratio` cố định.

---

## 5. 🤖 AI Search / GEO Readiness & Sitemap Engine (`AgriciDaniel/claude-seo` & `b2b-seo-engine`)

### 5.1. Quản trị `robots.ts` & `llms.txt`
- **Chuẩn `app/robots.ts`:**
  - Phân quyền rõ ràng cho Googlebot và các AI Search Crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `GPTBot`, `Google-Extended`).
  - Chặn triệt để các route nội bộ/tốn tài nguyên: `/api/`, `/dashboard/`, `/admin/`, `/login/`.
  - **Cảnh báo đồng bộ URL:** Nếu `SearchAction` hoặc bộ lọc nội bộ dùng `/search?...` hay `/?keyword=...`, phải đảm bảo `robots.ts` và thẻ `canonical` đồng nhất, không chặn nhầm trang đích chính thức mà mình đang khai báo trong Schema.
- **Chuẩn `public/llms.txt` (Generative Engine Optimization):**
  - Cung cấp tệp `/llms.txt` chuẩn Markdown tóm tắt cấu trúc dữ liệu của `keibai-koubai.com` (47 tỉnh thành, hệ thống tra cứu giá MLIT, lịch mở thầu BIT, kết quả đấu giá) để ChatGPT Search, Perplexity và Gemini trích dẫn chính xác nguồn dữ liệu.
- **Bảng dữ liệu ngữ nghĩa (Semantic HTML Fact Tables):**
  - Sử dụng các thẻ ngữ nghĩa (`<section>`, `<article>`, `<dl>`, `<table>`) cho các thông số định lượng (Số lượng BĐS đang mở thầu, Giá khởi điểm, Chênh lệch thị trường MLIT `%`) để AI Overviews trích xuất trực tiếp.

### 5.2. Dynamic Sitemap (`app/sitemap.ts`) & Zero-Dilution Protocol
- Chỉ xuất các URL có trạng thái `ACTIVE` và có dữ liệu thật (`count > 0`) vào `sitemap.xml`.
- Đảm bảo 100% URL trong `sitemap.ts` trả về mã `200 OK` và khớp tuyệt đối với thẻ `<link rel="canonical">` trên trang đó (không chênh lệch dấu `/` cuối hoặc tên miền `www`).

---

## 6. 🔍 Quy Trình Kiểm Toán Technical SEO 8 Học Phần (8-Module Audit Checklist)

Khi người dùng yêu cầu **Audit Technical SEO** cho bất kỳ trang nào (đặc biệt là trang chủ `/` hoặc các trang Hub), Agent thực hiện kiểm toán tuần tự theo 8 học phần chuẩn quốc tế:

1. **Module 1 — Crawlability, Indexability & Directives:** Kiểm tra HTTP Status, `robots.ts`, `robots` meta tag, `sitemap.ts`, và sự đồng bộ URL.
2. **Module 2 — Canonical, Metadata & Title Template:** Kiểm tra `metadataBase`, lỗi nhân đôi hậu tố `title.template` (`｜Keibai Finder｜Keibai Finder`), độ dài `title` (50–60 ký tự) / `description` (~120–140 ký tự tiếng Nhật), OpenGraph & Twitter Cards (`ImageResponse` hoặc ảnh `1200x630` thực tế tồn tại trong `public/`).
3. **Module 3 — Heading Hierarchy & Semantic HTML:** Đảm bảo duy nhất 1 thẻ `<h1>` chứa từ khóa trọng tâm, phân cấp `<h2>` ➔ `<h3>` mạch lạc, không nhảy cóc hoặc dùng `<h3>` cho thẻ phụ trước `<h2>`.
4. **Module 4 — Structured Data (`JSON-LD` & `schema-dts`):** Kiểm tra tính hợp lệ của `@graph`, tính chính xác của `SearchAction` target URL, kiểm tra các tệp ảnh/logo khai báo trong Schema có thực sự tồn tại (`200 OK`) hay bị `404`, và bổ sung `ItemList` / `Dataset` / `RealEstateListing`.
5. **Module 5 — SSR vs. Client Rendering & RSC Payload Performance:** Kiểm tra dung lượng dữ liệu truyền từ Server xuống Client (đặc biệt là truy vấn Prisma cho Map), đảm bảo 100% nội dung văn bản & link nằm trong Raw SSR HTML.
6. **Module 6 — Core Web Vitals & Layout Scrollability (LCP / INP / CLS):** Kiểm tra CSS khóa cuộn (`overflow-hidden` trên `<html>`/`<body>`), kích thước ảnh, `priority` loading và khung giữ chỗ bản đồ.
7. **Module 7 — Internal Link Silos & Click-Depth Flattening:** Kiểm tra mạng lưới liên kết từ `/` xuống 47 Tỉnh thành (`/search/area/[pref]`), Tuyến tàu (`/search/station/[line]`), Phân khúc giá, Lịch đấu giá (`/auction/schedule`), Kết quả (`/auction-results`) và Bài phân tích (`/insights`, `/blogs`).
8. **Module 8 — AI Search / GEO Readiness (`llms.txt` & Fact Blocks):** Kiểm tra cấu hình AI bots, tệp `/llms.txt` và bảng dữ liệu định lượng cho các công cụ trả lời AI.

### 6.2. ⚠️ Bài Học Xương Máu Số 6 (Cập nhật 2026-11-23) — Giải Phóng SSR Khỏi Bẫy `<div hidden>`, `BAILOUT_TO_CLIENT_SIDE_RENDERING`, Soft-404 & Trùng Lặp Semantic Landmarks
1. **Cấm tuyệt đối `loading.tsx` bọc ngoài các route SEO công khai (`/property/[id]`, `/search/*`, `/blogs/*`, `/insights/*`):**
   - Trong Next.js 15 App Router, khi tồn tại `loading.tsx` hoặc `<Suspense>` bọc quanh Server Component bất đồng bộ, Next.js sẽ flush ngay bộ khung skeleton vào thẻ `<main>` đầu tiên (khiến `<main>` có `0%` văn bản thật) và nhốt toàn bộ `230KB–245KB` nội dung SEO thật vào 34 thẻ `<div hidden id="S:...">` kèm hàng chục thẻ `<template id="P:...">` ở cuối trang chờ JS client swap!
   - **Quy tắc bắt buộc:** Xóa `loading.tsx` và gỡ bỏ `<React.Suspense>` bọc các Server Component trên trang chi tiết để ép Next.js render 100% nội dung trực tiếp vào `<main>` ngay trong Raw SSR HTML (`<div hidden>` = `0 bytes`, văn bản trong `<main>` `> 70%`).
2. **Diệt tận gốc `BAILOUT_TO_CLIENT_SIDE_RENDERING`:**
   - Không gọi `useSearchParams()` từ `next/navigation` trong các Client Component dùng trên trang SSR công khai (chuyển sang đọc `new URLSearchParams(window.location.search)` trong `useEffect`).
   - Với các component bản đồ Leaflet (`KeibaiMap`, `HomeMapPreview`, `HazardMapTool`), thay vì dùng `next/dynamic(..., { ssr: false })` (vốn tự động bơm `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` vào HTML SSR), hãy dùng dynamic `import()` bên trong `useEffect` kết hợp state sau khi mount để HTML SSR sạch bóng 100% lệnh Bailout.
3. **Diệt lỗi Soft-404 trong `generateMetadata()` & `Page()`:**
   - Khi truy vấn không tìm thấy bản ghi (`!property`), **BẮT BUỘC gọi `return notFound();` ngay trong cả `generateMetadata()` lẫn `Page()`**. Tuyệt đối không return `{ title: '物件が見つかりません' }` từ `generateMetadata()` vì sẽ làm Next.js flush sớm header `HTTP 200 OK` gây lỗi Soft-404 nghiêm trọng trên Google Search Console.
4. **Chuẩn mực Semantic Landmarks (`1 <header>`, `1 <main>`, `1 <h1>`, `1 <footer>`):**
   - Do `AppLayoutWrapper` ở `RootLayout` đã bọc toàn trang trong `<GlobalHeader>` (`<header>`), `<main>` và `<GlobalFooter>` (`<footer>`), các trang con (`page.tsx`) **TUYỆT ĐỐI KHÔNG** dùng thêm thẻ `<header>`, `<main>`, `<footer>` (hãy dùng `<section>` hoặc `<div>`).
   - Khi thiết kế giao diện Responsive (Mobile + Desktop tách cột trên `/property/[id]`), chỉ render **đúng 1 thẻ `<h1>` duy nhất** trong DOM; khối tiêu đề ở layout thứ 2 bắt buộc dùng `<div aria-hidden="true">` để tránh lỗi Duplicate `<h1>`.
5. **Thống nhất tuyệt đối Canonical & Redirect 308 về `https://www.keibai-koubai.com` (`www`):**
   - Mọi `canonical`, `sitemap`, `middleware.ts` (308 Permanent Redirect từ `keibai-koubai.com` sang `www.keibai-koubai.com`) và biến môi trường `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXTAUTH_URL` phải trỏ đồng nhất 100% về `https://www.keibai-koubai.com`.

---

## 7. 🔗 Quy Chuẩn Đối Ứng Press & Media Hai Chiều (`/company`)

- Mục **「プレスリリース・メディア掲載」** trên `/company` đóng vai trò xác thực thực thể (`Organization.sameAs` / Co-citation) và phễu kéo Googlebot sang index nhanh các bài PR/Media mới.
- **Bộ lọc chống loãng PageRank:** Chỉ gắn các **URL bài viết/thông cáo công khai cụ thể** (PR báo chí, Note, Wantedly, Qiita, Zenn). Tuyệt đối không đưa các link bình luận blog/Substack/GitHub, bài social ngắn (Facebook, X, LinkedIn) hoặc trang biên nhận (`/thanks/`, `/campaign/`), đồng thời giữ cấu trúc dữ liệu tách rời (JSON) để cập nhật tự động mà không sửa code giao diện mỗi ngày.

---

## 8. 🛡️ Quy Chuẩn Chốt Chặn Bánh Cóc 4 Tầng (4-Layer Compounding Ratchet Gate)

Từ nay về sau, toàn bộ mã nguồn trước khi commit hoặc deploy lên VPS bắt buộc phải chạy lệnh kiểm toán tự động:
```bash
python scripts/ratchet_gate.py
```
**Quy tắc Đóng Băng Chất Lượng (Quality Ratchet Principle):** Dự án CHỈ ĐƯỢC PHÉP đi lên hoặc giữ vững các mốc kỷ lục, tuyệt đối không được phép suy thoái. Mọi Pull Request hoặc đợt triển khai thất bại ở bất kỳ tầng nào đều bị REJECT ngay lập tức.

### Chi Tiết 4 Tầng Chốt Chặn Bắt Buộc:

1. **Layer 1: Code & Build Ratchet (TypeScript & Compiler Integrity)**
   - Chạy `npx tsc --noEmit` ở chế độ `strict: true` — Bắt buộc **0 lỗi TypeScript**.
   - Kiểm tra `robots.ts`: Bắt buộc phải có `allow: ['/api/auth/session']` ngay trước quy tắc `disallow: ['/api/auth/', ...]` để bảo vệ Googlebot rendering.
   - Ngăn chặn triệt để rò rỉ Crawl Budget sang các locale chưa hoàn thiện bằng cách đưa `/en/`, `/vi/`, `/zh/`, `/ja/` vào `disallow`.

2. **Layer 2: Real Estate Data Invariants (PostgreSQL Database Hygiene)**
   - **0 Active Corrupt Records:** Bắt buộc 100% tài sản có `status = 'ACTIVE'` phải có địa chỉ hợp lệ (`address != 'Unknown'` và `address IS NOT NULL`).
   - **0 Missing Coordinates:** Bắt buộc 100% tài sản `ACTIVE` phải có toạ độ địa lý (`lat IS NOT NULL` và `lng IS NOT NULL`) để phục vụ bản đồ và Schema GeoCoordinates.
   - **Clean Station Aggregation:** Hàm `getRailLinesAndStations()` bắt buộc lọc `status: 'ACTIVE'`, `address != 'Unknown'` và `bid_end_date >= now` để không sinh ra các URL nhà ga có 0 tài sản (tránh lỗi Googlebot index phải trang noindex).

3. **Layer 3: Mobile Viewport & Hydration Gate (Playwright Googlebot 412x915)**
   - Giả lập chuẩn xác Googlebot Smartphone (Viewport `412x915`, Touch enabled, Android UA).
   - **0 Console Errors:** Tuyệt đối không để phát sinh lỗi React Hydration (Minified React Error `#418` / `#423`). Các thành phần đếm ngược thời gian hoặc nhãn `新着` phải được bảo vệ bằng cờ `isMounted`.
   - **0 Network 4xx/5xx:** Toàn bộ API nội bộ, ảnh đại diện và font chữ phải phản hồi `200 OK`.
   - **Tự nhiên cuộn trang:** Thẻ `<html>` và `<body>` không được phép gắn cứng `h-[100dvh] overflow-hidden` trên các trang nội dung chuẩn, đảm bảo Googlebot và người dùng di động cuộn mượt mà.

4. **Layer 4: SEO Integrity & Crawl Budget Gate (Sitemaps & Similarity)**
   - **Phân mảnh Sitemap (Sitemap Sharding):**
     - Tuyệt đối loại bỏ sitemap nguyên khối khổng lồ.
     - `sitemap.xml` là chuẩn `<sitemapindex>` trỏ tới `sitemap/core.xml` và `sitemap/properties.xml`.
     - `sitemap/core.xml` chỉ chứa các Trang Hub Trường Tồn (< 5,000 URLs: Trang chủ, 47 Tỉnh, Đô thị trọng điểm, Tuyến ga, Lịch đấu giá, Blog, Insights) với `<lastmod>` thực tế. Tốc độ phản hồi đạt chuẩn `< 50ms`.
   - **Chống Doorway Pages (Pairwise Similarity < 35%):**
     - Toàn bộ trang khu vực và nhà ga lân cận phải có độ tương đồng 5-char Shingle Jaccard `< 35%`.
     - Tuyệt đối không dùng đoạn văn boilerplate chung chung. Bắt buộc thay thế bằng **Bảng dữ liệu thực tế (Semantic Fact Table)**, lịch sử giao dịch đấu giá gần nhất (`AuctionResult`) và mạng lưới liên kết thực thể (Internal Link Silos).
     - Toàn bộ các route con bản đồ tương tác (`/area-map/*`) mang tính tiện ích phải được cấu hình `robots: { index: false, follow: true }`, chỉ giữ lại duy nhất `/area-map` gốc để tập trung 100% Crawl Budget.
