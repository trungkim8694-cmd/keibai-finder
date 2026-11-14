#!/usr/bin/env python3
"""
fast_index_submitter.py
-----------------------
Cỗ máy Bắn Index Tự Động Đa Kênh (Multi-Channel Fast Indexing Engine) cho Keibai Finder (keibai-koubai.com).
Tự động thực thi hàng ngày sau khi cào dữ liệu & vào khung giờ mở lại hạn mức Google (17:05 JST):

1. Kênh 1 - IndexNow Protocol (Bing, Yahoo! Japan, Yandex, Naver):
   - Bắn lô tối đa 2,000 URLs/lượt qua https://api.indexnow.org/indexnow.
2. Kênh 2 - Bing Webmaster API (SubmitUrlBatch):
   - Kiểm tra hạn mức thực tế (GetUrlSubmissionQuota) và bắn trực tiếp các URL ưu tiên cao nhất lên Bing Webmaster.
3. Kênh 3 - Google Web Search Indexing API VIP (Multi-Key Pool):
   - Xoay vòng qua các Service Account Keys hợp lệ, bắn thông báo URL_UPDATED cho BĐS mới, bài báo AI SEO mới và Hub tỉnh thành.
4. Kênh 4 - Google Search Console Sitemap Ping (sitemaps().submit):
   - Báo hiệu trực tiếp cho Googlebot tải lại https://www.keibai-koubai.com/sitemap.xml ngay lập tức.

Đảm bảo 100% KHÔNG TRÙNG LẶP nhờ bảng theo dõi trạng thái `seo_index_submissions` trên PostgreSQL.
Hỗ trợ mô hình Hub & Spoke + Vòng đời tài sản (ACTIVE -> SOLD/ARCHIVED).
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, "../web/.env.local"))
load_dotenv(os.path.join(SCRIPT_DIR, "../web/.env"))
load_dotenv("/app/web/.env.local")
load_dotenv("/app/web/.env")

DATABASE_URL = os.environ.get("DATABASE_URL", "").split("?")[0]
WWW_HOST = "www.keibai-koubai.com"
WWW_BASE_URL = f"https://{WWW_HOST}"
BING_SITE_URL = "https://keibai-koubai.com/"

INDEXNOW_KEY = os.environ.get("INDEXNOW_KEY", "0a1fbe0a7866441bb57817e0bf538068")
INDEXNOW_FALLBACK_KEY = "7c742571ab6a4103aa339488f8220031"
INDEXNOW_KEY_LOCATION = f"{WWW_BASE_URL}/{INDEXNOW_KEY}.txt"
INDEXNOW_ENDPOINTS = [
    "https://api.indexnow.org/indexnow",
    "https://yandex.com/indexnow",
]

BING_API_KEY = os.environ.get("BING_WEBMASTER_API_KEY", "7c742571ab6a4103aa339488f8220031")
BING_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"

GSC_SITE_ID = "sc-domain:keibai-koubai.com"
SITEMAP_URL = f"{WWW_BASE_URL}/sitemap.xml"


def init_tracking_table(conn):
    """Khởi tạo bảng theo dõi lịch sử bắn index trên PostgreSQL"""
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS seo_index_submissions (
                url TEXT NOT NULL,
                channel TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                status_snapshot TEXT DEFAULT 'ACTIVE',
                http_code INTEGER DEFAULT 200,
                submitted_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (url, channel)
            );
            CREATE INDEX IF NOT EXISTS idx_seo_index_sub_at ON seo_index_submissions(submitted_at DESC);
            CREATE INDEX IF NOT EXISTS idx_seo_index_entity ON seo_index_submissions(entity_id, channel);
            """
        )
    conn.commit()


def collect_candidate_urls(conn) -> List[Dict[str, str]]:
    """
    Thu thập danh sách ứng viên URL theo cấu trúc 4 Tầng (Hub & Spoke + Lifecycle):
    - Tầng 1: BĐS ACTIVE mới cào hoặc cập nhật trong 72h qua.
    - Tầng 2: Các trang Hub Tỉnh/Thành phố có biến động + Bài viết DailyDigest mới + Core Hubs.
    - Tầng 3: BĐS vừa chuyển trạng thái sang SOLD / ARCHIVED trong 48h qua (để cập nhật Schema OutOfStock/SoldOut).
    - Tầng 4: Toàn bộ BĐS ACTIVE còn lại trong kho chưa từng được bắn index.
    """
    candidates: List[Dict[str, str]] = []
    seen_urls = set()

    def add_candidate(url: str, entity_type: str, entity_id: str, status_snapshot: str):
        if url not in seen_urls:
            seen_urls.add(url)
            candidates.append({
                "url": url,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "status_snapshot": status_snapshot,
            })

    today_tag = datetime.now().strftime("%Y-%m-%d")

    with conn.cursor() as cur:
        # 1. TẦNG 1: BĐS ACTIVE mới cào / mới cập nhật trong 72h
        cur.execute(
            """
            SELECT sale_unit_id, prefecture, city
            FROM "Property"
            WHERE status = 'ACTIVE'
              AND address IS NOT NULL
              AND address != 'Unknown'
              AND (created_at >= NOW() - INTERVAL '72 hours' OR updated_at >= NOW() - INTERVAL '48 hours')
            ORDER BY created_at DESC;
            """
        )
        hot_active_rows = cur.fetchall()
        hot_prefs = set()
        hot_cities = set()
        for sale_unit_id, pref, city in hot_active_rows:
            add_candidate(
                f"{WWW_BASE_URL}/property/{sale_unit_id}",
                "PROPERTY_ACTIVE",
                sale_unit_id,
                "ACTIVE",
            )
            if pref:
                hot_prefs.add(pref)
                if city:
                    hot_cities.add((pref, city))

        # 2. TẦNG 2A: Bài viết phân tích thị trường & cẩm nang SEO mới (DailyDigest)
        cur.execute(
            """
            SELECT slug, category, TO_CHAR(updated_at, 'YYYY-MM-DD')
            FROM "DailyDigest"
            ORDER BY updated_at DESC
            LIMIT 30;
            """
        )
        for slug, category, upd_date in cur.fetchall():
            prefix = "/insights" if category == "MARKET_REPORT" else "/blogs"
            add_candidate(
                f"{WWW_BASE_URL}{prefix}/{slug}",
                "ARTICLE",
                slug,
                f"ARTICLE_{upd_date}",
            )

        # 3. TẦNG 2B: Core Hubs & Dynamic Area Hubs (Hub & Spoke)
        core_hubs = [
            "/",
            "/insights",
            "/blogs",
            "/auction/schedule",
            "/auction-results",
            "/search/area",
            "/area-map",
            "/trade-find",
        ]
        for path in core_hubs:
            add_candidate(f"{WWW_BASE_URL}{path}", "HUB", path, f"HUB_{today_tag}")

        for pref in list(hot_prefs)[:20]:
            enc_pref = urllib.parse.quote(pref)
            add_candidate(f"{WWW_BASE_URL}/search/area/{enc_pref}", "HUB", f"area:{pref}", f"HUB_{today_tag}")
            add_candidate(f"{WWW_BASE_URL}/area-map/{enc_pref}", "HUB", f"map:{pref}", f"HUB_{today_tag}")

        for pref, city in list(hot_cities)[:30]:
            enc_pref = urllib.parse.quote(pref)
            enc_city = urllib.parse.quote(city)
            add_candidate(
                f"{WWW_BASE_URL}/search/area/{enc_pref}/{enc_city}",
                "HUB",
                f"area:{pref}:{city}",
                f"HUB_{today_tag}",
            )

        # 4. TẦNG 3: BĐS vừa chuyển sang SOLD / ARCHIVED trong 48h qua (Lifecycle Update)
        cur.execute(
            """
            SELECT sale_unit_id, status
            FROM "Property"
            WHERE status IN ('SOLD', 'ARCHIVED')
              AND address IS NOT NULL
              AND address != 'Unknown'
              AND updated_at >= NOW() - INTERVAL '48 hours'
            ORDER BY updated_at DESC
            LIMIT 150;
            """
        )
        for sale_unit_id, st in cur.fetchall():
            add_candidate(
                f"{WWW_BASE_URL}/property/{sale_unit_id}",
                "PROPERTY_ARCHIVE",
                sale_unit_id,
                st,
            )

        # 5. TẦNG 4: Backlog toàn bộ BĐS ACTIVE trong kho
        cur.execute(
            """
            SELECT sale_unit_id
            FROM "Property"
            WHERE status = 'ACTIVE'
              AND address IS NOT NULL
              AND address != 'Unknown'
            ORDER BY mlit_investment_gap DESC NULLS LAST, created_at DESC;
            """
        )
        for (sale_unit_id,) in cur.fetchall():
            add_candidate(
                f"{WWW_BASE_URL}/property/{sale_unit_id}",
                "PROPERTY_ACTIVE",
                sale_unit_id,
                "ACTIVE",
            )

    return candidates


def filter_unsubmitted_for_channel(
    conn, candidates: List[Dict[str, str]], channel: str, limit: int
) -> List[Dict[str, str]]:
    """
    Lọc ra các URL chưa được gửi trên kênh `channel` (hoặc có status_snapshot mới hơn lần gửi trước).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT url, status_snapshot
            FROM seo_index_submissions
            WHERE channel = %s;
            """,
            (channel,),
        )
        submitted_map = {row[0]: row[1] for row in cur.fetchall()}

    selected = []
    for item in candidates:
        url = item["url"]
        snap = item["status_snapshot"]
        if url not in submitted_map or submitted_map[url] != snap:
            selected.append(item)
            if len(selected) >= limit:
                break
    return selected


def record_submissions(conn, items: List[Dict[str, str]], channel: str, http_code: int = 200):
    if not items:
        return
    rows = [
        (
            item["url"],
            channel,
            item["entity_type"],
            item["entity_id"],
            item["status_snapshot"],
            http_code,
        )
        for item in items
    ]
    try:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO seo_index_submissions (url, channel, entity_type, entity_id, status_snapshot, http_code)
                VALUES %s
                ON CONFLICT (url, channel) DO UPDATE SET
                    entity_type = EXCLUDED.entity_type,
                    status_snapshot = EXCLUDED.status_snapshot,
                    http_code = EXCLUDED.http_code,
                    submitted_at = NOW();
                """,
                rows,
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"⚠️ Lỗi lưu lịch sử seo_index_submissions ({channel}): {e}")


def submit_indexnow(conn, candidates: List[Dict[str, str]], limit: int = 2000) -> Tuple[int, str]:
    """Kênh 1: Gửi lô URL qua giao thức IndexNow (Bing, Yahoo! Japan, Yandex, Naver)"""
    batch = filter_unsubmitted_for_channel(conn, candidates, "INDEXNOW", limit)
    if not batch:
        print("✅ [IndexNow] Toàn bộ URL mới/biến động đều đã được nộp trước đó.")
        return 0, "Đã đồng bộ 100% ✅"

    urls = [item["url"] for item in batch]
    keys_to_try = [INDEXNOW_KEY, INDEXNOW_FALLBACK_KEY]
    last_err = "Unknown"

    for key_val in dict.fromkeys(keys_to_try):
        payload = {
            "host": WWW_HOST,
            "key": key_val,
            "keyLocation": f"{WWW_BASE_URL}/{key_val}.txt",
            "urlList": urls,
        }
        data_bytes = json.dumps(payload).encode("utf-8")

        for endpoint in INDEXNOW_ENDPOINTS:
            req = urllib.request.Request(
                endpoint,
                data=data_bytes,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "User-Agent": "KeibaiFinder-SEOEngine/2.0",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    code = resp.getcode()
                    if code in (200, 202):
                        record_submissions(conn, batch, "INDEXNOW", code)
                        print(f"🚀 [IndexNow] Đã bắn thành công {len(urls)} URLs qua {endpoint} (HTTP {code})!")
                        return len(urls), f"Đã bắn {len(urls)} URLs (HTTP {code}) ✅"
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                last_err = f"HTTP {e.code} ({endpoint})"
                print(f"⚠️ [IndexNow] {endpoint} (key={key_val[:8]}...) HTTP {e.code}: {err_body[:160]}")
            except Exception as e:
                last_err = str(e)
                print(f"⚠️ [IndexNow] {endpoint} lỗi kết nối: {e}")

    return 0, f"{last_err} ⚠️"


def submit_bing_webmaster_batch(conn, candidates: List[Dict[str, str]], max_batch: int = 100) -> Tuple[int, str]:
    """Kênh 2: Gửi trực tiếp qua Bing Webmaster API (SubmitUrlBatch) theo quota ngày"""
    if not BING_API_KEY:
        return 0, "Bỏ qua (Thiếu key)"

    try:
        q_url = f"{BING_API_BASE}/GetUrlSubmissionQuota?siteUrl={urllib.parse.quote(BING_SITE_URL)}&apikey={BING_API_KEY}"
        req_q = urllib.request.Request(q_url, headers={"User-Agent": "KeibaiFinder-SEOEngine/2.0"})
        with urllib.request.urlopen(req_q, timeout=15) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
            quota_info = raw.get("d", raw)
            daily_quota = int(quota_info.get("DailyQuota", 0))
    except Exception as e:
        print(f"⚠️ [Bing Webmaster API] Không kiểm tra được quota: {e}")
        return 0, "Lỗi kiểm tra quota ⚠️"

    if daily_quota <= 0:
        print("ℹ️ [Bing Webmaster API] Hạn mức trực tiếp hôm nay đã dùng hết (0 còn lại).")
        return 0, "Hết quota ngày (0 còn lại) ⏭️"

    take_count = min(daily_quota, max_batch)
    batch = filter_unsubmitted_for_channel(conn, candidates, "BING_WEBMASTER", take_count)
    if not batch:
        print("✅ [Bing Webmaster API] Không có URL mới cần gửi thêm.")
        return 0, f"Đã đồng bộ (Còn {daily_quota} quota) ✅"

    # Chuyển sang domain đã xác thực trên Bing Webmaster nếu cần (https://keibai-koubai.com/...)
    urls = [item["url"].replace("https://www.keibai-koubai.com/", "https://keibai-koubai.com/") for item in batch]
    post_url = f"{BING_API_BASE}/SubmitUrlBatch?apikey={BING_API_KEY}"
    payload = {"siteUrl": BING_SITE_URL, "urlList": urls}
    req_post = urllib.request.Request(
        post_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "KeibaiFinder-SEOEngine/2.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req_post, timeout=20) as resp:
            code = resp.getcode()
            record_submissions(conn, batch, "BING_WEBMASTER", code)
            print(f"🚀 [Bing Webmaster API] Đã nạp trực tiếp {len(urls)} URLs (Còn {daily_quota - len(urls)} quota hôm nay)!")
            return len(urls), f"Đã bắn {len(urls)} URLs ✅"
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"⚠️ [Bing Webmaster API] HTTP {e.code}: {err_body}")
        return 0, f"HTTP {e.code} ⚠️"
    except Exception as e:
        print(f"⚠️ [Bing Webmaster API] Lỗi: {e}")
        return 0, f"Lỗi ⚠️"


def discover_google_key_files() -> List[str]:
    """Tìm tất cả Google Service Account JSON keys trên VPS hoặc máy local"""
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


def submit_google_indexing_and_sitemap(conn, candidates: List[Dict[str, str]], limit: int = 200) -> Tuple[int, str, str]:
    """
    Kênh 3 & 4:
    - Bắn URL_UPDATED lên Google Indexing API VIP (xoay vòng qua pool Service Account keys).
    - Nộp/Ping lại Sitemap (https://www.keibai-koubai.com/sitemap.xml) qua Google Search Console API.
    """
    key_files = discover_google_key_files()
    if not key_files:
        print("⚠️ [Google Indexing] Không tìm thấy file Google Service Account JSON nào.")
        return 0, "Thiếu file key ⚠️", "Chưa chạy ⏳"

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
    except ImportError as e:
        print(f"⚠️ [Google Indexing] Thiếu thư viện google-api-python-client: {e}")
        return 0, "Thiếu thư viện ⚠️", "Lỗi ⏳"

    # 1. Ping Sitemap trên Google Search Console bằng key đầu tiên
    sitemap_status = "Chưa nộp ⏳"
    try:
        creds_gsc = service_account.Credentials.from_service_account_file(
            key_files[0], scopes=["https://www.googleapis.com/auth/webmasters"]
        )
        svc_gsc = build("searchconsole", "v1", credentials=creds_gsc)
        svc_gsc.sitemaps().submit(siteUrl=GSC_SITE_ID, feedpath=SITEMAP_URL).execute()
        sitemap_status = "Đã ping Sitemap GSC thành công ✅"
        print(f"🗺️ [Google Search Console] Đã ping nộp lại {SITEMAP_URL} thành công!")
    except Exception as e:
        print(f"⚠️ [Google Search Console] Lỗi ping sitemap: {e}")
        sitemap_status = "Lỗi ping Sitemap ⚠️"

    # 2. Bắn Google Indexing API VIP
    batch = filter_unsubmitted_for_channel(conn, candidates, "GOOGLE_INDEXING", limit)
    if not batch:
        print("✅ [Google Indexing API] Toàn bộ URL ưu tiên đều đã được gửi trước đó.")
        return 0, "Đã đồng bộ 100% ✅", sitemap_status

    services = []
    for kp in key_files:
        try:
            creds = service_account.Credentials.from_service_account_file(
                kp, scopes=["https://www.googleapis.com/auth/indexing"]
            )
            svc = build("indexing", "v3", credentials=creds)
            with open(kp, "r", encoding="utf-8") as f:
                info = json.load(f)
            services.append({
                "name": os.path.basename(kp),
                "email": info.get("client_email", "unknown"),
                "service": svc,
                "exhausted": False,
                "count": 0,
            })
        except Exception as e:
            print(f"⚠️ Không nạp được key {kp}: {e}")

    if not services:
        return 0, "Không có key hợp lệ ❌", sitemap_status

    submitted_items = []
    svc_idx = 0

    for item in batch:
        url = item["url"]
        action = "URL_UPDATED"
        success_for_url = False

        # Thử xoay vòng qua các key còn hoạt động
        attempts = 0
        while attempts < len(services):
            curr = services[svc_idx]
            if curr["exhausted"]:
                svc_idx = (svc_idx + 1) % len(services)
                attempts += 1
                continue

            try:
                curr["service"].urlNotifications().publish(
                    body={"url": url, "type": action}
                ).execute()
                curr["count"] += 1
                submitted_items.append(item)
                success_for_url = True
                if len(submitted_items) % 20 == 0 or len(submitted_items) == 1:
                    print(f"  -> [Google Indexing] ({len(submitted_items)}/{len(batch)}) OK via {curr['name']}: {url}")
                if curr["count"] >= 200:
                    curr["exhausted"] = True
                    svc_idx = (svc_idx + 1) % len(services)
                time.sleep(0.15)
                break
            except HttpError as he:
                err_str = str(he)
                if "429" in err_str or "RATE_LIMIT_EXCEEDED" in err_str or "quota" in err_str.lower():
                    print(f"ℹ️ [Google Indexing] Key {curr['name']} ({curr['email']}) đã chạm trần 200 requests/ngày.")
                elif "403" in err_str:
                    print(f"ℹ️ [Google Indexing] Key {curr['name']} ({curr['email']}) chưa được cấp quyền Owner trên GSC keibai-koubai.com.")
                else:
                    print(f"⚠️ [Google Indexing] Lỗi HTTP trên {curr['name']}: {he}")
                curr["exhausted"] = True
                svc_idx = (svc_idx + 1) % len(services)
                attempts += 1
            except Exception as ex:
                print(f"⚠️ [Google Indexing] Lỗi ngoại lệ trên {curr['name']}: {ex}")
                curr["exhausted"] = True
                svc_idx = (svc_idx + 1) % len(services)
                attempts += 1

        if not success_for_url:
            # Tất cả các key đều đã hết quota hoặc chưa cấp quyền
            break

    if submitted_items:
        record_submissions(conn, submitted_items, "GOOGLE_INDEXING", 200)
        print(f"🚀 [Google Indexing API] Đã bắn thành công {len(submitted_items)} URLs VIP lên Googlebot!")
        return len(submitted_items), f"Đã bắn {len(submitted_items)} URLs VIP ✅", sitemap_status
    else:
        print(
            "⏳ [Google Indexing API] Hạn mức 200 URL/ngày của Google Project hiện đã dùng hết; "
            f"{len(batch)} URL đang chờ trong hàng đợi sẽ tự động bắn ngay khi mở quota (17:05 JST)."
        )
        return 0, f"Chờ reset quota 17:05 JST ({len(batch)} URLs chờ) ⏳", sitemap_status


def print_summary_stats(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT channel, COUNT(*), MAX(submitted_at AT TIME ZONE 'Asia/Tokyo')
            FROM seo_index_submissions
            GROUP BY channel
            ORDER BY channel;
            """
        )
        rows = cur.fetchall()
        print("\n=== 📊 THỐNG KÊ LŨY KẾ BẮN INDEX (seo_index_submissions) ===")
        if not rows:
            print("  (Chưa có bản ghi nào)")
        for ch, cnt, last_dt in rows:
            print(f"  - {ch:<18}: {cnt:>6} URLs | Lần cuối (JST): {last_dt}")


def main():
    parser = argparse.ArgumentParser(description="Keibai Finder Multi-Channel Fast Indexing Engine")
    parser.add_argument("--indexnow-limit", type=int, default=2000, help="Số URL tối đa bắn qua IndexNow mỗi lượt")
    parser.add_argument("--bing-limit", type=int, default=100, help="Số URL tối đa bắn qua Bing Webmaster API mỗi lượt")
    parser.add_argument("--google-limit", type=int, default=200, help="Số URL tối đa bắn qua Google Indexing API mỗi lượt")
    parser.add_argument("--stats-only", action="store_true", help="Chỉ xem thống kê lũy kế")
    args = parser.parse_args()

    if not DATABASE_URL:
        print("❌ DATABASE_URL chưa được cấu hình.")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    try:
        init_tracking_table(conn)
        if args.stats_only:
            print_summary_stats(conn)
            return

        print("==============================================================================")
        print(f"🚀 [FAST INDEXING ENGINE] KHỞI ĐỘNG: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("==============================================================================")

        candidates = collect_candidate_urls(conn)
        print(f"🔍 Đã thu thập {len(candidates)} URL ứng viên (Tài sản ACTIVE, Hubs Tỉnh/Thành, Bài viết SEO, Tài sản hết hạn).")

        idx_count, idx_status = submit_indexnow(conn, candidates, limit=args.indexnow_limit)
        bing_count, bing_status = submit_bing_webmaster_batch(conn, candidates, max_batch=args.bing_limit)
        goog_count, goog_status, sitemap_status = submit_google_indexing_and_sitemap(
            conn, candidates, limit=args.google_limit
        )

        print_summary_stats(conn)
        print("==============================================================================")
        print(
            f"🏁 KẾT QUẢ: IndexNow={idx_count} ({idx_status}) | "
            f"BingAPI={bing_count} ({bing_status}) | "
            f"GoogleVIP={goog_count} ({goog_status}) | "
            f"Sitemap={sitemap_status}"
        )
        print("==============================================================================")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
