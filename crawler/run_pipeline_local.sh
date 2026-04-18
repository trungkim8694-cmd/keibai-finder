#!/bin/bash
set -e

DIR="/Users/kimtrung/keibai-finder/crawler"
cd $DIR

# Tải biến môi trường
export $(grep -v '^#' ../web/.env | xargs)

LOG_DIR="../logs_pipeline"
mkdir -p "$LOG_DIR"
TODAY=$(date +"%Y-%m-%d")
LOG_FILE="$LOG_DIR/master_crawler_$TODAY.log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=================================================="
echo "🚀 STARTING LOCAL MASTER PIPELINE AT $(date)"
echo "=================================================="

source ./venv/bin/activate

# 1. Advanced Crawler (BIT)
echo "--------------------------------------------------"
echo "1. Chạy BIT Crawler (advanced_crawler.py)"
python3 advanced_crawler.py

# 2. NTA Crawler 
echo "--------------------------------------------------"
echo "2. Chạy NTA Crawler (nta_parser.py)"
python3 nta_parser.py

# 3. Kết quả đấu giá
echo "--------------------------------------------------"
echo "3. Cào kết quả đấu giá (crawl_all_japan_results.py)"
python3 crawl_all_japan_results.py

# 4. Phân tích Giá MLIT Đồng Bộ Khối
echo "--------------------------------------------------"
echo "4. Phân tích MLIT Gap Toàn diện (mlit_calculator.py)"
python3 mlit_calculator.py

echo "=================================================="
echo "✅ HOÀN THÀNH CRAWLER HÀNG NGÀY LÚC $(date)"
# Gửi thông báo nếu có telegram_notify.py
if [ -f "telegram_notify.py" ]; then
    python3 telegram_notify.py "🏠 <b>Keibai Finder - Local Auto Report</b>
📅 $(date +'%Y-%m-%d %H:%M')
Tiến trình gồm 4 Module Cào Dữ Liệu đã hoàn thành." || true
fi
echo "=================================================="
