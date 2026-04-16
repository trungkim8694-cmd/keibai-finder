#!/bin/bash
set -e

# Load ENV from web directory
export $(grep -v '^#' /app/web/.env | xargs)

LOG_DIR="/app/logs"
mkdir -p "$LOG_DIR"
TODAY=$(date +"%Y-%m-%d")
LOG_FILE="$LOG_DIR/crawler_$TODAY.log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=================================================="
echo "🚀 STARTING DAILY CRAWLER AT $(date)"
echo "=================================================="

# Hàm gửi Telegram báo lỗi nếu gặp sư cố
handle_error() {
    local script_name=$1
    python3 /app/crawler/telegram_notify.py "⚠️ <b>Crawler THẤT BẠI</b> tại <code>$script_name</code> lúc $(date +'%H:%M JST')\nVui lòng kiểm tra log trên máy chủ AWS."
    exit 1
}

source /app/venv/bin/activate
cd /app/crawler

# 1. Advanced Crawler (BIT)
echo "--------------------------------------------------"
echo "1. Chạy BIT Crawler (advanced_crawler.py)"
python3 advanced_crawler.py || handle_error "advanced_crawler.py"

# 2. NTA Crawler 
echo "--------------------------------------------------"
echo "2. Chạy NTA Crawler (nta_parser.py)"
python3 nta_parser.py || handle_error "nta_parser.py"

# 3. Kết quả đấu giá
echo "--------------------------------------------------"
echo "3. Cào kết quả đấu giá (crawl_all_japan_results.py)"
python3 crawl_all_japan_results.py || handle_error "crawl_all_japan_results.py"

# 4. Phân tích Giá MLIT Đồng Bộ Khối
echo "--------------------------------------------------"
echo "4. Phân tích MLIT Gap Toàn diện (mlit_calculator.py)"
python3 mlit_calculator.py || handle_error "mlit_calculator.py"

echo "=================================================="
echo "✅ HOÀN THÀNH CRAWLER HÀNG NGÀY LÚC $(date)"
python3 /app/crawler/telegram_notify.py "🏠 <b>Keibai Finder - Daily Report</b>\n📅 $(date +'%Y-%m-%d %H:%M JST')\nToàn bộ dữ liệu BIT/NTA và Kết quả đấu giá đã được cập nhật thành công lên hệ thống."
echo "=================================================="
