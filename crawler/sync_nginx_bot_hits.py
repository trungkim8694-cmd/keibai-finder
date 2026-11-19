#!/usr/bin/env python3
"""
sync_nginx_bot_hits.py
----------------------
Quét file access.log của Nginx trên VPS hoặc container, lọc tất cả các request
từ Googlebot, Bingbot, YandexBot... và ghi vào bảng `seo_bot_hits` trên PostgreSQL.
Chạy định kỳ qua Cron hàng giờ trên VPS.
"""

import os
import re
import sys
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
load_dotenv(os.path.join(PROJECT_ROOT, "web/.env.local"))
load_dotenv(os.path.join(PROJECT_ROOT, "web/.env"))
load_dotenv("/app/web/.env.local")
load_dotenv("/app/web/.env")

DATABASE_URL = os.environ.get("DATABASE_URL", "").split("?")[0]

BOT_REGEX = re.compile(
    r"(Googlebot-Image|Googlebot-Mobile|Googlebot|Google-Extended|bingbot|IndexNow|YandexBot|Applebot|GPTBot|PerplexityBot|ClaudeBot)",
    re.IGNORECASE,
)

# Standard Nginx combined log format:
# $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
NGINX_LOG_REGEX = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<url>\S+)(?: \S+)?" (?P<status>\d+) (?P<bytes>\d+) "[^"]*" "(?P<ua>[^"]*)"'
)


def parse_nginx_date(time_str: str) -> datetime:
    # 19/Nov/2026:15:30:00 +0900
    try:
        clean = time_str.split()[0]
        return datetime.strptime(clean, "%d/%b/%Y:%H:%M:%S")
    except Exception:
        return datetime.now()


def sync_nginx_logs(log_paths=None):
    if not DATABASE_URL:
        print("❌ DATABASE_URL chưa được cấu hình.")
        return

    if not log_paths:
        log_paths = [
            "/var/log/nginx/access.log",
            "/var/log/nginx/keibai.access.log",
            "/var/log/nginx/access.log.1",
            "/app/logs/nginx_access.log",
        ]

    existing_files = [p for p in log_paths if os.path.isfile(p)]
    if not existing_files:
        print(f"ℹ️ Chưa tìm thấy file log Nginx cục bộ (chạy trên local/dev). Sẽ quét khi chạy trên VPS.")
        return

    conn = psycopg2.connect(DATABASE_URL)
    total_inserted = 0
    try:
        with conn.cursor() as cur:
            for log_file in existing_files:
                print(f"📖 Đang đọc {log_file}...")
                with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                    batch = []
                    for line in f:
                        m_bot = BOT_REGEX.search(line)
                        if not m_bot:
                            continue
                        m_log = NGINX_LOG_REGEX.match(line)
                        if not m_log:
                            continue

                        bot_name = m_bot.group(1)
                        data = m_log.groupdict()
                        req_time = parse_nginx_date(data["time"])

                        batch.append((
                            bot_name,
                            data["url"][:500],
                            data["ip"][:100],
                            data["ua"][:500],
                            int(data["status"]),
                            req_time,
                        ))

                        if len(batch) >= 100:
                            cur.executemany(
                                """
                                INSERT INTO seo_bot_hits (bot_name, url, ip_address, user_agent, http_status, created_at)
                                VALUES (%s, %s, %s, %s, %s, %s);
                                """,
                                batch,
                            )
                            total_inserted += len(batch)
                            batch = []

                    if batch:
                        cur.executemany(
                            """
                            INSERT INTO seo_bot_hits (bot_name, url, ip_address, user_agent, http_status, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            batch,
                        )
                        total_inserted += len(batch)
        conn.commit()
        print(f"✅ Đã đồng bộ {total_inserted} lượt cào của bot vào bảng seo_bot_hits!")
    finally:
        conn.close()


if __name__ == "__main__":
    sync_nginx_logs()
