-- ==============================================================================================
-- 🛡️ HIỆP ƯỚC BẢO MẬT TỐI CAO DÀNH CHO SUPABASE (KEIBAI FINDER) 🛡️
-- MỤC ĐÍCH: NGĂN KẺ GIAN (HACKER) CÀO TRỘM DỮ LIỆU ĐẤU GIÁ (SCRAPE) THÔNG QUA POSTGREST API
-- ==============================================================================================

-- BƯỚC 1: Kích hoạt màng chắn RLS (Row Level Security) cho toàn bộ các Bảng quan trọng
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuctionHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuctionSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuctionResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MlitMarketCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NtaProperty" ENABLE ROW LEVEL SECURITY;

-- BƯỚC 2: TIÊU DIỆT TẤT CẢ QUYỀN TRUY CẬP TỪ THẾ GIỚI MẠNG (ANONYMOUS APIS)
-- Hành động này sẽ khiến tất cả các Request chui thẳng vào Supabase URL trả về mảng rỗng []
-- * CHỈ CÓ NEXTJS (Prisma) và Bạn (Supabase UI) mới xem được Dữ liệu. *

-- Xóa mọi chính sách cũ nát nếu có (Tránh xung đột)
DROP POLICY IF EXISTS "Deny_All_Property" ON "Property";
DROP POLICY IF EXISTS "Deny_All_AuctionHistory" ON "AuctionHistory";

-- Tạo hàng rào Từ chối hoàn toàn (Chỉ Server Prisma mới đâm thủng được)
CREATE POLICY "Deny_All_Property" ON "Property" 
  AS RESTRICTIVE FOR ALL TO public 
  USING (false);

CREATE POLICY "Deny_All_AuctionHistory" ON "AuctionHistory" 
  AS RESTRICTIVE FOR ALL TO public 
  USING (false);

CREATE POLICY "Deny_All_AuctionSchedule" ON "AuctionSchedule" 
  AS RESTRICTIVE FOR ALL TO public 
  USING (false);

CREATE POLICY "Deny_All_AuctionResult" ON "AuctionResult" 
  AS RESTRICTIVE FOR ALL TO public 
  USING (false);

-- ==============================================
-- KẾT QUẢ: 
-- Hệ thống an toàn tuyệt đối. Kể cả bị lộ URL Supabase, Data của bạn không thể bị đánh cắp.
-- ==============================================
