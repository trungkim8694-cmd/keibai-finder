#!/usr/bin/env bash
# ==============================================================================
# Keibai Finder - Daily Master Crawler Pipeline (VPS Production)
# ==============================================================================
# Tự động thực thi toàn bộ quy trình cào dữ liệu hàng ngày trên VPS:
# 1. Chống chạy đè tiến trình bằng file lock (flock)
# 2. Rà quét Tòa án BIT (advanced_crawler.py)
# 3. Rà quét Thuế quốc gia NTA (nta_parser.py)
# 4. Thẩm định giá MLIT (mlit_calculator.py)
# 5. Dọn dẹp ảnh mồ côi (cleanup_property_images.py)
# 6. Viết bài tin tức AI SEO hàng ngày (ai_seo_writer.py)
# 7. Xóa đệm Edge Cache Next.js (Revalidation API)
# 8. Báo cáo trực tiếp tình trạng qua Telegram
# ==============================================================================

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_FILE="/tmp/keibai_daily_crawler.lock"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

TODAY="$(date +'%Y-%m-%d')"
LOG_FILE="$LOG_DIR/daily_crawler_${TODAY}.log"

# Đảm bảo chỉ 1 tiến trình chạy tại một thời điểm
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️ Tiến trình Crawler hàng ngày đang chạy ở phiên làm việc khác. Bỏ qua lượt này." >> "$LOG_FILE"
    exit 0
fi

# Chuyển hướng stdout & stderr vào file log và terminal
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================================================="
echo "🚀 [KEIBAI VPS] KHỞI ĐỘNG TIẾN TRÌNH CÀO DỮ LIỆU HÀNG NGÀY: $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo "=============================================================================="

# 1. Nạp virtualenv Python
VENV_PATH=""
if [ -d "$PROJECT_ROOT/venv" ]; then
    VENV_PATH="$PROJECT_ROOT/venv"
elif [ -d "$SCRIPT_DIR/venv" ]; then
    VENV_PATH="$SCRIPT_DIR/venv"
elif [ -d "$PROJECT_ROOT/.venv" ]; then
    VENV_PATH="$PROJECT_ROOT/.venv"
fi

if [ -n "$VENV_PATH" ]; then
    echo "🐍 Kích hoạt môi trường ảo: $VENV_PATH"
    # shellcheck source=/dev/null
    source "$VENV_PATH/bin/activate"
else
    echo "⚠️ Không tìm thấy thư mục venv, sử dụng python3 hệ thống: $(which python3)"
fi

# 2. Nạp biến môi trường từ web/.env và web/.env.local
cd "$SCRIPT_DIR"
ENV_LOADED=false
if [ -f "$PROJECT_ROOT/web/.env" ]; then
    echo "📄 Nạp biến môi trường: $PROJECT_ROOT/web/.env"
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "$PROJECT_ROOT/web/.env" | grep -v '^[[:space:]]*$')
    set +a
    ENV_LOADED=true
fi

if [ -f "$PROJECT_ROOT/web/.env.local" ]; then
    echo "📄 Nạp bổ sung biến môi trường: $PROJECT_ROOT/web/.env.local"
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "$PROJECT_ROOT/web/.env.local" | grep -v '^[[:space:]]*$')
    set +a
    ENV_LOADED=true
fi

if [ "$ENV_LOADED" = false ]; then
    echo "❌ Không tìm thấy file .env hoặc .env.local trong $PROJECT_ROOT/web!"
fi

# Biến đếm lỗi
ARCHIVE_STATUS="Thành công ✅"
BIT_STATUS="Thất bại ❌"
NTA_STATUS="Thất bại ❌"
NTA_RES_STATUS="Bỏ qua ⏭️"
KSI_STATUS="Bỏ qua ⏭️"
MOF_STATUS="Bỏ qua ⏭️"
MLIT_STATUS="Bỏ qua ⏭️"
SEO_STATUS="Bỏ qua ⏭️"
CACHE_STATUS="Chưa chạy ⏳"

# 2.5. Bước 0: Tự động lưu trữ (Archived) các tài sản đã quá hạn đấu giá (bid_end_date < NOW())
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 0: Tự động chuyển đổi tài sản hết hạn sang ARCHIVED..."
echo "------------------------------------------------------------------------------"
python3 -c "
import os, psycopg2
db_url = os.environ.get('DATABASE_URL')
if db_url:
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute('''
            UPDATE \"Property\"
            SET status = 'ARCHIVED', updated_at = NOW()
            WHERE status = 'ACTIVE' AND bid_end_date < NOW();
        ''')
        conn.commit()
        print(f'✅ Đã lưu trữ thành công {cur.rowcount} tài sản đã hết hạn đấu giá.')
        cur.close()
        conn.close()
    except Exception as e:
        print(f'⚠️ Lỗi tự động lưu trữ tài sản: {e}')
else:
    print('⚠️ Không tìm thấy DATABASE_URL để tự động archive!')
"

# 3. Bước 1: Cào Tòa Án BIT
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 1/5: Chạy BIT Crawler (advanced_crawler.py)..."
echo "------------------------------------------------------------------------------"
rm -f "$SCRIPT_DIR/advanced_crawler_state.json"
if python3 advanced_crawler.py --force; then
    BIT_STATUS="Thành công ✅"
    echo "✅ BIT Crawler hoàn thành thành công."
else
    echo "❌ BIT Crawler gặp sự cố!"
fi

# 4. Bước 2: Cào Thuế Quốc Gia NTA
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 2/6: Chạy NTA Crawler (nta_parser.py)..."
echo "------------------------------------------------------------------------------"
if python3 nta_parser.py; then
    NTA_STATUS="Thành công ✅"
    echo "✅ NTA Crawler hoàn thành thành công."
else
    echo "❌ NTA Crawler gặp sự cố!"
fi

# 4.5. Bước 2b: Cào Kết quả Công bán NTA (scrape_nta_results.py)
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 2b/6: Chạy NTA Results Crawler (scrape_nta_results.py)..."
echo "------------------------------------------------------------------------------"
if python3 scrape_nta_results.py; then
    NTA_RES_STATUS="Thành công ✅"
    echo "✅ NTA Results Crawler hoàn thành thành công."
else
    NTA_RES_STATUS="Thất bại ❌"
    echo "❌ NTA Results Crawler gặp sự cố!"
fi

# 4.6. Bước 2c: Chạy KSI Crawler (官公庁公売 - ksi_crawler.py)
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 2c: Chạy KSI Crawler (ksi_crawler.py)..."
echo "------------------------------------------------------------------------------"
if python3 ksi_crawler.py; then
    KSI_STATUS="Thành công ✅"
    echo "✅ KSI Crawler hoàn thành thành công."
else
    KSI_STATUS="Thất bại ❌"
    echo "❌ KSI Crawler gặp sự cố!"
fi

# 4.7. Bước 2d: Chạy Kokuyu Crawler (国有財産売却 - kokuyu_crawler.py)
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 2d: Chạy Kokuyu Crawler (kokuyu_crawler.py)..."
echo "------------------------------------------------------------------------------"
if python3 kokuyu_crawler.py; then
    MOF_STATUS="Thành công ✅"
    echo "✅ Kokuyu Crawler hoàn thành thành công."
else
    MOF_STATUS="Thất bại ❌"
    echo "❌ Kokuyu Crawler gặp sự cố!"
fi

# 5. Bước 3: Thẩm định giá MLIT
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 3/5: Chạy Thẩm định giá MLIT (mlit_calculator.py)..."
echo "------------------------------------------------------------------------------"
if python3 mlit_calculator.py; then
    MLIT_STATUS="Thành công ✅"
    echo "✅ Thẩm định giá MLIT hoàn thành."
else
    MLIT_STATUS="Thất bại ❌"
    echo "❌ Thẩm định giá MLIT gặp lỗi!"
fi

# 6. Dọn dẹp ảnh thừa
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 Dọn dẹp ảnh mồ côi (cleanup_property_images.py)..."
echo "------------------------------------------------------------------------------"
python3 cleanup_property_images.py --delete || echo "⚠️ Dọn dẹp ảnh gặp lỗi nhưng tiếp tục tiến trình."

# 7. Bước 4: Viết bài báo AI SEO
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 4/5: Chạy AI SEO Writer (ai_seo_writer.py)..."
echo "------------------------------------------------------------------------------"
if python3 ai_seo_writer.py; then
    SEO_STATUS="Thành công ✅"
    echo "✅ AI SEO Writer đã tạo bài báo mới."
else
    SEO_STATUS="Thất bại ❌"
    echo "❌ AI SEO Writer gặp lỗi!"
fi

# 8. Bước 5: Revalidate Cache Webhook
echo ""
echo "------------------------------------------------------------------------------"
echo "👉 BƯỚC 5/5: Xóa bộ đệm Cache Next.js (Revalidation)..."
echo "------------------------------------------------------------------------------"
FRONTEND_TARGET="${FRONTEND_URL:-http://localhost:3000}"
WEBHOOK_KEY="${WEBHOOK_SECRET:-keibai_super_secret_4am}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $WEBHOOK_KEY" \
    "$FRONTEND_TARGET/api/revalidate-cache" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    CACHE_STATUS="Đã revalidate thành công (HTTP 200) ✅"
    echo "✅ Edge Cache Revalidation thành công."
else
    CACHE_STATUS="Không phản hồi hoặc lỗi (HTTP $HTTP_CODE) ⚠️"
    echo "⚠️ Revalidation trả về mã HTTP: $HTTP_CODE"
fi

# 9. Gửi báo cáo Telegram
echo ""
echo "=============================================================================="
echo "📢 GỬI BÁO CÁO TELEGRAM TỔNG KẾT TIẾN TRÌNH..."
echo "=============================================================================="
if [ -f "telegram_notify.py" ]; then
    JST_TIME="$(TZ='Asia/Tokyo' date +'%Y-%m-%d %H:%M JST')"
    REPORT="🏠 <b>Keibai Finder - VPS Daily Crawler Report</b>%0A📅 $JST_TIME%0A1️⃣ Toà án BIT (Đang mở): $BIT_STATUS%0A2️⃣ Thuế Quốc gia NTA (Đang mở): $NTA_STATUS%0A3️⃣ Kết quả NTA (Đã đấu giá): $NTA_RES_STATUS%0A4️⃣ Công bán KSI (官公庁公売): $KSI_STATUS%0A5️⃣ Tài sản Quốc hữu MOF (国有財産): $MOF_STATUS%0A6️⃣ Thẩm định giá MLIT: $MLIT_STATUS%0A7️⃣ Bản tin AI Insights: $SEO_STATUS%0A8️⃣ Bộ đệm Next.js: $CACHE_STATUS"
    python3 telegram_notify.py "$REPORT" || echo "⚠️ Không thể gửi thông báo Telegram."
fi

echo "=============================================================================="
echo "🏁 TIẾN TRÌNH CÀO DỮ LIỆU VPS HOÀN TẤT LÚC: $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo "=============================================================================="

