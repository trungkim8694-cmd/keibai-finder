import os
import re
import sys
import json
import time
import urllib.parse
import argparse
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import psycopg2
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crawler_utils import (
    get_random_user_agent,
    geocode_address,
    get_nearest_station_from_db,
    clean_area_string,
    extract_prefecture_and_city,
    is_ghost_sweep_safe,
)

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

KSI_SEARCH_QUERIES = [
    "https://kankocho.jp/search/real-estate/?direction=ASC&field=PRICE",
    "https://kankocho.jp/search/real-estate/?direction=DESC&field=PRICE",
    "https://kankocho.jp/search/real-estate/?direction=ASC&field=END_TIME",
    "https://kankocho.jp/search/real-estate/?direction=DESC&field=END_TIME",
]


def get_db_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)


def map_ksi_property_type(raw_type: str, title: str = "") -> str:
    txt = f"{raw_type} {title}"
    if any(k in txt for k in ["マンション", "区分所有", "共同住宅"]):
        return "マンション"
    if any(k in txt for k in ["戸建", "一戸建", "住宅", "居宅", "宅地及び建物", "建物付"]):
        return "戸建て"
    if any(k in txt for k in ["農地", "田", "畑"]):
        return "農地"
    if any(k in txt for k in ["宅地", "土地", "山林", "雑種地", "原野", "更地"]):
        return "土地"
    return "その他"


def parse_jp_datetime(dt_str: str):
    if not dt_str:
        return None
    m = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})時(\d{1,2})分', dt_str)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5)))
        except ValueError:
            return None
    m2 = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', dt_str)
    if m2:
        try:
            return datetime(int(m2.group(1)), int(m2.group(2)), int(m2.group(3)), 13, 0)
        except ValueError:
            return None
    return None


def parse_ksi_detail(item_id: str, session: requests.Session) -> dict | None:
    url = f"https://kankocho.jp/items/{item_id}/"
    r = session.get(url, headers={"User-Agent": get_random_user_agent()}, timeout=20)
    if r.status_code != 200:
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    h1 = soup.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else f"官公庁公売 {item_id}"

    # Collect dt/dd and th/td metadata
    meta = {}
    for dl in soup.find_all("dl"):
        for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
            k = dt.get_text(" ", strip=True)
            v = dd.get_text(" ", strip=True)
            if k:
                meta[k] = v
    for tr in soup.find_all("tr"):
        th, td = tr.find("th"), tr.find("td")
        if th and td:
            k = th.get_text(" ", strip=True)
            v = td.get_text(" ", strip=True)
            if k:
                meta[k] = v

    authority = meta.get("執行機関名称", "")
    # Deduplicate against NTA (国税庁公売)
    if any(k in authority for k in ["国税局", "税務署", "国税庁"]):
        return {"_skip_nta": True, "authority": authority}

    # Extract starting price (見積価額)
    starting_price = None
    # Try DOM label 見積価額 -> parent/next sibling
    label_el = soup.find(string=re.compile(r"見積価額"))
    if label_el and label_el.parent and label_el.parent.parent:
        block_txt = label_el.parent.parent.get_text(" ", strip=True)
        pm = re.search(r'([0-9,]+)\s*円', block_txt)
        if pm:
            starting_price = int(pm.group(1).replace(",", ""))
    if not starting_price:
        # Fallback: RSC payload minimumPrice / estimatedPrice
        pm2 = re.search(r'"(?:minimumPrice|estimatedPrice|estimatePrice)"\s*:\s*(\d+)', r.text)
        if pm2:
            starting_price = int(pm2.group(1))

    # Address
    address = meta.get("所在地") or ""
    if not address:
        loc_pref = meta.get("物件の所在", "")
        reg = meta.get("登記簿の表示", "")
        m_reg = re.search(r'所在\s*([^\s　\n]+)', reg)
        if m_reg:
            address = m_reg.group(1)
        elif loc_pref:
            address = loc_pref
    address = re.sub(r'\s+', ' ', address).strip()

    pref, city = extract_prefecture_and_city(address)
    raw_type = meta.get("物件の種類", "") or meta.get("地目", "")
    prop_type = map_ksi_property_type(raw_type, title)

    # Areas (store numeric float in `area`, keep detailed strings in raw_display_data)
    land_area_str = None
    bldg_area_str = None
    for k, v in meta.items():
        if "土地面積" in k or "地積" in k:
            land_area_str = clean_area_string(v) or land_area_str
        if "建物面積" in k or "延床面積" in k or "専有面積" in k:
            bldg_area_str = clean_area_string(v) or bldg_area_str

    area_float = None
    for s in (bldg_area_str, land_area_str):
        if s:
            m_a = re.search(r'[\d.]+', str(s).replace(',', ''))
            if m_a:
                area_float = float(m_a.group())
                break

    # Bidding dates
    bidding_period = meta.get("入札期間", "")
    start_date, end_date = None, None
    if "〜" in bidding_period or "～" in bidding_period:
        parts = re.split(r'[〜～]', bidding_period, maxsplit=1)
        start_date = parse_jp_datetime(parts[0])
        end_date = parse_jp_datetime(parts[1])

    # Images (unwrap /_next/image/?url=...)
    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if "/_next/image" in src and "url=" in src:
            parsed = urllib.parse.urlparse(src)
            qs = urllib.parse.parse_qs(parsed.query)
            if "url" in qs and qs["url"]:
                raw_img = qs["url"][0]
                if "_large" in raw_img or "_medium" in raw_img or "upload-images" in raw_img:
                    if raw_img not in images:
                        images.append(raw_img)
        elif "upload-images" in src and src not in images:
            images.append(src)

    # Prefer large images first
    large_imgs = [i for i in images if "_large" in i]
    thumb_url = large_imgs[0] if large_imgs else (images[0] if images else None)

    return {
        "sale_unit_id": f"KSI_{item_id}",
        "source_provider": "KSI",
        "source_url": url,
        "court_name": authority or "自治体・官公庁",
        "managing_authority": authority or "自治体・官公庁",
        "property_type": prop_type,
        "address": address,
        "prefecture": pref,
        "city": city,
        "starting_price": starting_price,
        "area": area_float,
        "bid_start_date": start_date,
        "bid_end_date": end_date,
        "thumbnailUrl": thumb_url,
        "images": images[:10],
        "raw_display_data": {
            "title": title,
            "summary": meta,
            "land_area": land_area_str,
            "building_area": bldg_area_str,
            "bidding_period": bidding_period,
            "source_url": url,
        },
        "raw_text": "\n".join(f"{k}: {v}" for k, v in meta.items()),
    }


def run_ksi_crawler(limit: int = 0):
    print("🚀 Starting KSI (官公庁公売) Crawler...")
    session = requests.Session()
    discovered_ids = []
    seen_ids = set()

    for search_url in KSI_SEARCH_QUERIES:
        try:
            r = session.get(search_url, headers={"User-Agent": get_random_user_agent()}, timeout=20)
            if r.status_code == 200:
                for item_id in re.findall(r'/items/(\d+)/', r.text):
                    if item_id not in seen_ids:
                        seen_ids.add(item_id)
                        discovered_ids.append(item_id)
        except Exception as e:
            print(f"⚠️ Error fetching {search_url}: {e}")

    print(f"🔎 Discovered {len(discovered_ids)} unique KSI item IDs.")
    if limit > 0:
        discovered_ids = discovered_ids[:limit]
        print(f"🧪 --limit={limit}: processing {len(discovered_ids)} items.")

    conn = get_db_connection()
    cur = conn.cursor()

    # Memory Cache O(1)
    cur.execute("""
        SELECT sale_unit_id, starting_price, lat, lng, status
        FROM "Property"
        WHERE source_provider = 'KSI'
    """)
    db_cache = {row[0]: {"price": row[1], "lat": row[2], "lng": row[3], "status": row[4]} for row in cur.fetchall()}

    scraped_unit_ids = []
    inserted = 0
    skipped_nta = 0

    for idx, item_id in enumerate(discovered_ids, 1):
        try:
            data = parse_ksi_detail(item_id, session)
            if not data:
                continue
            if data.get("_skip_nta"):
                skipped_nta += 1
                continue

            uid = data["sale_unit_id"]
            scraped_unit_ids.append(uid)
            cached = db_cache.get(uid)

            lat = cached["lat"] if cached and cached["lat"] else None
            lng = cached["lng"] if cached and cached["lng"] else None

            if (lat is None or lng is None) and data["address"]:
                lat, lng = geocode_address(data["address"])
                time.sleep(0.25)

            st_name, line_name, dist_m, walk_min = (None, None, None, None)
            if lat is not None and lng is not None:
                st_name, line_name, dist_m, walk_min = get_nearest_station_from_db(lat, lng, cur)

            cur.execute("""
                INSERT INTO "Property" (
                    sale_unit_id, source_provider, source_url, court_name, managing_authority,
                    property_type, address, prefecture, city, lat, lng,
                    starting_price, area,
                    bid_start_date, bid_end_date,
                    nearest_station, line_name, distance_to_station, walk_time_to_station,
                    "thumbnailUrl", images, raw_display_data, raw_text,
                    status, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    'ACTIVE', NOW(), NOW()
                )
                ON CONFLICT (sale_unit_id) DO UPDATE SET
                    source_url = EXCLUDED.source_url,
                    court_name = EXCLUDED.court_name,
                    managing_authority = EXCLUDED.managing_authority,
                    property_type = EXCLUDED.property_type,
                    address = EXCLUDED.address,
                    prefecture = COALESCE(EXCLUDED.prefecture, "Property".prefecture),
                    city = COALESCE(EXCLUDED.city, "Property".city),
                    lat = COALESCE(EXCLUDED.lat, "Property".lat),
                    lng = COALESCE(EXCLUDED.lng, "Property".lng),
                    starting_price = COALESCE(EXCLUDED.starting_price, "Property".starting_price),
                    area = COALESCE(EXCLUDED.area, "Property".area),
                    bid_start_date = COALESCE(EXCLUDED.bid_start_date, "Property".bid_start_date),
                    bid_end_date = COALESCE(EXCLUDED.bid_end_date, "Property".bid_end_date),
                    nearest_station = COALESCE(EXCLUDED.nearest_station, "Property".nearest_station),
                    line_name = COALESCE(EXCLUDED.line_name, "Property".line_name),
                    distance_to_station = COALESCE(EXCLUDED.distance_to_station, "Property".distance_to_station),
                    walk_time_to_station = COALESCE(EXCLUDED.walk_time_to_station, "Property".walk_time_to_station),
                    "thumbnailUrl" = COALESCE(EXCLUDED."thumbnailUrl", "Property"."thumbnailUrl"),
                    images = EXCLUDED.images,
                    raw_display_data = EXCLUDED.raw_display_data,
                    raw_text = EXCLUDED.raw_text,
                    status = 'ACTIVE',
                    updated_at = NOW();
            """, (
                uid, "KSI", data["source_url"], data["court_name"], data["managing_authority"],
                data["property_type"], data["address"], data["prefecture"], data["city"], lat, lng,
                data["starting_price"], data["area"],
                data["bid_start_date"], data["bid_end_date"],
                st_name, line_name, dist_m, walk_min,
                data["thumbnailUrl"], data["images"], json.dumps(data["raw_display_data"], ensure_ascii=False), data["raw_text"],
            ))
            inserted += 1
            if idx % 20 == 0:
                conn.commit()
                print(f"  Progress: {idx}/{len(discovered_ids)} (saved={inserted}, skipped_nta={skipped_nta})")
        except Exception as e:
            print(f"⚠️ Error processing KSI {item_id}: {e}")
            conn.rollback()

    # Ghost Sweep O(1) only on full run với Circuit Breaker
    archived = 0
    if limit == 0 and scraped_unit_ids:
        cur.execute('SELECT COUNT(*) FROM "Property" WHERE source_provider = %s AND status = %s', ('KSI', 'ACTIVE'))
        total_active = cur.fetchone()[0]
        scraped_cnt = len(scraped_unit_ids)
        # Ước tính số tài sản sẽ bị archive
        cur.execute('SELECT COUNT(*) FROM "Property" WHERE source_provider = %s AND status = %s AND sale_unit_id != ALL(%s)', ('KSI', 'ACTIVE', scraped_unit_ids))
        potential_ghost = cur.fetchone()[0]
        
        is_safe, reason = is_ghost_sweep_safe(
            total_active=total_active,
            ghost_count=potential_ghost,
            scraped_count=scraped_cnt,
            max_drop_ratio=0.50,
            min_sample=10
        )
        if not is_safe:
            print(f"🛑 [CIRCUIT BREAKER KSI] Hủy Ghost Sweep KSI: {reason}", flush=True)
        else:
            cur.execute("""
                UPDATE "Property"
                SET status = 'ARCHIVED', updated_at = NOW()
                WHERE source_provider = 'KSI'
                  AND status = 'ACTIVE'
                  AND sale_unit_id != ALL(%s)
            """, (scraped_unit_ids,))
            archived = cur.rowcount
            if archived > 0:
                print(f"📦 [GHOST SWEEP KSI] Đã lưu trữ {archived} tài sản không còn mở thầu.", flush=True)

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ KSI Crawler complete: saved={inserted}, skipped_nta={skipped_nta}, archived={archived}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Limit items for dry-run testing")
    args = parser.parse_args()
    run_ksi_crawler(limit=args.limit)
