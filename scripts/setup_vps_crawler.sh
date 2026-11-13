#!/usr/bin/env bash
# ==============================================================================
# Keibai Finder - One-Click VPS Crawler Setup & Systemd Automation
# ==============================================================================
# Script này được chạy trực tiếp trên VPS để cài đặt và cấu hình toàn bộ crawler:
# 1. Cài đặt OS libraries và Chromium cho Playwright
# 2. Cài đặt Python Virtualenv và dependencies
# 3. Cài đặt Systemd Services & Timers tự động chạy hàng ngày và hàng tuần
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CURRENT_USER="$(whoami)"

echo "=============================================================================="
echo "🚀 [KEIBAI VPS] BẮT ĐẦU CÀI ĐẶT MÔI TRƯỜNG CRAWLER TRÊN VPS"
echo "Thư mục dự án: $PROJECT_DIR"
echo "User thực thi: $CURRENT_USER"
echo "=============================================================================="

# 1. Cập nhật gói hệ thống
echo "⏳ [1/6] Cập nhật gói hệ thống và thư viện cần thiết..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv python3-dev curl wget git libgbm-dev libnss3 libatk1.0-0 libasound2

# 2. Thiết lập múi giờ Tokyo JST
echo "⏳ [2/6] Đồng bộ múi giờ Tokyo (Asia/Tokyo)..."
sudo timedatectl set-timezone Asia/Tokyo || true

# 3. Tạo thư mục logs & gán quyền
echo "⏳ [3/6] Chuẩn bị thư mục logs và cấp quyền thực thi..."
mkdir -p "$PROJECT_DIR/logs"
chmod +x "$PROJECT_DIR/crawler/run_daily_vps.sh"
chmod +x "$PROJECT_DIR/crawler/run_weekly_results_vps.sh"

# 4. Tạo Virtualenv và cài đặt dependencies
echo "⏳ [4/6] Khởi tạo Python Virtual Environment..."
cd "$PROJECT_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# shellcheck source=/dev/null
source venv/bin/activate
pip install --upgrade pip
if [ -f "crawler/requirements.txt" ]; then
    echo "📦 Đang cài đặt thư viện Python từ crawler/requirements.txt..."
    pip install -r crawler/requirements.txt
fi

# 5. Cài đặt Chromium Headless cho Playwright
echo "⏳ [5/6] Cài đặt Playwright Chromium & dependencies..."
playwright install chromium
sudo playwright install-deps chromium || echo "⚠️ playwright install-deps có thể đã cài xong."

# 6. Cấu hình Systemd Timer
echo "⏳ [6/6] Cài đặt và kích hoạt Systemd Timer..."
SYSTEMD_DIR="/etc/systemd/system"

# Tạo bản sao service với user và path thực tế của VPS
sudo tee "$SYSTEMD_DIR/keibai-daily-crawler.service" > /dev/null <<EOF
[Unit]
Description=Keibai Finder Daily Master Crawler Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR/crawler
ExecStart=/bin/bash $PROJECT_DIR/crawler/run_daily_vps.sh
StandardOutput=append:$PROJECT_DIR/logs/systemd_daily_crawler.log
StandardError=append:$PROJECT_DIR/logs/systemd_daily_crawler.log
TimeoutSec=21600
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

sudo tee "$SYSTEMD_DIR/keibai-daily-crawler.timer" > /dev/null <<EOF
[Unit]
Description=Run Keibai Daily Crawler every morning at 04:00 JST
After=time-sync.target

[Timer]
OnCalendar=*-*-* 04:00:00 Asia/Tokyo
Persistent=true
RandomizedDelaySec=180

[Install]
WantedBy=timers.target
EOF

sudo tee "$SYSTEMD_DIR/keibai-weekly-results.service" > /dev/null <<EOF
[Unit]
Description=Keibai Finder Weekly Auction Results Crawler Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR/crawler
ExecStart=/bin/bash $PROJECT_DIR/crawler/run_weekly_results_vps.sh
StandardOutput=append:$PROJECT_DIR/logs/systemd_weekly_results.log
StandardError=append:$PROJECT_DIR/logs/systemd_weekly_results.log
TimeoutSec=18000
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

sudo tee "$SYSTEMD_DIR/keibai-weekly-results.timer" > /dev/null <<EOF
[Unit]
Description=Run Keibai Weekly Auction Results on Saturday at 03:00 JST
After=time-sync.target

[Timer]
OnCalendar=Sat *-*-* 03:00:00 Asia/Tokyo
Persistent=true
RandomizedDelaySec=180

[Install]
WantedBy=timers.target
EOF

# Reload daemon và kích hoạt timer
sudo systemctl daemon-reload
sudo systemctl enable --now keibai-daily-crawler.timer
sudo systemctl enable --now keibai-weekly-results.timer

echo ""
echo "=============================================================================="
echo "✅ [HOÀN TẤT] HỆ THỐNG CRAWLER ĐÃ ĐƯỢC THIẾT LẬP THÀNH CÔNG TRÊN VPS!"
echo "=============================================================================="
echo "Trạng thái các Timer:"
systemctl list-timers keibai-* || true
echo ""
echo "💡 CÁC LỆNH HỮU ÍCH ĐỂ QUẢN TRỊ TRÊN VPS:"
echo "1. Chạy thử tiến trình hàng ngày ngay lập tức:"
echo "   sudo systemctl start keibai-daily-crawler.service"
echo "2. Xem log tiến trình hàng ngày đang chạy:"
echo "   tail -f $PROJECT_DIR/logs/daily_crawler_\$(date +%Y-%m-%d).log"
echo "3. Kiểm tra trạng thái timer:"
echo "   systemctl status keibai-daily-crawler.timer"
echo "=============================================================================="

