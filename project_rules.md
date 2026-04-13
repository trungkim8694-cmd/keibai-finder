# Keibai Finder - Project Rules & Persistent Memory

Đây là "Trí nhớ vĩnh viễn" của hệ thống trợ lý AI. File này chứa các quy định nền tảng (Base Rules) và các tính năng cốt lõi đã hoàn thiện (Critical Features).

## 1. ⚙️ Quy tắc làm việc cốt lõi (System Rules)
- **MANDATORY REVIEW:** Bắt buộc đọc file này trước khi thay đổi bất kỳ logic/file nào để giữ toàn vẹn kiến trúc hệ thống.
- **NO DELETION:** Không được tự ý xóa bỏ các tính năng đã chạy ổn định trừ khi USER chỉ định rõ.
- **COMPONENT ISOLATION:** Khi file logic quá dài (+500 lines), chủ động đề xuất tách Component riêng (Refactoring) thay vì tự ý xóa bớt code/comment để lách giới hạn Output.
- **AUTO UPDATE HOOK:** Mỗi khi hoàn thành một quy trình tích hợp hay Logic lớn, AI PHẢI TỰ ĐỘNG cập nhật file này bằng công cụ chỉnh sửa để lưu trữ kiến thức nội tại.

## 2. 🏗️ Kiến trúc Dữ liệu & Hệ thống Crawler
- **Database:** PostgreSQL & Prisma. Luôn duy trì adapter thuần mặc định. Cột `source_provider` (BIT/NTA) và `source_url` đóng vai trò phân cấp đa nguồn và dùng cho bộ lọc.
- **Crawler Pagination:** Script `crawler/advanced_crawler.py` dùng vòng lặp JS `getData(n)` tính toán bằng `totalNumber` (tránh rủi ro click `Next` button của Playwright).
- **Geocoding API (OSM/Nominatim):** Không dùng API giới hạn phí. Sử dụng OpenStreetMap miễn phí cho Crawler, delay tối thiểu 1s/Request + kèm `User-Agent`. 
  - **Khử trùng lặp `line_name`:** Tự động cắt chuỗi nếu tên tuyến chứa dấu chấm phẩy (`;`) hoặc dấu phẩy (`,`) và bảo lưu thẻ Tuyến đầu tiên (ví dụ `XX線;YY線` -> `XX線`) trước khi đưa vào Database.
  - Gán `NULL` cho DB nếu API trả về "Unknown Railway". Tuyệt đối không tự ý chèn thêm tiền tố địa phương vào địa chỉ để tránh Geocoding sai định hướng.
  - **Chuẩn hóa Địa chỉ & Tỉnh (Prefecture):** Crawler cào BIT phải trích xuất `prefecture` bằng cách đối chiếu tên Tòa án (`court_name`) với mảng `COURT_PREFIX_MAPPING` tĩnh. Địa chỉ của tất cả tài sản bắt buộc phải được tự động chèn kèm tên Tỉnh (`prefecture`) vào đầu chuỗi `address` trước khi lưu vào DB PostgreSQL. Điều này đảm bảo Frontend UI sử dụng độc lập trường tĩnh `property.address` thống nhất, không rơi vào tình trạng tự nối chuỗi thủ công làm lặp dữ liệu (vd: `北海道北海道`). Dữ liệu NTA dùng Regex `^(.{2,3}[都道府県])` để tự động kéo `prefecture` từ `address` sẵn có. Cột `prefecture` ở Database bắt buộc phải được lấp đầy để quầy Counter UI hoạt động.
- **Schema & Data Types Cốt lõi:** `area` (Float), `bid_end_date` (DateTime), `walk_time_to_station` được mapping chuẩn xác vào Schema. Diện tích chuỗi Full-width (`３，１０３`) từ NTA Parser sẽ tự động được regex đổi thành Float nguyên thủy.
- **Data Integrity - Prefecture Column:** Cột `prefecture` là bắt buộc cho tính năng phân tích khu vực (Area Stats). Nếu dữ liệu cũ bị thiếu, sử dụng script `crawler/fix_db_prefecture.py` để bóc tách Tỉnh từ đầu chuỗi `address`. Tất cả các thống kê trên SearchBar (Hokkaido, Kanto, v.v.) phụ thuộc hoàn toàn vào việc cột này không được `NULL`.

## 3. 🗺️ Quy chuẩn Giao diện Trang chủ (Home & Map View)
- **Truy vấn Server Action:** `propertyActions.ts` truy vấn DB trực tiếp bằng Prisma. Luôn gọi `select` để từ chối Fetch trường văn bản JSON nặng `raw_data_json` nếu không cần đến ở List Card.
- **Phân mảnh List & Bản đồ (Decoupling):** Dữ liệu Danh sách (List) KHÔNG ĐƯỢC lồng khóa vào tham số `bounds` của Bản đồ. List luôn fetch bộ lọc toàn quốc (ngay cả các nhà báo lỗi Geocoding/`NULL` độ). Lệnh Bounds Map chỉ được chèn vào Filter API khi user gõ nút "Tìm kiếm khu vực này".
- **Hệ thống Lọc Tỉnh/Tuyến/Ga (Cascading URL Sync):** 
  - Tham số khởi tạo tự sync từ URL Query (`?pref=xxx&line=xxx`). Khi build Parameter truyền qua API Frontend, luôn gán overrides trạng thái React trực tiếp tại sự kiện kích hoạt (Ví dụ: `triggerSearch({ prefecture: 'Tokyo' })`) để không bị độ trễ cập nhật State React làm sai lệch lệnh gửi tới Backend. Sau đó áp dụng Spread Syntax `const newFilters = { ...filters }` để tránh phá vỡ nhánh query logic tĩnh.
  - UI Card lọc sở hữu Nút tắt `[x]` clear tức thì để dọn sạch URL bằng `router.replace` mượt mà, triệt tiêu filter parameter khỏi History tab mà không Refresh trang thủ công.
  - **KHÔNG sử dụng Bộ Lọc Bán kính (No Radius Filter/Haversine):** Hệ thống đã loại bỏ hoàn toàn việc tìm kiếm theo Bán kính (radiusKm) ở cả Frontend lẫn Backend để tối ưu hiệu năng. Thay vào đó, việc phân vùng không gian (Spatial scoping) được giao khoán hoàn toàn cho cơ chế `Bounds` đa giác của Map và tự động Fit Bounds theo kết quả trả về của Ga/Tỉnh/Từ khóa.
- **Smart Autocomplete (Bộ máy Tìm kiếm Gợi ý):** Box nhập liệu Keyword bắt buộc phải có Menu Dropdown thả xuống tự động đề xuất Ga Tàu, Tuyến, Địa chỉ trích xuất bằng chuẩn `ILIKE/DISTINCT` qua Server Action. Logic Frontend bắt buộc bọc thêm bộ đếm `Debounce 300ms` nhằm bảo vệ DB khỏi bão Spam Request. Sau khi User click vào một Gợi ý, hệ thống tự động điền Form + đóng Panel + gọi `triggerSearch` không độ trễ.
- **Tự động Auto-Fit Bản đồ:** Bản đồ được gắn mã `filterFingerprint` (Chuỗi JSON Filter Hash). Hễ mã này biến đổi (chọn Line, Range giá), lá chắn `useEffect` nổ phương thức `map.fitBounds(..., maxZoom: 16)` bắt toàn bộ Marker focus vào khung hiện hành. 
- **Hover/Click Sync Hệ Thống (Two-Way Component Sync):** 
  - Hover List Card -> Map Marker: Phóng to Marker (`scale-125`), nháy Bounce, đẩy `zIndex` lên tầng 1000. DOM can thiệp trực tiếp bằng `map.eachLayer`, bỏ qua render state tốn kém.
  - Click Danh sách/Bản đồ: Marker mục tiêu được Pan nhắm thẳng, List tự động nhấc nhẹ (Scroll To) Card đó. Nếu tài sản trùng tọa độ hoàn toàn (nhất là Chung cư Mansion), hệ thống `react-leaflet-cluster` `disableClusteringAtZoom={18}` sẽ áp dụng Spiderfy để xòe đều chân nhện xem trước Card.
- **Mobile-First App Layout:** Wrap lưới Flex, Overflow Hidden. Trái/Phải (Dành cho máy tính), Ngăn kéo Dưới/Trên (Dành cho Mobile). Nút Floating Toggle dập tắt các Component chồng lớp.

## 4. 📄 Trình bày Trang Chi tiết (Detail View)
- **Tách khối Độc Lập (`/components/Detail/`):** 
  - `PdfLinks.tsx`: Cung cấp các nút hành động chính (Tải PDF, Vào trang đấu thầu, Liên hệ).
    - **BIT PDF Direct Bypass:** Đối với nguồn BIT, hệ thống sử dụng kỹ thuật tạo URL trực tiếp `https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId=${courtId}&saleUnitId=${saleUnitId}` để bypass cơ chế chặn Hotlink và yêu cầu lưu file vật lý. Tuyệt đối không lưu file PDF lên Server để tiết kiệm Disk.
  - `CourtValuation.tsx`: Thay thế cho component AI dự đoán cũ. Hiển thị giá Toà án, thông tin Ga tàu và Deadline đấu thầu một cách chuyên nghiệp.
  - `AiAnalysisPanel.tsx`: Báo cáo chuyên sâu 4-Card (Rủi ro, Chi phí, Giá thầu, ROI) đa ngôn ngữ. Luôn đặt ở **Dưới cùng trang** (sau khối Market Comparison) để làm "chốt hạ" báo cáo.
    - **UI Placeholders:** Ẩn tạm thời các giá trị số tại thẻ `AI 落札予想価格` và `投資対効果` thay bằng dòng chữ **(機能アップデート中...)** để chờ đồng bộ API MLIT. Phần Rủi ro và Chi phí vẫn giữ nguyên do trích xuất từ dữ liệu thực tế khá tin cậy.
    - **Disclaimer:** Phải viết bằng tiếng Nhật: "本データは裁判所の資料を基にAIで作成・集計されたものです。正確な情報については必ず原本（3点セット等）をご確認ください。"
    - **Market Link:** Tích hợp liên kết "周辺の取引相場 ↗" ở chân bảng.
  - `DetailMapComponent.tsx`: Auto vẽ đường Kính Radar 1000m phân rã các ga gần nhất kèm lộ trình Cột Mốc Quá khứ Giao dịch lân cận.
- **NTA Deep Parsing & Bảng Động:** Duy trì bộ ba cấu trúc phân tầng JSON (Overview / Details / Contact) nội tại cùa `raw_data_json`. Render UI DataGrid không gán Key cố định cứng, xử trí String Text cực dài (quy định, pháp lý) trượt trong lốc Scrollbar max-height `overflow-y-auto`.
- **Hệ thống Chuẩn hóa AI/Analytics:**
  - **Tính Toán Diện Tích (Area Summation):** Đất phân lô phải cộng gộp vòng `土地面積（登記）`. Nhà chung cư Mansion sẽ regex gọt rác chuỗi tầng (`５階`) giữ riêng `専有面積（登記）`. Xuất ⚠️ cảnh báo nguy hiểm với căn < 10m2.
  - **Cơ chế Đếm và Thống Kê (Region Counters):** Bảng `prefectures` map Area bắt buộc bao phủ mảng đủ 47 tỉnh thành chia làm 7 Vùng (Regions) để Data Counter không bị rò rỉ (sai lệch tổng vùng so với Server). Tổng số `全国` (Toàn quốc) phải quy chiếu đích danh key `areaStats['全国']` được khởi tạo riêng biệt từ `prisma.count`. Cấm dùng hàm Array Reduce quét tổng `Object.values(areaStats)` ở Frontend, vì sẽ dẫn tới cộng đúp/Overlapping Data (tự cộng chính nó).
  - **Khoảng Cách Tiêu chuẩn:** Tỷ suất 80m = 1 phút bộ hành. Khi bán kính ga chạm mốc > 5km, Node Label tự nhả tag `🚗` xe ô tô đổi màu cảnh báo địa hình phương tiện.
  - **Xử lý Thời gian và Đếm ngược (Countdown/Date Tags):** Tất cả Parser gốc (Python Cấu trúc) BẮT BUỘC lưu trữ Timestamp kèm cờ múi giờ Nhật Bản (Ví dụ: `T23:59:59+09:00`) tránh lệch giờ khi chạy hệ thống local sang Postgres. Prisma mặc định parser Datetime trả về String dạng UTC (vd `2026-04-13T23:59:59.000Z`). TUYỆT ĐỐI không gọi `dayjs(date).tz('Asia/Tokyo')` (tự động cộng thêm 9 tiếng thành ngày 14). Mọi Date Tags trên List/Detail phải thông qua hàm `formatBidPeriod` (hoặc `formatDateJapan`) dưới module `dateFormatter.ts` sử dụng hàm `dayjs.utc(date)` để fix cứng mốc gốc và Format chính xác. Đối với mốc đếm số ngày còn lại (Toán hạng): Áp hàm `.startOf('day')` thông qua `utc(date)` trước khi chia cho chu kỳ Ngày để tránh sai số hiển thị.
  - **Máy tính Lợi nhuận ROI (`lib/utils.ts`):** Dynamic Yield của Residential quy định theo Quận huyện (Tokyo = 5%, Vùng cận trung/Hokkaido = 15%). Fixed Base ROI bù trừ theo niên hiệu Tòa nhà (Trước 1981 - Khấu hao sâu 5%). Đất đai thô tính theo Capital Gain Land Price biên dao động chuẩn 20%~50%.
  - **Ngôn ngữ Nhật ngữ Core UI (100%):** Bắt buộc các Alert, Tooltip AI phải bao bọc bằng Keigo Nhật (Ví dụ: `〜算出しております`), cấm dùng Tiếng Anh UI. Kêu gào điều lệ Nông nghiệp: `※農地法第3条の許可が必要です`. 
- **Quản lý Truy cập Client Data:** Lọc Views thông qua DB Session Tracking Server Actions (ngăn F5 Farm views). Lưu Favorites và View History cục bộ bằng `LocalStorage` cho tài khoản Vãng lai (Khách). Hạn chế Khách Vãng Lai được Pin 5 mục Yêu thích. Popup Signup phải bọc bằng Cổng Portal React Node trỏ vào `document.body` set z-Index `[9999]+` tránh bị cắt thủng DOM trên Card Element có chứa `<Link>`. Lịch sử tài sản xem được Group lồng lại bằng Cùng Address + Type.
- **Lưu trữ Metadata Liên kết BIT (`contact_url`):** Nút "お問い合わせ" BIT được bóc tách từ selector `a.bit__btn_secondary` của trang chi tiết BIT, href tuyệt đối được chuẩn hóa về `https://www.bit.courts.go.jp/info/info_XXXXX.html`. Link này được nhúng trực tiếp vào **Summary Section** của `raw_display_data` (trường `contact_url`), KHÔNG tạo cột DB mới. Frontend đọc `raw_display_data[0].contact_url` (Section Summary) và truyền vào prop `bitContactUrl` của component `PdfLinks`. Trong `PdfLinks`, ưu tiên dùng `bitContactUrl` trước, sau đó mới fallback sang courtId-derived URL.

- **Shared Component `CourtContactLink`** (`src/components/CourtContactLink.tsx`): Component dùng chung để hiển thị tên Tòa án kèm liên kết. Nhận prop `courtName` và `contactUrl` (optional). Nếu có `contactUrl`: render `<a>` tag với icon `↗`, hover gạch chân + đổi màu, `target="_blank"`, `e.stopPropagation()`. Nếu không có: render text thuần. Được dùng ở: (1) `PropertyCard.tsx` phần tên tòa án; (2) `PropertyInfoTags.tsx` Tag ngay sau Tag ngày tháng 📅. Khi thêm nguồn dữ liệu mới, chỉ cần truyền đúng `contactUrl` tương ứng.
- **Hiển thị Link Tòa án (CourtContactLink Pattern):** Tên tòa án/đơn vị phụ trách BIT hiển thị tại 2 vị trí: (1) Dòng header của PropertyCard — dùng CourtContactLink trực tiếp với truncate/min-w-0 để chống vỡ layout Mobile; (2) Tag trong hàng Thẻ Tag của PropertyInfoTags ở trang Chi tiết — prop showCourtTag={true} mới được bật (mặc định false để không render ở List). NTA chưa có contact_url nhưng đã sẵn cấu trúc: khi có URL thì truyền vào contactUrl là hiện ngay. Tag tòa án style: border-blue-100 / bg-blue-50, text-[11px].
- **contact_url Data Flow Pattern:** contact_url của BIT được trích xuất ngay trong Server Action (`mapPropertiesWithStations`) từ raw_display_data Summary section, exposed như một field riêng biệt trong object property. Client Components (PropertyCard, PropertyInfoTags) đọc trực tiếp `property.contact_url` — KHÔNG parse raw_display_data phía Client. PropertyInfoTags có dual-source fallback: ưu tiên `property.contact_url`, fallback sang parse raw_display_data (cho detail page dùng Prisma object trực tiếp).
- **Authority Dropdown Filter System:** Thay thế Provider Switch (ALL/BIT/NTA) bằng 2 Dropdown riêng: ⚖️ BIT 裁判所 và 🏛️ NTA 税務署. Dữ liệu danh sách đơn vị + count được load qua `getAuthorityStats()` Server Action (groupBy court_name / managing_authority). Khi chọn tòa án BIT, tự động set provider='BIT' + courtName filter; tương tự cho NTA. Trạng thái: selectedCourt, selectedNtaAuth, isBitOpen, isNtaOpen. Filter Backend: whereClause.court_name = filters.courtName (SearchFilters interface đã có courtName). Dropdown có scroll max-h-52, check mark ✓, badge count, active highlight.
- **Authority Data Parsing & Matching Rule**: Dữ liệu NTA `managing_authority` trong DB chứa ký tự khoảng trắng thừa và ký tự xuống dòng (vd: `関東信越
 国税局`). Hàm `getAuthorityStats()` sử dụng regex `.replace(/\s+/g, ' ').trim()` để hiển thị sạch trên UI (`関東信越 国税局`). Do đó, khi filter, backend sử dụng `split(' ')[0]` (chỉ lấy phần đầu, vd `関東信越`) và dùng `{ contains: cleanAuth }` để tra xuất trên DB, nhằm tránh lỗi mismatched string. Không dùng filter Prisma kiểu `not: undefined, gt: ''` vì có thể gây lỗi bỏ qua type; luôn fallback bằng JS array filter (.filter(r => r.court_name)) trên kết quả groupBy.
- **Z-Index & CSS Overflow cho Component Float**: Các Component nằm trong thanh cuộn ngang `overflow-x-auto` tuyệt đối không render `absolute` trần bên trong (sẽ bị cắt xén/z-index hỏng). Luôn bọc Floating Menus này bằng thẻ `<Portal>` (Headless UI) đồng thời sử dụng `@floating-ui/react` hooks (`refs.setReference`, `refs.setFloating`, `style={floatingStyles}`) với `whileElementsMounted: autoUpdate` để thoát khỏi ranh giới overflow của thẻ cha mà vẫn neo chuẩn vị trí so với nút bấm ban đầu.
- **Yield Tag Logic (List View):**
  - Chỉ hiển thị Tag lợi nhuận trên `PropertyCard` cho loại tài sản `戸建て` và `マンション`.
  - Giá trị lợi suất phải lấy từ `ai_analysis` (trường `ja.roi_analysis.yield_percent`). Định dạng: `利回り X%`.
- **Hiển thị Badge Tổng số lượng ở cấp Nút bấm (Top-Level Badge)**: Tính toán `totalCount` và `activeCount` dựa trên `authorityData` bằng Array.reduce, và hiển thị thẳng lên trên nhãn nút bấm của các bộ lọc Dropdown nhằm tăng tính trực quan. Cách phối màu được bám sát chuẩn nhận diện: Xanh dương cho BIT và Đỏ cho NTA.
- **Split Toggle Logic cho Multi-Source**: Đối với việc quản lý nhiều nguồn dữ liệu (như BIT và NTA), sử dụng cơ chế Split Button (thay vì Dropdown gộp). Một nửa trái của nút sẽ hoạt động dưới dạng Toggle (Bật/Tắt master source), nửa còn lại sẽ là Nút Mũi Tên (Chevron) mở Dropdown bộ lọc chi tiết cho nguồn đó. Đảm bảo Backend sử dụng Array hoặc OR condition để mapping các toggle này độc lập thay vì ghi đè chéo lên nhau.
- **Chuẩn hóa Thông tin Cơ quan chủ quản (NTA)**: Khi hiển thị thông tin tài sản từ nguồn NTA, thay vì dùng label chung chung "NTA (Quốc thuế)", hệ thống sẽ trích xuất và sanitize trường `managing_authority` để hiển thị tên Cục Thuế / Chi cục Thuế cụ thể (ví dụ: 関東信越 国税局). Đồng thời, gắn link `contact_url` hoặc `source_url` trực tiếp vào tên cơ quan, tuân theo shared component `CourtContactLink` với `theme="red"` để duy trì UX thống nhất với hệ thống BIT Court.
- **Gộp thao tác Action đối với tài sản NTA**: Thay đổi Action layout ở màn hình Chi tiết: Nút (📍 所在地図) và (📞 問い合わせ) được gộp chung thành một khối điều hướng (dùng chung link của cơ quan thuế hoặc tài sản gốc). Dành không gian trống để đẩy nút (Đăng nhập E-tax) lên cụm Action chính với màu nhấn đỏ đặc trưng thay vì để thõng bên dưới trang. UX Layout này giúp tối ưu Responsive Mobile và giảm số lượng nút dư thừa.
- **Sửa lỗi đồng bộ Liên kết cơ quan thuế (Consistency Fix)**: Trang Chi tiết dùng một data obj riêng biệt thay vì gọi chung `getProperties` như List Map, nên field `contact_url` bên trong `extPropertyStr` cho PropertyInfoTags đã được force override bằng biến `ntaMapLink` trích xuất cục bộ trong page.tsx.
- **Logic Filter Theo Property Type & Thống kê số lượng theo Group**: Chức năng Search Type đã mở rộng bằng cách thêm nhóm 'その他' (Others). Về Backend (`getProperties` & `getTypeStats`), 'その他' đóng vai trò là một điều kiện phủ định (`notIn`) các nhóm chính yếu và được push vào array `whereClause.AND` để không conflict với Toggle `whereClause.OR` của Nguồn NTA/BIT. Component hiển thị nay chèn dynamic count `({count})` bên trong Badge để realtime tracking số lượng tài sản khả dụng.
- **Tính năng Clear All Filters (Reset Trạng thái)**: Thanh SearchBar được bổ sung nút 'クリア' (Clear) kết hợp với Component `Transition` của HeadlessUI để chỉ hiển thị khi `hasActiveFilters` là `true`. Khi click, hàm `handleClear` reset mọi Custom State (Prefecture, Price, Type, Authority, v.v.) về default và gọi `onSearch({})` để clean data. Việc này giúp cải thiện Filter UX trong hệ thống có nhiều bộ lọc.
- **Saved Filters (Local Storage)**: Đã triển khai tính năng lưu bộ lọc yêu thích trong SearchBar bằng `localStorage` (`kb_saved_filters`). Tính năng sử dụng Auto-generated Naming dựa trên hàm `getFilterSummary` để không cần nhập text. Maximum 5 bộ lọc được lưu. UI hiển thị dưới dạng Chips bên dưới Action Row, có khả năng Load ngược lại State (kích hoạt `triggerSearch`) và Xoá từng Item.
- **Unified Mobile & Desktop Toolbar (SearchBar Redesign)**: Thay vì tách biệt thanh Mobile Header và Desktop Toolbar (gây tốn diện tích và duplicate logic), hệ thống sử dụng chung một `Universal Toolbar` bằng cách xóa wrapper `hidden lg:flex` và sử dụng `sticky top-0 z-[60]`. Layout được tinh gọn với các nút Action hiện chữ `⭐️ 保存` & `🔄 クリア`. Các nút lọc (Filter Chips) được bọc trong container `overflow-x-auto whitespace-nowrap` giúp người dùng có thể vuốt ngang (Swipe) trực tiếp trên điện thoại mà không bị tràn khung hình.
- **Empty State Localization & Cross-Component Reset**: Bảng thông báo rỗng (Empty State) ở Map List tuân thủ 100% tiếng Nhật (`条件に一致する物件は見つかりませんでした`). Thay vì phải truyền props/ref phức tạp từ page.tsx xuống SearchBar, nút "条件をクリアする" gọi trực tiếp lệnh `window.dispatchEvent(new CustomEvent('clear-all-filters'))` để kích hoạt hàm `handleClear` toàn cầu nội tải trong thẻ SearchBar, tối ưu giao tiếp Component độc lập.
- **SearchBar Mobile Flex-Wrap Architecture**: Để giải quyết tình trạng bị vỡ giao diện (squished UI/mất input) trên màn hình dọc (như iPhone), Container chính hiển thị Search Keyword & Action Type không còn ép vào một hàng (`flex items-center w-full`) mà đã chia thành thiết kế 2 hàng thích ứng thông qua `flex-col lg:flex-row`. Hàng 1 ưu tiên cho Text Input lấy trọn 100% width. Hàng 2 hiển thị Prefecture Dropdown (trái) và Nhóm Buttons Action (phải). Thay đổi này giúp Touch Target trên Mobile đạt chuẩn UI.
- **Thò thụt thanh công cụ (Expandable SearchBar)**: Tính năng Toggle cho bộ lọc (`isExpanded`) nay đã kích hoạt cho Mobile. Khi SearchBar đóng lại (`opacity-0 max-h-0`), nó sẽ thế chỗ bằng một "Summary Pill" tóm tắt bộ lọc bằng chữ (hiển thị trên cùng map) thông qua hàm `getFilterSummary` (VD: "Tokyo / 土地"). Thanh công cụ sẽ tự động đóng vào thông qua CustomEvent `map-interaction` bất cứ khi nào người dùng bắt đầu vuốt chạm bối cảnh `dragstart/zoomstart` ở bản đồ `KeibaiMapInner`, hoặc sau khi bấm `検索` (Action Apply). Điều này giúp tiết kiệm tối đa không gian bất động sản màn hình Mobile.
- **Auto-Resize Map Context (Leaflet ResizeObserver)**: Do `SearchBar` tự động co giãn bằng kĩ thuật CSS `transition max-height`, kích thước của Container HTML chứa bản đồ Leaflet bị chênh lệch kéo theo nhưng không làm thay đổi `window.resize`. Điều này dãn đến lỗi Bản đồ tạo ra các "khoảng trắng/beige" khổng lồ do không biết đường Re-render Tile. Để trị dứt điểm, một hook `MapResizeObserver` theo dõi biến động bằng `ResizeObserver` API đã được gắn vào `KeibaiMapInner.tsx` để liên tục gọi `map.invalidateSize()` bất cứ khi nào layout flexbox dãn nở.
- **CSS Specificity Transition Conflict**: Quá trình rút gọn (collapse) một khối thẻ HTML bằng CSS Utility Classes (VD: Tailwind) có thể dẫn tới việc lớp trạng thái như `max-h-[800px]` (JIT sinh ra ngẫu nhiên) bị áp dụng muộn hơn và đè lên `max-h-0`. Việc này khiến hiệu ứng thu gọn trông như đã hoàn thành (nhờ `opacity-0`) nhưng chiều cao vật lý của Component vẫn phình to. Giải pháp tiêu chuẩn là sử dụng Strict Ternary Operator `${isExpanded ? 'max-h-[800px]' : 'max-h-0'}` để loại trừ tuyệt đối CSS thừa khỏi phiên bản trình duyệt biên dịch.
- **Dropdown Tỉnh/Thành (Tái cấu trúc Multi-select)**: Hệ thống tìm kiếm đã được nâng cấp để hỗ trợ chọn nhiều tỉnh cùng lúc so với phiên bản Single-select nguyên thuỷ (`selectedPrefectures: string[]`). Về mặt kiến trúc UI: Nút "全国" đóng vai trò là Global Reset (bỏ chọn toàn bộ Region/Prefecture). Người dùng có thể click chọn tắt mở "Vùng" để hệ thống tự động bóc tách danh sách các Tỉnh nội hàm. Panel Dropdown được gỡ bỏ thao tác làm mờ "Overlay backdrop" cũng như hành vi tự động tắt (auto-close) - kết quả tìm kiếm `triggerSearch` chỉ chạy dứt điểm khi người dùng nhấn "決定" ở thanh Footer tĩnh.
- **Tối ưu Hiệu năng Cơ sở Dữ liệu Vùng (Region Array Expansion)**: Việc thêm cột tĩnh `region` vào Database là phản tác dụng vì khi người dùng tìm kiếm đa điều kiện (VD: chọn 1 Vùng và 1 Tỉnh lẻ), PostgreSQL bắt buộc phải đánh đổi bằng cách dùng cây `BITMAP OR` kết hợp. Thay vào đó, nền tảng sử dụng kỹ thuật *Frontend Array Expansion* - biến 1 Vùng thành cấu trúc mảng nhiều Tỉnh và gửi xuống Backend Prisma mệnh đề gộp `{ prefecture: { in: string[] } }`. Đây là chuẩn kiến trúc phân giải Index đơn (Single-Index Scan) cho phép B-Tree Database của Postgres luôn trả về đồ thị quét hiệu năng cao nhất (Fastest Execution Plan) mà không cần phải thay đổi Database Schema.
- **Chuẩn Geocoding Toàn Dự Án (OSM Nominatim)**: Toàn bộ pipeline geocoding của dự án đã được đồng nhất về OSM Nominatim (OpenStreetMap). Lý do: Gemini AI có thể hallucinate tọa độ sai mà không báo lỗi, đồng thời chi phí API token tiêu tốn không cần thiết cho bài toán địa lý. OSM Nominatim miễn phí, có độ chính xác rất cao với địa chỉ tiếng Nhật, và không phụ thuộc vào quota. Cả `scrape_detail_to_db.py` (BIT) lẫn `nta_parser.py` (NTA) đều dùng cùng một logic: `aggressive_clean()` chuẩn hóa Full-width→Half-width → 3-layer retry fallback (Đầy đủ → Phường/丁目 → Quận/市区). **Bắt buộc**: Không được dùng random fallback khi geocode thất bại - phải lưu `NULL` để tránh ghim bản đồ sai vị trí. Thêm vào đó, mọi tọa độ trả về phải qua hàm `is_valid_japan_coords()` kiểm tra trong biên giới `lat: 24~46, lng: 122~154` trước khi lưu DB.

---

## 📋 Nhật Ký Thay Đổi — Phiên Làm Việc 2026-04-05

### 1. UI/UX — SearchBar & Prefecture Dropdown (`SearchBar.tsx`)
- **Đóng Dropdown bằng `close()` nguyên bản của HeadlessUI**: Thay thế mẹo giả lập phím Escape (`document.dispatchEvent(new KeyboardEvent(...))`) bằng tham số `close` được trích xuất trực tiếp từ render props của `<Popover>`. Cách này đảm bảo dropdown đóng chính xác 100% khi nhấn nút **決定**.
- **Đồng bộ màu sắc Active State**: Gỡ bỏ màu nền xanh đậm (`bg-blue-600 text-white`) khỏi trạng thái "được chọn" của các mục Tỉnh (都道府県), Vùng (地方) và nút 全国. Áp dụng thống nhất màu xanh nhạt (`bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`) cho tất cả. Nút **決定** ở Footer cũng được đồng bộ sang màu nhạt (`bg-blue-100`) để giao diện nhất quán.
- **Bản địa hóa Prompt lưu bộ lọc**: Thay thế chuỗi tiếng Việt `"(Ví dụ: Nhà nát Tokyo)"` trong `window.prompt` bằng tiếng Nhật chuẩn `"(例: 東京のボロ戸建て)"`.

### 2. Geocoding — Thống nhất toàn dự án về OSM Nominatim

#### Vấn đề phát hiện:
- `scrape_detail_to_db.py` (BIT Crawler) đang dùng **Gemini AI** để geocode địa chỉ — dễ hallucinate tọa độ sai mà không báo lỗi.
- Khi Gemini thất bại, code dùng **random fallback** (`lat: 42.5~44.5, lng: 141~143`) gây ra hiện tượng tài sản bị ghim ra **biển** trên bản đồ.
- `nta_parser.py` đã dùng OSM đúng cách nhưng thiếu bước validation tọa độ.

#### Giải pháp triển khai:

**`scrape_detail_to_db.py` (BIT Crawler) — Thay mới hoàn toàn:**
- Xóa hàm `geocode_address()` dùng Gemini API.
- Thêm `aggressive_clean()` — chuẩn hóa ký tự Full-width → Half-width trước khi gọi OSM.
- Thêm `get_osm_coords()` — gọi Nominatim với rate-limit 1.2 giây/request.
- Thêm `is_valid_japan_coords()` — kiểm tra biên giới hộp `lat 24~46, lng 122~154`.
- Thêm `reverse_validate_coords()` — **kiểm tra chéo** bằng cách reverse geocode để xác nhận thành phố/tỉnh trong kết quả OSM khớp với địa chỉ gốc. Dùng regex đa lớp: `m_city` (tách city khỏi tỉnh), `m_pref` (tỉnh), `m_city_bare` (city không có tỉnh đứng trước), `m_town` + `m_county` (tách town khỏi huyện 郡).
- Xóa **random fallback** → thay bằng `lat, lng = None, None` khi geocode thất bại.
- Guard `get_nearest_station_from_db()` chỉ chạy khi có tọa độ hợp lệ.

**`nta_parser.py` (NTA Crawler) — Bổ sung validation:**
- Thêm `JAPAN_BOUNDS` + `is_valid_japan_coords()`.
- Thêm `reverse_validate_coords()` cùng logic với BIT.
- Cập nhật `get_osm_coords()` truyền `original_address` vào để reverse validate.

**Scripts mới:**
- `fix_bad_coords.py` — Script chạy 1 lần: quét tất cả tài sản có `lat NULL` hoặc ngoài biên giới, geocode lại bằng OSM.
- `cleanup_property_images.py` — Script kiểm tra thư mục `property_images/`: so sánh với DB để tìm 1,275 folder ảnh ~469MB không còn liên kết (chưa xóa, để dành khi cần).

#### Kết quả fix DB thực tế (30 tài sản):
- ✅ Tọa độ đúng, giữ nguyên: **15**
- 🔧 Geocode lại thành công: **5** (gồm `小樽市`, `江別市`, `勇払郡安平町`, `白老郡白老町`, `石狩市`)
- ⚠️ Set NULL (OSM không giải được): **10** (hiện ẩn khỏi bản đồ, không còn ghim sai vị trí)

### 3. Quy tắc bắt buộc cho mọi Geocoding trong tương lai
1. **Không bao giờ dùng Gemini API để geocode** — dùng OSM Nominatim.
2. **Không bao giờ dùng random fallback** — lưu `NULL` khi thất bại.
3. **Mọi tọa độ phải qua `reverse_validate_coords()`** trước khi lưu DB để cross-check thành phố khớp địa chỉ gốc.
4. **Tài sản có `lat=NULL`** sẽ không hiển thị marker trên bản đồ — đây là hành vi đúng.

### 4. Xử lý thiếu Tỉnh (Prefecture) trong Crawler BIT
- **Vấn đề:** Dữ liệu địa chỉ chi tiết trên trang hệ thống toà án BIT thường xuyên bị thiếu Tên tỉnh (Ví dụ: `石狩市花川北二条六丁目...`). Điều này làm cả OSM Geocode bị nhầm lẫn và Frontend hiển thị thiếu chuyên nghiệp.
- **Giải pháp áp dụng:** Cả `advanced_crawler.py` và các script crawler tương ứng **không được suy luận Tỉnh qua Toà án**. Thay vào đó, ngay tại parameter cào mỗi Tỉnh (vòng lặp đã có sẵn `pref_name`), logic bóc tách sẽ tự động chèn `prefecture` vào đầu chuỗi `address_raw` ngay sau khi trích xuất và TRƯỚC KHI tiến hành geocoding hay lưu Database. 
- *Ví dụ code chuẩn:* `if address_raw != "Unknown" and not address_raw.startswith(prefecture): address_raw = prefecture + address_raw`
- **Làm sạch DB:** Đã wipe toàn bộ Database rác (30 records của code cũ) và thư mục lưu ảnh, thay bằng 20 tài sản sạch mẫu (10 BIT, 10 NTA) đã được áp dụng toàn bộ chuẩn Geocode và Tỉnh mới ở trên.
- **Tiện ích:** Đã sửa lại tupple return của hàm `get_nearest_station_from_db()` trong `crawler_utils.py` để luôn trả về độ dài 4 giá trị (kể cả khi fail trả về `None`), đồng bộ với format unpack biến trên NTA và BIT crawler tránh lỗi runtime.

### 5. Cập nhật Bắt buộc Regex Đa Lớp cho OSM Reverse Validation
- **Vấn đề (NTA Regex cũ):** `nta_parser.py` từng sử dụng Regex gộp dạng `([\u3040-\u9fff]+(?:都|道|府|県|市|区|町|村))` để bắt nguyên cả khối "Tỉnh + Thành Phố" (Ví dụ: `三重県松阪市田村町`). Tuy nhiên, do OSM Nominatim thường trả về Tỉnh và Thành Phố riêng lẻ rời rạc (Ví dụ: `松阪市` và `三重県`), việc so sánh nguyên khối sẽ bị đánh giá là KHÔNG KHỚP (`Mismatch_Reverse`) -> từ chối oan toạ độ đúng.
- **Giải pháp áp dụng thống nhất:** Yêu cầu tất cả các hàm `reverse_validate_coords()` (hiện đã được đồng bộ vào cả NTA và BIT) phải dùng cấu trúc **Regex tách rời đa lớp**:
    - `m_city`: Tách riêng cấp Thành phố/Quận.
    - `m_pref`: Tách riêng cấp Tỉnh.
    - `m_city_bare`: Fallback cho địa chỉ thuần Không có cụm Tỉnh.
    - `m_town` + `m_county`: Bóc tách riêng cấp Huyện/Thị trấn con.
- **Kết quả:** OSM đối sánh mượt mà, phân giải thành công ~60% địa chỉ tự do của NTA ra chính xác toạ độ trên mặt đất. Các trường hợp 40% thất bại đều là các trường hợp OSM sai lệch hoàn toàn địa điểm (Ví dụ: Saitama bị giải nghĩa thành Kyoto), đảm bảo bản đồ của người dùng duy trì 100% độ chính xác.

### 6. Ưu tiên Geocoding qua GSI API (Chính phủ Nhật Bản)
- **Vấn đề:** OpenStreetMap (OSM) thường thất bại với địa chỉ chi tiết cấp Chome/Ban hoặc gặp hiện tượng "ảo giác" (nhầm tỉnh này sang tỉnh khác).
- **Quy tắc mới:** Mọi quy trình Geocoding phải sử dụng **GSI API** (`msearch.gsi.go.jp`) làm **Layer 00 (Ưu tiên 1)**.
- **Fallback:** Chỉ sử dụng OSM Nominatim khi GSI không trả về kết quả.
- **Duy trì Validation:** Dù dùng GSI hay OSM, kết quả toạ độ **bắt buộc** phải đi qua `reverse_validate_coords()` để đảm bảo khớp địa chỉ logic.

### 7. Tích hợp Bản đồ Nguy cơ (Hazard Maps - GSI Tiles)
- **Dữ liệu nguồn (Mệnh lệnh Tuyệt đối):** Bắt buộc cung cấp chính xác tuyệt đối tên thư mục Raster Tiles từ API Portal của GSI để tránh gặp lỗi 404 (Không render được bản đồ):
    - Dành cho Lũ lụt (Flood): Phải dùng `01_flood_l2_shinsuishin_data` (Lưu ý: Là shinsuishin, tuyệt đối không dùng shinsuishin_ko).
    - Dành cho Sạt lở (Landslide): Phải dùng `05_dosekiryukeikaikuiki` (Lưu ý: Không dùng kikenkeiryu).
- **Cấu hình Leaflet:**
    - `maxNativeZoom={17}`: Tránh lỗi ảnh (broken tiles) khi zoom sâu quá giới hạn của GSI; Leaflet sẽ tự scale ảnh bằng CSS.
    - `keepBuffer={2}`: Tải trước các ô bản đồ xung quanh để đảm bảo kéo thả mượt mà.
    - `opacity={0.6}`: Độ trong suốt tối ưu để thấy hạ tầng bên dưới.
- **UI/UX:**
    - Menu điều khiển dạng Floating Glassmorphism, hỗ trợ Mobile (đặt tại `top: 100px` để tránh che khuất bởi thanh Tìm kiếm).
    - **Bắt buộc:** Hiển thị Bảng chú giải (Legend) bằng tiếng Nhật 100% khi bật các lớp rủi ro để người dùng hiểu mức độ nguy hiểm (ví dụ: độ sâu ngập lụt).
    - **Tách biệt hiển thị Hạ tầng:** Lớp phủ **Đường sắt (Railways)** phải được điều khiển bằng công tắc / trạng thái riêng lẻ (ví dụ: nút "路线"), không gộp chung logic với các lớp Hazard để tránh rối mắt (màu cam đỏ của đường sắt dễ nhầm với cảnh báo ngập lụt/sạt lở).
    - **Mặc định Sạch sẽ (Clean Default):** Tại mọi thời điểm khởi tạo, bản đồ bắt buộc khởi động tại trạng thái OFF hoàn toàn mọi lớp phủ (OFF Hazard, OFF Railways). Khi người dùng nhấn nút "OFF", toàn bộ layer phải bị tắt, trả lại bản đồ base.

### 8. Kiến trúc Không gian UI Bản đồ (Spatial Layout Architecture)
Để triệt tiêu tuyệt đối sự đè lấn (overlap) giữa các công cụ trôi nổi (Floating Controls) trên Bản đồ, đặc biệt trên không gian chật hẹp của thiết bị di động (Mobile), hệ thống phải tuân thủ nghiêm ngặt kỹ thuật rải trục:
- **Nguyên tắc Đồng nhất Trái-Phải (Unified L-R Layout):**
    - **Menu Điều khiển Bản đồ rủi ro (Hazard/Railway):** Bắt buộc hiển thị theo dạng cột dọc (Vertical Stack), neo vĩnh viễn ở **Góc trên Bên Phải (`top-6 right-4 lg:right-6`)** trên mọi thiết bị. Vị trí này giúp nó nằm thẳng hàng hoàn hảo với cụm nút Zoom (+/-) của bản đồ ở bên dưới.
    - Nút "Refresh Area" (tìm kiếm trong khu vực) luôn được định vị tại chính giữa phía trên bản đồ (`left-1/2 -translate-x-1/2`), nhưng trên Mobile phải hạ xuống `top-[68px]` để không đè vào thanh Search Pill.

### 9. Kiến trúc Multi-Source AI (Decoupled Queue DB) với Gemini 3.1 Flash-Lite
- **Bước 1: Extractor & WebP Optimization (Cào thô, lấy chữ, chuyển ảnh WebP):**
  - Toàn bộ luồng cào dữ liệu PDF (từ BIT và NTA) luôn tải PDF về máy.
  - **Tối ưu WebP:** Hình ảnh trích ra từ PDF được module Pillow tự động nén xuống định dạng `.webp` phân giải cao, tiết kiệm dung lượng Disk. Cấm dùng PNG/JPG dung lượng lớn cho Thumbnail ảo.
  - Nếu mục tiêu là `["戸建て", "マンション"]`, chữ trong PDF được ép sang chuỗi string lưu vào cột `raw_text` của Database (State `PENDING_AI`). Nếu là loại nhà đất khác thì bỏ qua việc rút text (`SKIPPED_AI`).
- **The Purge Policy (Xóa File Rác Sinh Tồn):**
  - Rất quan trọng: Bất kể thuộc nhóm tài sản nào, ngay sau khi bào xong Text và Hình, MỌI FILE PDF phải bị xoá chết bằng `os.remove()` khỏi Storage Local. Dự án cấm tích trữ PDF vật lý.
- **Bước 2: Hệ thống chạy ngầm AI Worker (Chống chết Crawler):**
  - Crawler đứt gãy kết nối với Gemini hoàn toàn. Lỗi API 429 hay Rate Limit của Google không còn ảnh hưởng quá trình cào thông tin của web.
  - `process_ai_queue.py` móc DB tuần tự 50 item `PENDING_AI` mỗi chu kỳ và nạp Single Key `.env` (Bỏ cơ chế Round-robin lỗi thời). Model áp dụng: `gemini-3.1-flash-lite-preview` cực nhanh. Tự động gom thêm **Giá khởi điểm (Starting Price)** và **Loại tài sản** nhúng vào hệ thống nhận diện AI (Context Injection) làm mốc tham chiếu so sánh chuẩn xác.
- **Biên Dịch Đa Ngôn Ngữ Tức Thời & Định dạng Object JSON 4-Tầng:**
  - Prompt hệ thống gọi API bắt bẻ cực nghiêm ngặt: Buộc Gemini xuất mảng JSON chứa 3 bộ Key ngôn ngữ độc lập `ja` (Nhật), `en` (Anh), và `vi` (Việt).
  - Thu hẹp thông tin thành một Mảng chính để hiển thị, gồm: 1) Cảnh báo Rủi ro Ràng buộc. 2) Ước tính Chi Phí Mềm phải trả (Đóng bù trễ thuế). 3) Gợi ý Giá Trúng Thầu (Winning Price). 4) Chỉ số %ROI (Lợi suất vs Giá khởi điểm).
  - **Quy định Đơn vị Đồng bộ:** Đối với mọi con số liên quan đến kinh tế như Giá dự đoán, tiền phí bảo trì, Lợi nhuận dự tính, SYSTEM_PROMPT bắt buộc format trả về nguyên thủ **Yên Nhật JPY** (vd: 5000000 thay vì số lượng triệu kiểu 5 hay 15).
- **Quy tắc Hiển thị Trạng thái AI phía Frontend (Rendering Logic):**
  - **Normalization:** Luôn `.trim()` và `.toUpperCase()` cho `ai_status` và `property_type` trước khi kiểm tra điều kiện để tránh lỗi khoảng trắng/encoding từ DB.
  - **Priority 1 (PENDING_AI):** Hiển thị Spinner tím nhấp nháy kèm thông điệp "AI đang phân tích tài liệu...". Đây là trạng thái ưu tiên cao nhất.
  - **Priority 2 (SKIPPED_AI):** Nếu `ai_status === 'SKIPPED_AI'` hoặc `property_type` không thuộc nhóm hỗ trợ (戸建て/マンション) hoặc không có dữ liệu JSON: Hiển thị bảng thông báo mờ (Disabled UI) kèm lý do "Tài sản không thuộc phạm vi phân tích".
  - **Priority 3 (COMPLETED_AI):** Khi có dữ liệu JSON chuẩn, render hệ thống 4-Card mượt mà hỗ trợ chuyển đổi 3 ngôn ngữ tức thì.
- **Tối ưu hóa Tài nguyên Image:**
  - Mọi ảnh bóc tách từ PDF Crawler phải được chuyển sang định dạng `.webp` (chất lượng 85) trước khi lưu.
  - Cập nhật URL ảnh trong Database phải phản ánh đúng đường dẫn `.webp` mới.
- **Lightbox Gallery (`ImageGallery.tsx`):**
  - Ảnh trên trang chi tiết tài sản được quản lý bởi `src/components/Detail/ImageGallery.tsx`.
  - Hành vi Thumbnail Strip: Hiển thị hàng ngang dạng Snap Scroll với Hover Effect (Zoom nhẹ + icon loupe `ZoomIn`), kèm badge số thứ tự ảnh.
  - Click vào ảnh bất kỳ: Mở Lightbox Modal full màn hình với nền `bg-black/95 backdrop-blur`.
  - Lightbox hỗ trợ: Nút `X` đóng, 2 nút mũi tên điều hướng Trái/Phải, Chỉ số `N / Total`, Dot Indicator Click (chuyển thẳng).
  - Keyboard: `ArrowLeft`, `ArrowRight` lướt ảnh; `Escape` đóng Modal; ngăn scroll Body khi Modal mở.
  - Mobile: Ẩn gợi ý vận hành Keyboard, hiển thị gợi ý thao tác vuốt (スワイプ), dot indicator thu nhỏ phù hợp.
  - `z-index: 9999` để không bị che bởi các Component khác (Map, Header,...).
- **Quy chuẩn Định dạng Giá tiền (Price Format):**
  - Trên toàn bộ UI, giá tài sản được **hiển thị theo đơn vị 万円** (Man-yen), ví dụ: `1,309万円` thay vì `¥13,090,000`.
  - Logic tính: `Math.round(yen / 10000).toLocaleString('ja-JP') + '万円'`. Nếu không có giá thì hiển thị `未定`.
  - `CourtValuation.tsx`: Font kích cỡ giá = `text-2xl md:text-3xl` — cùng cấp với ngày Deadline để cân đối layout.

### 10. Hệ thống Xác Thực Người Dùng (NextAuth.js)
- **Tích hợp:** Ứng dụng quản lý xác thực bằng `@auth/prisma-adapter` kết nối với hệ thống `NextAuth`.
- **Cấu hình Bắt buộc (`.env`):**
  - Cần khai báo biến `NEXTAUTH_SECRET` (khóa mã hóa) và `NEXTAUTH_URL` (URL gốc, VD: `http://localhost:3001`).
  - Google: `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.
- **Luồng Đăng Nhập (Login Flow):**
  - Component `SignupModal.tsx` không dùng Mock alert mà trực tiếp gọi hàm `signIn('google')` để chuyển hướng sang Google OAuth.
- **Quy chuẩn Hình Ảnh (Next Image Domains):**
  - Do `next/image` có tính năng bảo mật hostname chặt chẽ, phải đưa các domain chứa Avatar đăng nhập của user vào whitelist trong `next.config.ts`.
  - Bắt buộc khai báo `lh3.googleusercontent.com` (Google Avatar) và `profile.line-scdn.net` (LINE Avatar) mục `images.remotePatterns` để tránh lỗi HTTP 400 (Invalid src prop).

### 11. Hệ thống Dashboard & Favorite (Hybrid Storage)
- **Kiến trúc Dashboard Tối Giản (`/dashboard`):** 
  - Giao diện loại bỏ tính năng Ghi chú, chỉ lưu lại Thẻ thông tin khách hàng (Avatar, Email) và nhãn Gói cước (`無料プラン`).
  - Danh sách tài sản Hiển thị Layout Grid. Nếu tài sản bị xóa khỏi cơ sở dữ liệu gốc (NULL), Frontend tự động hiển thị "Tài sản bị gỡ" kèm tính hiệu cảnh báo. Không tự động làm bốc hơi tài sản trước mặt user.
- **Luật Giới hạn Thả tim (Favorite Limits):**
  - Hệ thống sử dụng Hybrid Storage để vừa hỗ trợ Guest vừa đồng bộ Server.
  - **Khách chưa đăng nhập (Guest):** Dữ liệu thả tim lưu vào `localStorage` key `keibai_favorites`. Giới hạn: **Tối đa 5 tài sản**. Chạm mốc 5 tài sản sẽ bị Block và hiện `SignupModal` yêu cầu Đăng nhập.
  - **Khách đã đăng nhập (User - Miễn phí):** Dữ liệu được gọi vào Server Action (`addFavorite`, `removeFavorite`). API Route trả về `string[]` UUID Favorites để đồng bộ SWR phía Frontend. Giới hạn: **Tối đa 20 tài sản**. Vượt mức sẽ hiển thị Modal cảnh báo vượt giới hạn bộ nhớ của gói Miễn phí.
- **Auto Sync Migration (Chuyển Nhà Ngầm):**
  - Khi một Guest đăng nhập thành công (State `authenticated`), hệ thống tự động kiểm tra `localStorage`. Nếu có chứa tài sản, nó sẽ đóng gói gửi qua luồng API `/api/favorites/sync` để chèn hàng loạt (Bulk Import) vào Database thật của NextAuth.
  - Sau khi chèn thành công, `localStorage` bị xóa sạch để tránh rác lặp lại, và SWR tự động `mutate()` để đếm lại số lượng Yêu thích chính xác. Toàn bộ trải nghiệm hoàn toàn mượt mà.
- **Thiết kế Nút Trái Tim (Favorite Button):**
  - Nút Trái tim là Component duy nhất được dùng để Thêm / Hủy (kể cả trong danh sách Dashboard, không dùng Nút Xóa 'X' thừa thãi). Dù có là thẻ "Dead Property" cũng sẽ nhúng Trái tim này để người dùng bấm hủy bỏ.
  - **Trên Trang Chi tiết (Detail Page):** Nút Trái tim được gắn cố định vào `StickyActionBar`. 
    - Trên **Mobile**: Tự động nhóm vào cụm Bên Trái màn hình cùng với nút Back (`[← リストへ戻る] [❤️]`) để thân thiện với ngón cái.
    - Trên **Desktop**: Nép vào cụm Bên Phải màn hình và nằm sát trước mã số Tài sản `物件番号` để tạo cảm giác cân xứng. Đạt mục đích luôn hiển thị dọc hành trình người dùng cuộn xem thông tin.

### 12. Kiến trúc Tự động hoá Crawler & Hạ tầng AWS Server
Hệ thống thu thập dữ liệu (Crawler) đã trải qua giai đoạn chuyển mình trên Server nội bộ Nhật Bản, tuân thủ nguyên tắc "Tiết kiệm triệt để & Hoạt động âm thầm".

- **Hạ tầng Cloud (AWS EC2 Tokyo):** 
  - Đã đóng gói qua script cài đặt `setup_aws_server.sh` tự động cấu hình **Python 3.12**, **Docker**, và **Headless Chromium** hoàn chỉnh cho AWS. 
  - Toàn bộ Private Key (`*.pem`) phục vụ kết nối đã bị nhốt triệt để khỏi Version Control.
- **Vòng tuần hoàn Cron 2AM (JST):**
  - Mọi kịch bản (`advanced_crawler.py`, `nta_parser.py`, `crawl_all_japan_results.py`, và `process_ai_queue.py`) được chuỗi hóa thông qua `run_daily.sh`. Kích hoạt đúng 02:00 sáng mỗi ngày.
  - Gắn kèm cơ chế **Timeout tự sát (30m)** cho AI Queue để nhường tài nguyên và không cướp Memory của máy chủ làm treo tiến trình khác.
  - Sau mỗi chu kỳ/sự cố, tự động chích xuấtt log gửi trạng thái thẳng vào **Telegram Bot** (`nani nani`) báo cáo realtime.
- **Tiêu chuẩn Fast Scan (Memory Cache Deduplication O(1)):** Cấm tuyệt đối Crawler Playwright tải trang chi tiết nếu không thực sự cần thiết, đồng thời bỏ luôn cơ chế truy vấn DB (Batch SQL Lookup) mỗi trang. 
  - Toàn bộ crawler (`advanced_crawler.py`, `nta_parser.py`, `crawl_all_japan_results.py`) BẮT BUỘC phải Load cấu trúc Mảng toàn bộ ID tài sản theo Tỉnh (hoặc Toàn Web) đang ở trạng thái `ACTIVE` vào một biến trên RAM (Memory Cache) ngay lần chạy đầu. 
  - Giao diện List bị tiêm mã javascript (`page.evaluate`) đi cào ID và Giá để tham chiếu lên RAM. Việc thêm/bớt hay cập nhật giá nay chỉ truy cập Database nếu có sự khác biệt rõ trong Cache.
- **Set Difference Ghost Sweep (Tối Ưu Update Rớt Mạng):**
  - Nghiêm cấm kiểu Update chạy hai chiều tốn kém tài nguyên (Treo `CHECKING` để quét, rồi update về `ACTIVE`).
  - Crawler lấy `Set(Memory Cache)` trừ đi `Set(Tài Sản Web Cào Được)` ở bộ nhớ trong Python để ra được những Tài sản đã bị Gõ bỏ khỏi trang Đấu thầu. Tiến hành cập nhật bằng một Query Batch DUY NHẤT để tiễn Record sang `ARCHIVED`.
- **Chính sách "Append-Only" cho mảng Kết Quả Đấu Giá Lịch Sử:** 
  - Riêng với `crawl_all_japan_results.py` cào Kết quả trong quá khứ, dữ liệu chỉ mang tính chất cào để LƯU TRỮ VĨNH VIỄN, hoàn toàn không có định nghĩa `Ghost Sweep` hay `ARCHIVED`. Mục đích là làm phình Database tăng data raw quý giá. Tiến trình sử dụng Memory Caching chỉ nhằm bỏ qua không cào lại/không Geocode tốn tiền.
- **Bảo mật Lẩn Trốn Hệ Thống Máy Chủ Bán Đấu Giá (Anti-Ban Evasion):**
  - Áp đặt công cụ **Rotate User-Agent** (Chuyển đổi Random Trình Duyệt ngẫu nhiên Safari/Chrome/Firefox + OS). Tránh lộ danh tính Automation của Playwright.
- **Lưới Lọc Nước Thải Kết Quả Đấu Giá:** 
  - Buộc chèn chốt chặn `address_raw` vào các kịch bản kết quả báo cáo (`crawl_all_japan...`). Các Properties báo danh `Unknown`, `不明`, v.v... vĩnh viễn không được Update vào Database để tránh làm bẩn UI.

---

## 📋 Nhật Ký Thay Đổi — Phiên Làm Việc 2026-04-11

### 1. Cải thiện bộ lọc ảnh BIT từ PDF (`advanced_crawler.py` & `scrape_detail_to_db.py`)

#### Vấn đề gốc:
- Phương pháp cũ sử dụng `pdf_page.get_images()` trích xuất Image XObject bị thiếu sót nhiều ảnh do các Tòa án sử dụng kỹ thuật in ảnh trực tiếp (inline image) vào Stream của trang PDF.
- PDF của BIT thường dài tới 30-40 trang nhưng Crawler cũ lại giới hạn chỉ quét `min(15)` trang đầu tiên, dẫn đến việc đánh mất toàn bộ ảnh chụp (thường nằm ở cuối file - trang 35, 36).

#### Giải pháp đúng áp dụng:
Theo như yêu cầu "Lọc bỏ toàn bộ sơ đồ/văn bản đen trắng, chỉ lấy hình ảnh có màu sắc", cơ chế hiện tại đã được thiết kế lại tối giản và đạt hiệu quả tối đa:
- **Duyệt toàn bộ File PDF:** Bỏ vòng lặp `min(15)`. Bot giờ đây duyệt từ đầu đến cuối không chừa trang nào.
- **Phân tách Màu Sắc qua Độ phân giải nhỏ:**
  - Để tiết kiệm RAM, mỗi trang trước tiên được render ở kích thước siêu nhỏ `fitz.Matrix(1, 1)` và giảm nhẹ (resize `150x150`).
  - Đếm tổng lượng điểm ảnh có biên độ dao động màu đủ mạnh (`max(R,G,B) - min(R,G,B) > 20`).
- **Bộ Lọc Màu Tối Thượng (`color_ratio`):**
  - Nếu tỷ lệ điểm ảnh khác màu so với toàn bức đạt ngưỡng `> 1.5%` (`0.015`), trang đó chắc chắn chứa ít nhất một hình ảnh thực tế được chụp nhạy sáng.
  - Sơ đồ đen trắng, bản vẽ mặt bằng CAD (dù đậm nét) hay các trang chữ dài đều cho tỷ lệ `< 0%` hoặc `~ 0.5%` nên sẽ **Bị vứt bỏ hoàn toàn**.
- **Kết xuất bản nét:** Chỉ những trang nào vượt qua "khe cửa hẹp" `> 1.5%` rực rỡ thì mới được đem đi render full trang với ma trận siêu nét `DPI 200` và xuất ra `.jpg` thẳng lên web.

### 2. Cải thiện nút đóng Lightbox (`ImageGallery.tsx`)

- Nút X đóng được nâng cấp: thêm border rõ ràng, background tối hơn, padding lớn hơn
- Desktop: thêm text label **"閉じる"** bên cạnh icon X để người dùng nhận biết ngay
- Mobile: gộp hint area dưới cùng thành 1 container dọc, thêm **"タップして閉じる"** thay thế gợi ý vuốt cũ
- Dot indicator được gộp vào container chung với hint text

### 3. Auth-gate cho nút ❤️お気に入り trong Header (`HeaderFavLink.tsx`)

- Chuyển từ `<Link>` đơn thuần sang component có `onClick` handler
- Khi user **chưa đăng nhập** bấm vào お気に入り → hiển thị `FavAuthModal` (modal inline) thay vì redirect không có phản hồi
- `FavAuthModal` dùng `createPortal` vào `document.body`, z-index 9999, cùng design với `SignupModal.tsx`
- Nội dung modal: "お気に入りを確認するには" + nút Google Login + nút 閉じる
- Khi **đã đăng nhập** → behavior không thay đổi, Link điều hướng bình thường đến `/dashboard`
- `signIn` function được import trực tiếp từ `next-auth/react` ở top-level (không dùng dynamic require)

---

## 📋 Nhật Ký Thay Đổi — Phiên Làm Việc 2026-04-12

### 1. Nâng cấp Thẩm định Giá theo Diện tích (Area-Based Valuation)
- **Vấn đề:** Việc tính "Giá thị trường" trước đây chỉ lấy giá trị trung bình nguyên khu vực (ví dụ 1,264万円 chung cho cả nhà 100m² lẫn nhà 1500m²) gây sai lệch.
- **Giải pháp:** Áp dụng công thức Thẩm định giá đa biến: Lấy hệ số `avgPricePerSqm` (Đơn giá/m²) từ bộ dữ liệu Chính phủ (MLIT) nhân với `propertyArea` (Diện tích thực tế của tài sản) ngay trong component `MarketValuation.tsx`. Tức là: `Thị giá = Đơn giá m² × Diện tích m²`.
- **Hiển thị minh bạch:** Bổ sung phụ đề giải thích công thức dưới con số định giá: `市場単価 × 物件面積(1,500㎡)` để người dùng hiểu nguồn gốc con số.
- **Biểu đồ Xử lý Lỗi Tầm Nhìn UX:** Chỉnh sửa thuộc tính `margin.left` của `AreaChart` (từ -20 thành 10) để tránh nội dung trục Tung (Giá) bị khuất. Gắn thêm biến `avgArea` vào Tooltip để khi rê chuột tới đâu, hiện rõ "Diện tích tương đương" của các giao dịch trong năm đó (VD: `面積: 約243㎡`).

### 2. Trích xuất Diện tích m² Offline (No-AI Fallback)
- **Trở ngại của AI:** Phụ thuộc vào AI bóc tách diện tích vào DB (`property.area`) thường phải chờ Queue trễ (`PENDING_AI`) rất lâu khi Crawler quét hàng trăm mẫu, làm kẹt màn hình Thẩm định do chưa có số liệu nhân Diện tích m².
- **Thực thi:** Tạo Regular Expression (Regex) tiện ích `extractTotalArea` bắn thẳng vào trường JSON lưu trữ vĩnh viễn `raw_display_data` ngay khi render Component/Server Action, cho phép lốc ra được chuẩn xác diện tích ngay giây đầu tiên sau khi Crawl xong.

### 3. Tối Năng Lọc Loại Tài Sản Đối Kháng MLIT
- Vì dữ liệu Bất động sản MLIT (XIT001/002) chỉ cung cấp nền tảng số liệu dân sinh, việc dùng MLIT áp giá cho Nhóm Nông Nguyệt (`農地`), hay Cửa Hàng (`店舗`) là rác phi thực tế. Hệ thống chỉ cho phép Module **Thị Giá Tương Đương MLIT** xuất hiện và tính toán trên 3 đối tượng chuẩn xác: `[戸建て, マンション, 土地]`.

### 4. Mồi Chài Tương Tác 投資ギャップ lên Trang Chủ (In-Memory Join)
- **Yêu cầu UI Clickbait:** Kéo con số chênh lệch lợi nhuận Thẩm định `📈 投資ギャップ +93.0%` cực kỳ hấp dẫn từ trang Chi tiết ra thẳng thẻ hiển thị dạng List ngoài Trang chủ để kích thích lượt Click.
- **Vấn đề chống quá tải (Rate-limit Prevention):** Trang chủ render đồng thời 50 Properties, nếu gọi trực tiếp hàm fetch MLIT API cho tất cả sẽ gây nổ Request Timeout/429.
- **Kiến trúc Bắt Chéo (In-Memory Database Join):** Trong quá trình Server biên dịch danh sách ở `propertyActions.ts`, viết lệnh gọi DB Prisma tĩnh truy cập đúng bảng `MlitMarketCache` (với mã code Resolver thành phố đã lưu sẵn). Cắt bỏ 100% mọi đường Ext-Fetch gọi điện ra khỏi Server. Hệ thống tính toán Gap lợi nhuận an toàn và phun biến `mlitInvestmentGap` kèm vào Object thẻ.
- **Vị trí Layout Card UI:** Huy hiệu được dùng CSS Flexbox (`justify-between`) bấu neo dính vào vị trí **Góc phải trên cùng** nằm ngang hàng với tên Toà án thay vì đặt lộm cộm ở gốc đáy khung giá, duy trì khoảng thở (Breating Space) tốt cho khối lượng Content nặng. Huy hiệu sẽ tự Tàng hình khi lợi nhuận rỗng hoặc bé hơn (Âm) cực mượt mà.

### 5. Khởi Tạo Trang Độc Lập Tra Cứu Giao Dịch MLIT (`/trade/find`)
- **Tối ưu UX Liền mạch (Cross-Navigation):** Tại khu vực Thống kê `周辺の取引事例` của màn hình Chi tiết Bất động sản, đã cài đặt một nút Call-to-Action "全取引事例を見る ↗" siêu nổi bật bằng màu Xanh Indigo đặc trưng, hỗ trợ mở thẳng ra Tab Mới (`_blank`). 
- **Zero-click Fetch:** Khi bấm nút CTA, hệ thống sẽ tự động ghim chuỗi Parameters (Ví dụ: `?pref=北海道&city=北斗市&type=戸建て`) truyền thẳng sang Router `/trade/find`. 
- **Màn hình TradeFind:** Server Components NextJS sẽ tóm dính Query và bung Data gốc 100% không đỗ trễ. Bảng tìm kiếm trái (`TradeSearchForm`) tích hợp regex bóc tách Tỉnh và Thành Phố từ chuỗi Nhập tự do (Free Text) thông minh. Danh sách giao dịch được chia khối phân trang ngăn nắp, hiển thị mọi thông số chi tiết của giao dịch.

### 6. Kiến Trúc Radar 2 Biểu Đồ (Ultimate 2-Chart Suite)
- Khước từ cách làm dư thừa sao chép đối thủ, hệ thống áp dụng Trạng thái tinh gọn với 2 Biểu đồ Thống kê đỉnh cao từ kĩ thuật Recharts:
- **Biểu đồ Cột Địa Giá Suy Di (地価推移):** Khác biệt với đối thủ dùng 40 năm nhiễu loạn, hệ thống của ta chỉ gọi Promise List chạy chốt **5 năm gần nhất (2019-2023)** nhằm cho ra đường xu hướng đầu tư thực tiễn và tải cực mượt.
- **Biểu đồ Phân tán Giá - Diện tích (取引履歴 - Scatter Chart):** Quy hoạch thông minh ánh xạ giao dịch. Mọi điểm tròn hiển thị theo toạ độ Diện Tích m² (Trục X) và Mức gía Yên (Trục Y).

### 7. Tối Ưu Hóa Data Scale Lớn & Chuẩn Hoá Pháp Lý
- **Trục Y (YAxis) Recharts Cut-off:** Khắc phục lỗi những bất động sản trăm tỷ (hơn triệu vạn yên) làm tràn rìa độ rộng Label. Đã kéo giãn thuộc tính width lên `60px` cho trục Tung, kết hợp quy chuẩn tính toán chia cho 10,000 để toàn bộ hiển thị chuẩn mực ở hệ đo lường `Man Yen (万円)`.
- **Cập nhật Nguồn Liên Kết Mở:** Bắt kịp nâng cấp API mới của Chính phủ Nhật. Toàn bộ các Hyperlink Pháp lý `出典：国土交通省地価公示` đã được cập nhật đường dẫn từ Webland cũ sang Cổng Địa Giá Mới Nhất: `https://www.reinfolib.mlit.go.jp/landPrices/`.

### 8. Lõi Technical SEO Kép & Khai Báo Schema BĐS (JSON-LD)
- Thiết lập Hệ sinh thái `Dynamic Metadata` cho toàn bộ trang `/property/[id]`. Hệ thống tự động sinh ra Title và Meta Description chắt lọc chính xác Giá tiền `(X円)` và Địa chỉ của Bất động sản, nâng cao khả năng cạnh tranh trên Google Search.
- Gắn thẻ mã phân mảnh `JSON-LD Schema` mang thuộc tính `RealEstateListing` và `Offer`. Biến toàn bộ trang chi tiết tài sản thành định dạng Rich Snippet, giúp Bot Google hiểu cặn kẽ mức giá và tình trạng của ngôi nhà.

### 9. Cỗ Máy Định Tuyến Crawler (Auto Sitemap & Robots.txt)
- Lập trình hệ thống tự động gen URL bằng File `sitemap.ts` thuần tuý của NextJS Server Component.
- Tự động gọi DB Prisma lôi 10,000 tài sản Mới nhất (Active) để vứt vào URL Map. Chế độ ưu tiên quét (ChangeFrequency: daily) cho phép Google thu thập được các tài sản Đấu giá ngay khi vừa xuất hiện. Đính kèm chặn định tuyến `/api` & `/dashboard` qua `robots.ts`.

### 10. Chiến Lược Programmatic SEO Độc Tôn (Auto Landing Pages)
Áp dụng chiến lược Phễu hút Traffic thông qua Hành vi Cốt lõi của Ngành BĐS Nhật Bản để sinh ra Hàng Vạn Trang Landing Page tự động hoàn toàn:
- **Router SEO Khu Vực (Administrative Area):** `app/search/area/[prefecture]/[city]`. Đón đầu hành vi Search `"Đấu giá + Tên Tỉnh, Thành Phố"`.
- **Router SEO Tuyến Tàu Điện / Ga Tàu (Train Router):** `app/search/station/[line]/[station]`. Đón đầu tập khách hàng mua nhà đi làm cực kỳ khổng lồ qua ngách `"Tên nhà ga + Đấu giá"`. Hệ thống hoàn toàn tự động lấy Keyword trên URL để Query xuống Prisma và Gen ra Component `PropertyCard` chuẩn xác không cần sức người.
