#!/usr/bin/env python3
"""
seo_index_monitor.py
--------------------
Agent Giám Sát Chuyên Biệt Google Index & Organic Traffic (Keibai Finder - keibai-koubai.com).
Tự động đối chiếu 3 nguồn dữ liệu:
1. Google Search Console API: Tình trạng Sitemap, lỗi cào, lượt hiển thị (Impressions), Clicks, CTR và Từ khóa Google thực tế.
2. Cơ sở dữ liệu PostgreSQL: Lũy kế bắn index (seo_index_submissions), phát hiện URL mồ côi (chưa được nạp).
3. Bảng vết Googlebot (seo_bot_hits): Giám sát tần suất và nhật ký bot ghé thăm.

Sử dụng:
  python crawler/seo_index_monitor.py
  python crawler/seo_index_monitor.py --json-out data/seo_index_report.json
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
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
GSC_SITE_ID = os.environ.get("GSC_SITE_ID", "sc-domain:keibai-koubai.com")


def discover_google_key_files() -> List[str]:
    """Tìm Service Account JSON keys"""
    search_dirs = [
        os.environ.get("GOOGLE_KEYS_DIR", ""),
        os.path.join(SCRIPT_DIR, "google_keys"),
        "/app/crawler/google_keys",
        r"c:\kigyou-list\google_keys",
    ]
    key_files = []
    for d in search_dirs:
        if d and os.path.isdir(d):
            for fname in sorted(os.listdir(d)):
                if fname.endswith(".json"):
                    full_p = os.path.join(d, fname)
                    if full_p not in key_files:
                        key_files.append(full_p)
            if key_files:
                break

    single_cred = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", r"c:\kigyou-list\google_credentials.json")
    if not key_files and single_cred and os.path.isfile(single_cred):
        key_files.append(single_cred)

    return key_files


def init_bot_hits_table(conn):
    """Khởi tạo bảng theo dõi nhật ký cào của Googlebot / Bingbot"""
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS seo_bot_hits (
                id SERIAL PRIMARY KEY,
                bot_name TEXT NOT NULL,
                url TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                http_status INTEGER DEFAULT 200,
                response_time_ms INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_seo_bot_hits_ts ON seo_bot_hits(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_seo_bot_hits_bot ON seo_bot_hits(bot_name, created_at DESC);
            """
        )
    conn.commit()


def audit_database_index_health(conn) -> Dict[str, Any]:
    """Kiểm tra sức khỏe index trong Database PostgreSQL"""
    stats: Dict[str, Any] = {}
    with conn.cursor() as cur:
        # 1. Thống kê theo kênh bắn
        cur.execute(
            """
            SELECT channel, COUNT(*), MAX(submitted_at AT TIME ZONE 'Asia/Tokyo')
            FROM seo_index_submissions
            GROUP BY channel
            ORDER BY channel;
            """
        )
        stats["channels"] = [
            {"channel": row[0], "count": row[1], "last_submitted_jst": str(row[2])}
            for row in cur.fetchall()
        ]

        # 2. Tổng số tài sản ACTIVE hiện có vs Số tài sản đã bắn Index
        cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE status = 'ACTIVE';")
        total_active = cur.fetchone()[0]
        stats["total_active_properties"] = total_active

        cur.execute(
            """
            SELECT COUNT(*)
            FROM "Property" p
            WHERE p.status = 'ACTIVE'
              AND EXISTS (
                SELECT 1 FROM seo_index_submissions s
                WHERE s.entity_id = p.sale_unit_id
              );
            """
        )
        submitted_active = cur.fetchone()[0]
        stats["submitted_active_properties"] = submitted_active
        stats["active_index_coverage_pct"] = round((submitted_active / max(total_active, 1)) * 100, 1)

        # 3. Tài sản mới trong 48h chưa bắn index
        cur.execute(
            """
            SELECT p.sale_unit_id, p.address, p.property_type, p.created_at AT TIME ZONE 'Asia/Tokyo'
            FROM \"Property\" p
            LEFT JOIN seo_index_submissions s
              ON p.sale_unit_id = s.entity_id AND s.channel = 'INDEXNOW'
            WHERE p.status = 'ACTIVE'
              AND p.created_at >= NOW() - INTERVAL '48 hours'
              AND s.url IS NULL
            LIMIT 10;
            """
        )
        stats["unindexed_new_properties_sample"] = [
            {"id": r[0], "address": r[1], "type": r[2], "created_jst": str(r[3])}
            for r in cur.fetchall()
        ]

        # 4. Kiểm tra lượt cào của bot trong seo_bot_hits
        cur.execute(
            """
            SELECT bot_name, COUNT(*), MAX(created_at AT TIME ZONE 'Asia/Tokyo')
            FROM seo_bot_hits
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY bot_name
            ORDER BY COUNT(*) DESC;
            """
        )
        stats["bot_hits_last_7d"] = [
            {"bot": r[0], "hits": r[1], "last_hit_jst": str(r[2])}
            for r in cur.fetchall()
        ]

        if not stats["bot_hits_last_7d"]:
            stats["bot_hits_note"] = "Chưa có nguồn ghi log Googlebot vào seo_bot_hits (cần import Nginx/Cloudflare log)."

    return stats


def audit_google_search_console() -> Dict[str, Any]:
    """Truy vấn Google Search Console API để lấy tình trạng Sitemap và Search Performance"""
    report: Dict[str, Any] = {"status": "UNAVAILABLE", "sitemaps": [], "performance": {}}
    key_files = discover_google_key_files()
    if not key_files:
        report["message"] = "Không tìm thấy Google Service Account key"
        return report

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        report["message"] = "Thiếu thư viện google-api-python-client"
        return report

    service = None
    used_key = None
    for kp in key_files:
        try:
            creds = service_account.Credentials.from_service_account_file(
                kp, scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
            )
            svc = build("searchconsole", "v1", credentials=creds)
            # Thử truy vấn danh sách sitemaps
            svc.sitemaps().list(siteUrl=GSC_SITE_ID).execute()
            service = svc
            used_key = os.path.basename(kp)
            break
        except Exception:
            continue

    if not service:
        report["message"] = "Tất cả key Service Account đều chưa được cấp quyền đọc trên GSC"
        return report

    report["status"] = "CONNECTED"
    report["used_key"] = used_key

    # 1. Kiểm tra Sitemaps
    try:
        sm_resp = service.sitemaps().list(siteUrl=GSC_SITE_ID).execute()
        sitemap_list = sm_resp.get("sitemap", [])
        report["sitemaps"] = [
            {
                "path": sm.get("path"),
                "lastSubmitted": sm.get("lastSubmitted"),
                "lastDownloaded": sm.get("lastDownloaded"),
                "hasErrors": sm.get("hasErrors", False),
                "hasWarnings": sm.get("hasWarnings", False),
                "isPending": sm.get("isPending", False),
            }
            for sm in sitemap_list
        ]
    except Exception as e:
        report["sitemaps_error"] = str(e)

    # 2. Truy vấn Search Analytics (Clicks, Impressions, CTR, Top Queries) trong 28 ngày qua
    try:
        end_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["query"],
            "rowLimit": 10,
        }
        sa_resp = service.searchanalytics().query(siteUrl=GSC_SITE_ID, body=body).execute()
        rows = sa_resp.get("rows", [])
        report["performance"] = {
            "period": f"{start_date} -> {end_date}",
            "top_queries": [
                {
                    "query": r.get("keys", [""])[0],
                    "clicks": r.get("clicks", 0),
                    "impressions": r.get("impressions", 0),
                    "ctr": round(r.get("ctr", 0) * 100, 2),
                    "position": round(r.get("position", 0), 1),
                }
                for r in rows
            ],
        }
    except Exception as e:
        report["performance_error"] = str(e)

    return report


def main():
    parser = argparse.ArgumentParser(description="Keibai Google SEO & Index Sentinel Monitor")
    parser.add_argument("--json-out", type=str, default=None, help="Đường dẫn lưu file báo cáo JSON")
    args = parser.parse_args()

    print("==============================================================================")
    print("🔍 [KEIBAI GOOGLE SEO & INDEX SENTINEL] BẮT ĐẦU QUÉT ĐÁNH GIÁ TỔNG THỂ")
    print("==============================================================================")

    db_stats = {}
    if DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            try:
                init_bot_hits_table(conn)
                db_stats = audit_database_index_health(conn)
            finally:
                conn.close()
        except Exception as e:
            print(f"⚠️ Lỗi kết nối DB: {e}")
    else:
        print("⚠️ DATABASE_URL chưa được cấu hình.")

    gsc_stats = audit_google_search_console()

    full_report = {
        "timestamp_jst": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "database_health": db_stats,
        "google_search_console": gsc_stats,
    }

    # Hiển thị Dashboard trực quan
    print("\n--- 1. TÌNH TRẠNG LẬP CHỈ MỤC TRONG DATABASE ---")
    print(f"  • Tổng BĐS ACTIVE: {db_stats.get('total_active_properties', 0):,}")
    print(f"  • Đã bắn Index:    {db_stats.get('submitted_active_properties', 0):,} ({db_stats.get('active_index_coverage_pct', 0)}% độ phủ)")

    channels = db_stats.get("channels", [])
    if channels:
        print("\n  [Lũy kế nạp theo kênh]:")
        for ch in channels:
            print(f"    - {ch['channel']:<18}: {ch['count']:>6} URLs (Lần cuối: {ch['last_submitted_jst']})")

    unindexed = db_stats.get("unindexed_new_properties_sample", [])
    if unindexed:
        print(f"\n  ⚠️ Có {len(unindexed)} BĐS mới trong 48h chưa gửi index. Cần chạy 'fast_index_submitter.py' để cập nhật.")
    else:
        print("\n  ✅ Không có tồn đọng BĐS mới chưa nộp index.")

    print("\n--- 2. TÌNH TRẠNG GOOGLE SEARCH CONSOLE ---")
    print(f"  • Kết nối GSC API: {gsc_stats.get('status')} ({gsc_stats.get('used_key', 'Không có key')})")
    sms = gsc_stats.get("sitemaps", [])
    if sms:
        print(f"  • Sitemaps đã ghi nhận trên GSC ({len(sms)}):")
        for sm in sms:
            err_flag = "❌ Lỗi" if sm["hasErrors"] else "✅ OK"
            print(f"    - {sm['path']}: {err_flag} (Tải lần cuối: {sm['lastDownloaded']})")
    else:
        print(f"  • Thông báo GSC: {gsc_stats.get('message', 'Chưa có thông tin sitemap')}")

    perf = gsc_stats.get("performance", {})
    top_q = perf.get("top_queries", [])
    if top_q:
        print(f"\n  • Top từ khóa tìm kiếm Google ({perf.get('period', '')}):")
        for q in top_q[:5]:
            print(f"    - '{q['query']}': {q['clicks']} clicks, {q['impressions']} impressions, CTR {q['ctr']}%, Hạng tb {q['position']}")

    # Xuất file nếu yêu cầu
    out_path = args.json_out or os.path.join(PROJECT_ROOT, "data/seo_index_report.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, ensure_ascii=False, indent=2)
    print(f"\n📁 Đã xuất báo cáo chi tiết ra: {out_path}")
    print("==============================================================================")


if __name__ == "__main__":
    main()
