#!/usr/bin/env bash
# ==============================================================================
# Keibai Finder - Weekly Auction Results Crawler Pipeline (VPS Production)
# ==============================================================================
# Tự động thực thi quy trình cào kết quả trúng đấu giá toàn Nhật Bản vào cuối tuần:
# 1. Chống chạy đè tiến trình bằng file lock (flock)
# 2. Cào toàn bộ kết quả trúng đấu giá (crawl_all_japan_results.py)
# 3. Gửi thông báo chi tiết qua Telegram
# ==============================================================================

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_FILE="/tmp/keibai_weekly_results.lock"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

TODAY="$(date +'%Y-%m-%d')"
LOG_FILE="$LOG_DIR/weekly_results_${TODAY}.log"

# Đảm bảo chỉ 1 tiến trình chạy tại một thời điểm
exec 201>"$LOCK_FILE"
if ! flock -n 201; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️ Tiến trình Crawler kết quả đấu giá đang chạy ở phiên khác. Bỏ qua." >> "$LOG_FILE"
    exit 0
fi

# Chuyển hướng stdout & stderr
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================================================="
echo "⚖️ [KEIBAI VPS] BẮT ĐẦU CÀO KẾT QUẢ ĐẤU GIÁ TUẦN: $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo "=============================================================================="

# 1. Kích hoạt virtualenv Python
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

# 2. Nạp biến môi trường
cd "$SCRIPT_DIR"
if [ -f "$PROJECT_ROOT/web/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "$PROJECT_ROOT/web/.env" | grep -v '^[[:space:]]*$')
    set +a
fi
if [ -f "$PROJECT_ROOT/web/.env.local" ]; then
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "$PROJECT_ROOT/web/.env.local" | grep -v '^[[:space:]]*$')
    set +a
fi

STATUS_TXT="Thất bại ❌"

echo "👉 Đang thực thi crawl_all_japan_results.py..."
if python3 crawl_all_japan_results.py; then
    STATUS_TXT="Thành công ✅"
    echo "✅ Toàn bộ kết quả đấu giá đã được cập nhật vào CSDL."
else
    echo "❌ Cào kết quả đấu giá gặp sự cố!"
fi

# 3. Gửi thông báo Telegram
if [ -f "telegram_notify.py" ]; then
    JST_TIME="$(TZ='Asia/Tokyo' date +'%Y-%m-%d %H:%M JST')"
    MSG="⚖️ <b>Keibai Finder - Weekly Results Report</b>%0A📅 $JST_TIME%0AKết quả cào đấu giá toàn quốc: $STATUS_TXT"
    python3 telegram_notify.py "$MSG" || true
fi

echo "=============================================================================="
echo "🏁 HOÀN THÀNH TIẾN TRÌNH KẾT QUẢ ĐẤU GIÁ: $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo "=============================================================================="

