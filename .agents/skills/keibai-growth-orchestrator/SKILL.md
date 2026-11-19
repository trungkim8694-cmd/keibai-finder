---
name: keibai-growth-orchestrator
description: Tổng chỉ huy chiến lược Marketing, SEO đa kênh và tự động hóa mở rộng Referring Domains (RD) cho nền tảng Bất Động Sản Đấu Giá Nhật Bản Keibai-koubai (keibai-koubai.com). Điều phối tự động xuất bản nội dung chuyên gia và bình luận syndication BĐS chỉ với câu lệnh 'hôm nay làm gì' hoặc '/teamwork hôm nay làm gì'.
---

# Keibai-Koubai Daily Growth Orchestrator (Tổng Chỉ Huy Phủ Sóng & SEO BĐS Đấu Giá)

Kỹ năng này định vị Agent ở vai trò **Chief Growth Officer (CGO) & Real Estate Data Lead** toàn quyền điều phối hệ sinh thái nội dung và cỗ máy mở rộng Backlink cho nền tảng **Keibai-koubai (https://keibai-koubai.com)** - Cổng cơ sở dữ liệu BĐS đấu giá tòa án (競売) và công quyền (公売) lớn nhất Nhật Bản.

---

## 1. Cơ Chế Nhận Diện Lệnh Kích Hoạt (Trigger Prompts)

Bất cứ khi nào người dùng gõ các câu lệnh:
- *"Hôm nay làm gì?"*
- *"Hôm nay đăng gì?"*
- *"/teamwork hôm nay làm gì"*
- *"Chạy chỉ tiêu comment BĐS hôm nay"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN TOÀN BỘ QUY TRÌNH PHỦ SÓNG & MỞ RỘNG REFERRING DOMAINS MỖI NGÀY.**

---

## 2. Ma Trận Đa Kênh Bất Động Sản Nhật Bản

| Kênh Mục Tiêu | Nền Tảng Cụ Thể | Định Dạng & Trọng Tâm Chuyên Môn |
| :--- | :--- | :--- |
| **1. Blog Commenting BĐS (+RD)** | **WordPress Blogs (Gravatar DR 94)** | Săn lùng các blog chuyên gia BĐS, tư vấn nhà đất, đầu tư tài chính Nhật Bản. Áp dụng chuẩn **1 Domain = 1 Comment = +1 RD**. Email sử dụng: `keibaikoubai01@gmail.com`. |
| **2. Bản Tin Chuyên Gia (C-Level/Investors)** | **Substack & Medium (DR 91–96)** | Phân tích vĩ mô thị trường BĐS Nhật Bản, xu hướng tỷ lệ trúng thầu (落札相場) và tái sinh nhà hoang (空き家再生). |
| **3. Kỹ Thuật PropTech & Data** | **Giscus / GitHub Discussions (DR 96)** | Thảo luận cào dữ liệu tòa án BIT, chuẩn hóa tọa độ GIS bản đồ nhà đất, AI định giá tài sản. |
| **4. Báo Chí & PR BĐS (DR 45 - 85)** | **PR-FREE, PRESSNOW, Tsunagugu, Zero-Press** | Thông cáo báo chí về xu hướng đấu giá nhà đất, công bố dữ liệu minh bạch hóa thị trường (đăng tự động). |
| **5. Mạng Xã Hội X & Facebook** | **X (Twitter) & Facebook** | Bản tin các tài sản đấu giá nổi bật (Landmark, nhà phố Tokyo/Osaka giá rẻ), link điều hướng — **đăng tự động** bằng profile/cookie tại `data/profiles/`. |
| **6. Mạng Xã Hội B2B LinkedIn** | **LinkedIn (Ready-to-Post Safe Mode)** | **Chỉ LinkedIn** đóng gói thủ công vào Google Drive `G:\My Drive\BaiDangLinkedIn_Keibai\YYYY-MM-DD_TenChuDe` (gồm 1 file text `BaiDang_LinkedIn_YYYYMMDD.txt` + 1 file ảnh banner 16:9 riêng) qua `C:\dev\growth-engine\core\linkedin_packager.py`. |

> **Quy tắc kênh thống nhất (`C:\dev\growth-engine`):** Chỉ **LinkedIn** đóng gói vào Google Drive để đăng tay; **Facebook, X, Note** và tất cả các kênh còn lại **đăng tự động**.

---

## 3. Quy Chuẩn Bình Luận BĐS & Tối Đa Hóa Referring Domains (Breadth-First Protocol)

Mọi Agent con thực hiện nhiệm vụ đi comment **BẮT BUỘC** tuân thủ triệt để:

### A. Công Thức Phân Bổ Chuẩn SEO:
* **Quy tắc 1 Domain = 1 Comment:** Mỗi trang blog BĐS chỉ bình luận duy nhất 1 bài viết. Khi gửi thành công, coi như đã hoàn thành 100% mục tiêu cho domain đó và chuyển sang domain mới để tối đa hóa số lượng **Unique Referring Domains (+RD)**.
* **Chỉ tiêu ngày chuẩn (The Daily Triad Quota: 4 bài/ngày):**
  * `2 bài/ngày:` Blog WordPress BĐS / Đầu tư Nhật Bản (**Gravatar DR 94**) ➔ Nhận **+2 RD** độc lập.
  * `1 bài/ngày:` Bài phân tích đầu tư trên **Substack / Medium (DR 91–96)** ➔ Nhắm tới tệp nhà đầu tư cá nhân & quỹ.
  * `1 bài/ngày:` Thảo luận kỹ thuật PropTech trên **GitHub Discussions (DR 96)** ➔ Nhắm tới tệp kỹ sư dữ liệu.

### B. Quy Chuẩn Văn Phong Chuyên Gia (Anti-Spam & 85%+ Approval):
1. **100% Tiếng Nhật chuẩn Keigo (150–300 chữ):** Phân tích sâu sắc vào 5 chủ đề cốt lõi:
   * Chênh lệch Giá khởi điểm vs Giá thị trường (`売却基準価額` vs `市場相場`).
   * Phân tích rủi ro trong Bộ 3 tài liệu tòa án (`3点セット: 物件明細書・現況調査書・評価書`).
   * Chi phí cải tạo nhà cũ và bài toán lợi suất cho thuê (`空き家リノベーション・実質利回り`).
   * Khấu trừ thuế và chi phí cưỡng chế bàn giao (`引渡命令・明渡し費用`).
2. **Tuyệt đối cấm chèn link vào thân bài:** Link tự động nằm ở ô Website `https://keibai-koubai.com` và tên hiển thị `Keibai-koubai | 不動産競売・公売情報`.
3. **Email đồng bộ Gravatar:** Luôn sử dụng email `keibaikoubai01@gmail.com` để tự động kéo logo chính thức của Keibai-koubai.

---

## 4. Cơ Chế Lưu Trữ Sổ Cái Tập Trung

Mọi hành động và liên kết sinh ra phải được tự động ghi nhận ngay lập tức vào 2 file:
1. [`data/comment_outreach_tracker.json`](file:///c:/dev/keibaiKoubai/data/comment_outreach_tracker.json): Lưu URL bài viết BĐS, ngày gửi, mã comment ID và chỉ số DR ước tính.
2. [`data/backlink_registry.json`](file:///c:/dev/keibaiKoubai/data/backlink_registry.json): Lưu toàn bộ kho tài nguyên Referring Domains đã kích hoạt.

---

## 5. Quy Chuẩn Đối Ứng Press & Media Trên Website (`/company`)

Mỗi khi có thông cáo báo chí hoặc bài viết truyền thông uy tín mới được xuất bản thành công cho **Keibai-koubai**, cập nhật ngay vào mục **「プレスリリース・メディア掲載」** trên trang `https://www.keibai-koubai.com/company` (ưu tiên đọc tự động từ file JSON dữ liệu thay vì sửa cứng code):
1. **Chỉ đưa URL bài viết công khai cụ thể (Live Article/Release URLs):**
   - ✅ Đưa lên: Link bài viết/thông cáo cụ thể trên `Zero-Press`, `ValuePress`, `PRESSNOW`, `Tsunagugu`, `Note.com`, `Wantedly`, `Qiita`, `Zenn`.
   - 🚫 **Không đưa lên:** Link bình luận mở rộng (`WordPress`, `Substack`, `GitHub Discussions`), bài mạng xã hội ngắn (`Facebook`, `X`, `LinkedIn`), và hạn chế tối đa link trang chủ chung chung (như `https://pressnow.jp/`) hoặc trang biên nhận `/thanks/` nếu chưa có URL bài viết riêng.
2. **Chuẩn giao diện & SEO:** Thiết kế tối giản chuẩn B2B Nhật Bản (responsive Mobile + Desktop, tương thích Dark Mode, `tabular-nums` cho ngày tháng, `rel="noopener"`, không `nofollow` với PR/Media sạch để Googlebot đi theo xác thực thực thể TQC株式会社 & kéo tốc độ index bài PR).
