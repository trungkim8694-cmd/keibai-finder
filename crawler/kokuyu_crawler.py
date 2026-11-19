import os
import re
import sys
import json
import time
import hashlib
import urllib.parse
import argparse
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
    extract_pdf_images_to_vps,
    is_ghost_sweep_safe,
)

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

# All 10 Regional Finance Bureaus (財務局) purchase portals from kokuyuzaisan.mof.go.jp
BUREAU_PORTALS = [
    ("hokkaido", "北海道財務局", "https://lfb.mof.go.jp/hokkaido/kokuyuu/pagehkhp017000068.html"),
    ("tohoku", "東北財務局", "https://lfb.mof.go.jp/tohoku/kanzai/kounyukentou200401.html"),
    ("kantou", "関東財務局", "https://lfb.mof.go.jp/kantou/kanzai/pagekthp035000113.html"),
    ("hokuriku", "北陸財務局", "https://lfb.mof.go.jp/hokuriku/kanzai/pagehokurikuhp015000256.html"),
    ("tokai", "東海財務局", "https://lfb.mof.go.jp/tokai/kanzai/pagetokaihp024000199.html"),
    ("kinki", "近畿財務局", "https://lfb.mof.go.jp/kinki/kanzai/pagekinkihp029000117.html"),
    ("chugoku", "中国財務局", "https://lfb.mof.go.jp/chugoku/kanzai/kounyuukenntou.html"),
    ("shikoku", "四国財務局", "https://lfb.mof.go.jp/shikoku/kanzai/302.html"),
    ("fukuoka", "福岡財務支局", "https://lfb.mof.go.jp/fukuoka/html/kokuyubaikyaku/index.html"),
    ("kyusyu", "九州財務局", "https://lfb.mof.go.jp/kyusyu/kanzai/pagekyusyuhp018000307.html"),
]

SALE_LINK_KEYWORDS = [
    "現在公示中", "一般競争入札物件", "すぐに購入できる", "先着順",
    "物件一覧", "売払物件", "売却物件", "土地・建物",
]


def get_db_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DATABASE_URL)


def map_mof_property_type(chimoku: str, bldg_info: str = "") -> str:
    if bldg_info and any(k in bldg_info for k in ["木造", "鉄骨", "RC", "階建", "住宅", "居宅", "店舗", "倉庫"]):
        if any(k in bldg_info for k in ["マンション", "区分"]):
            return "マンション"
        return "戸建て"
    if any(k in chimoku for k in ["田", "畑", "農地"]):
        return "農地"
    if any(k in chimoku for k in ["宅地", "山林", "雑種地", "原野", "公衆用道路", "土地"]):
        return "土地"
    return "土地"


def clean_mof_address(raw_addr: str, bureau_code: str = "") -> str:
    addr = re.sub(r'\s+', ' ', raw_addr).strip()
    # Remove parenthetical street blocks / 外N筆 notes for geocoding
    addr = re.sub(r'[（(][^）)]*[）)]', '', addr)
    addr = re.sub(r'外\d+筆.*$', '', addr)
    addr = addr.strip()
    if bureau_code == "hokkaido" and addr and not addr.startswith("北海道"):
        addr = f"北海道{addr}"
    return addr


def parse_price_yen(val: str) -> int | None:
    if not val:
        return None
    cleaned = val.replace(",", "").replace("円", "").replace("税込", "").strip()
    m = re.search(r'(\d+)', cleaned)
    if m:
        p = int(m.group(1))
        return p if p >= 10000 else None
    return None


def extract_tables_from_page(url: str, bureau_code: str, bureau_name: str, session: requests.Session) -> list[dict]:
    items = []
    try:
        r = session.get(url, headers={"User-Agent": get_random_user_agent()}, timeout=15)
        if r.status_code != 200:
            return items
        r.encoding = r.apparent_encoding
        soup = BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"⚠️ Error fetching {url}: {e}")
        return items

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue
        headers = [c.get_text(" ", strip=True) for c in rows[0].find_all(["th", "td"])]
        header_str = " ".join(headers)
        if "所在" not in header_str or not any(k in header_str for k in ["金額", "価格", "予定価格", "売払価格"]):
            continue

        # Map column indices dynamically
        col_idx = {}
        for i, h in enumerate(headers):
            if "番号" in h or "No" in h:
                col_idx.setdefault("no", i)
            elif "所在" in h:
                col_idx.setdefault("addr", i)
            elif "地目" in h:
                col_idx.setdefault("chimoku", i)
            elif "建物" in h and ("面積" in h or "延床" in h):
                col_idx.setdefault("bldg_area", i)
            elif "建物の種類" in h or "構造" in h:
                col_idx.setdefault("bldg_type", i)
            elif "面積" in h or "地積" in h:
                col_idx.setdefault("land_area", i)
            elif "金額" in h or "価格" in h:
                col_idx.setdefault("price", i)
            elif "用途地域" in h:
                col_idx.setdefault("zoning", i)
            elif "調書" in h:
                col_idx.setdefault("pdf", i)

        if "addr" not in col_idx:
            continue

        for row in rows[1:]:
            cells = row.find_all(["th", "td"])
            if len(cells) < 3:
                continue
            vals = [c.get_text(" ", strip=True) for c in cells]
            raw_addr = vals[col_idx["addr"]] if col_idx["addr"] < len(vals) else ""
            if not raw_addr or len(raw_addr) < 4:
                continue
            if any(closed in raw_addr for closed in ["受付終了", "売払済", "契約済"]):
                continue

            prop_no = vals[col_idx["no"]] if "no" in col_idx and col_idx["no"] < len(vals) else ""
            price_val = parse_price_yen(vals[col_idx["price"]]) if "price" in col_idx and col_idx["price"] < len(vals) else None
            chimoku = vals[col_idx["chimoku"]] if "chimoku" in col_idx and col_idx["chimoku"] < len(vals) else ""
            bldg_type = vals[col_idx["bldg_type"]] if "bldg_type" in col_idx and col_idx["bldg_type"] < len(vals) else ""
            land_area_str = clean_area_string(vals[col_idx["land_area"]]) if "land_area" in col_idx and col_idx["land_area"] < len(vals) else None
            bldg_area_str = clean_area_string(vals[col_idx["bldg_area"]]) if "bldg_area" in col_idx and col_idx["bldg_area"] < len(vals) else None
            area_float = None
            for s in (bldg_area_str, land_area_str):
                if s:
                    m_a = re.search(r'[\d.]+', str(s).replace(',', ''))
                    if m_a:
                        area_float = float(m_a.group())
                        break
            zoning = vals[col_idx["zoning"]] if "zoning" in col_idx and col_idx["zoning"] < len(vals) else ""

            # PDF links (物件調書 + 現地写真)
            pdf_url = None
            photo_pdf_url = None
            for a in row.find_all("a", href=True):
                href_abs = urllib.parse.urljoin(url, a["href"])
                if ".pdf" not in href_abs.lower():
                    continue
                link_txt = a.get_text(" ", strip=True)
                if any(k in link_txt or k in href_abs.lower() for k in ["写真", "画像", "gazou", "photo"]):
                    if not photo_pdf_url:
                        photo_pdf_url = href_abs
                elif not pdf_url:
                    pdf_url = href_abs

            clean_addr = clean_mof_address(raw_addr, bureau_code)
            pref, city = extract_prefecture_and_city(clean_addr)
            prop_type = map_mof_property_type(chimoku, bldg_type)

            key_seed = f"{bureau_code}_{prop_no}_{clean_addr}"
            short_hash = hashlib.md5(key_seed.encode("utf-8")).hexdigest()[:8]
            safe_no = re.sub(r'[^a-zA-Z0-9_-]', '', prop_no) or short_hash
            uid = f"MOF_{bureau_code}_{safe_no}_{short_hash[:4]}"

            items.append({
                "sale_unit_id": uid,
                "source_provider": "MOF",
                "source_url": url,
                "court_name": bureau_name,
                "managing_authority": f"財務省 {bureau_name}",
                "property_type": prop_type,
                "address": clean_addr,
                "prefecture": pref,
                "city": city,
                "starting_price": price_val,
                "area": area_float,
                "pdf_url": pdf_url,
                "photo_pdf_url": photo_pdf_url,
                "raw_display_data": {
                    "bureau": bureau_name,
                    "property_no": prop_no,
                    "raw_address": raw_addr,
                    "chimoku": chimoku,
                    "land_area": land_area_str,
                    "building_area": bldg_area_str,
                    "zoning": zoning,
                    "building_structure": bldg_type,
                    "source_url": url,
                },
                "raw_text": f"財務省 {bureau_name} 物件番号:{prop_no} 所在:{raw_addr} 地目:{chimoku} 用途地域:{zoning} {bldg_type}",
            })
    return items


def discover_bureau_listing_pages(portal_url: str, bureau_code: str, session: requests.Session) -> list[str]:
    visited = set()
    listing_pages = []
    queue = [(portal_url, 0)]

    while queue:
        u, depth = queue.pop(0)
        if u in visited or depth > 2:
            continue
        visited.add(u)
        try:
            r = session.get(u, headers={"User-Agent": get_random_user_agent()}, timeout=15)
            if r.status_code != 200:
                continue
            r.encoding = r.apparent_encoding
            soup = BeautifulSoup(r.text, "html.parser")
            if depth > 0:
                listing_pages.append(u)
            if depth < 2:
                for a in soup.find_all("a", href=True):
                    href = urllib.parse.urljoin(u, a["href"])
                    if not href.startswith(f"https://lfb.mof.go.jp/{bureau_code}/"):
                        continue
                    if href.lower().endswith(".pdf"):
                        continue
                    txt = a.get_text(" ", strip=True)
                    if any(k in txt for k in SALE_LINK_KEYWORDS):
                        if href not in visited:
                            queue.append((href, depth + 1))
        except Exception:
            continue
    return listing_pages


def run_kokuyu_crawler(limit: int = 0):
    print("🚀 Starting Kokuyu (国有財産売却 / 財務省) Crawler...")
    session = requests.Session()
    all_items = []
    seen_uids = set()

    for bureau_code, bureau_name, portal_url in BUREAU_PORTALS:
        pages = discover_bureau_listing_pages(portal_url, bureau_code, session)
        bureau_count = 0
        for p_url in pages:
            found = extract_tables_from_page(p_url, bureau_code, bureau_name, session)
            for item in found:
                if item["sale_unit_id"] not in seen_uids:
                    seen_uids.add(item["sale_unit_id"])
                    all_items.append(item)
                    bureau_count += 1
        print(f"  🏛️ {bureau_name}: {len(pages)} pages scanned -> {bureau_count} properties")
        if limit > 0 and len(all_items) >= limit:
            break

    print(f"🔎 Total MOF properties discovered: {len(all_items)}")
    if limit > 0:
        all_items = all_items[:limit]
        print(f"🧪 --limit={limit}: processing {len(all_items)} items.")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT sale_unit_id, starting_price, lat, lng, status, COALESCE(array_length(images, 1), 0) > 0 AS has_imgs
        FROM "Property"
        WHERE source_provider = 'MOF'
    """)
    db_cache = {
        row[0]: {"price": row[1], "lat": row[2], "lng": row[3], "status": row[4], "has_imgs": row[5]}
        for row in cur.fetchall()
    }

    scraped_unit_ids = []
    inserted = 0

    for idx, item in enumerate(all_items, 1):
        try:
            uid = item["sale_unit_id"]
            scraped_unit_ids.append(uid)
            cached = db_cache.get(uid)

            lat = cached["lat"] if cached and cached["lat"] else None
            lng = cached["lng"] if cached and cached["lng"] else None

            if (lat is None or lng is None) and item["address"]:
                lat, lng = geocode_address(item["address"])
                time.sleep(0.25)

            st_name, line_name, dist_m, walk_min = (None, None, None, None)
            if lat is not None and lng is not None:
                st_name, line_name, dist_m, walk_min = get_nearest_station_from_db(lat, lng, cur)

            # Extract images from 現地写真 PDF (or fallback to 物件調書 PDF) if not yet cached
            extracted_images = []
            if not cached or not cached.get("has_imgs"):
                target_pdf = item.get("photo_pdf_url") or item.get("pdf_url")
                if target_pdf:
                    try:
                        r_pdf = session.get(target_pdf, headers={"User-Agent": get_random_user_agent()}, timeout=25)
                        if r_pdf.status_code == 200 and r_pdf.content.startswith(b"%PDF"):
                            extracted_images = extract_pdf_images_to_vps(r_pdf.content, uid, max_images=5)
                            if extracted_images:
                                print(f"      [MOF PDF] {uid}: extracted {len(extracted_images)} photos", flush=True)
                    except Exception as pdf_e:
                        print(f"      [MOF PDF Warning] {uid}: {pdf_e}", flush=True)

            thumb_url = extracted_images[0] if extracted_images else None

            cur.execute("""
                INSERT INTO "Property" (
                    sale_unit_id, source_provider, source_url, court_name, managing_authority,
                    property_type, address, prefecture, city, lat, lng,
                    starting_price, area, pdf_url,
                    nearest_station, line_name, distance_to_station, walk_time_to_station,
                    "thumbnailUrl", images,
                    raw_display_data, raw_text,
                    status, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s,
                    %s, %s,
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
                    pdf_url = COALESCE(EXCLUDED.pdf_url, "Property".pdf_url),
                    nearest_station = COALESCE(EXCLUDED.nearest_station, "Property".nearest_station),
                    line_name = COALESCE(EXCLUDED.line_name, "Property".line_name),
                    distance_to_station = COALESCE(EXCLUDED.distance_to_station, "Property".distance_to_station),
                    walk_time_to_station = COALESCE(EXCLUDED.walk_time_to_station, "Property".walk_time_to_station),
                    "thumbnailUrl" = COALESCE(EXCLUDED."thumbnailUrl", "Property"."thumbnailUrl"),
                    images = CASE
                        WHEN COALESCE(array_length(EXCLUDED.images, 1), 0) > 0 THEN EXCLUDED.images
                        ELSE "Property".images
                    END,
                    raw_display_data = EXCLUDED.raw_display_data,
                    raw_text = EXCLUDED.raw_text,
                    status = 'ACTIVE',
                    updated_at = NOW();
            """, (
                uid, "MOF", item["source_url"], item["court_name"], item["managing_authority"],
                item["property_type"], item["address"], item["prefecture"], item["city"], lat, lng,
                item["starting_price"], item["area"], item["pdf_url"],
                st_name, line_name, dist_m, walk_min,
                thumb_url, extracted_images,
                json.dumps(item["raw_display_data"], ensure_ascii=False), item["raw_text"],
            ))
            inserted += 1
            if idx % 20 == 0:
                conn.commit()
        except Exception as e:
            print(f"⚠️ Error processing MOF {item.get('sale_unit_id')}: {e}")
            conn.rollback()

    # Ghost Sweep O(1) only on full run với Circuit Breaker
    archived = 0
    if limit == 0 and scraped_unit_ids:
        cur.execute('SELECT COUNT(*) FROM "Property" WHERE source_provider = %s AND status = %s', ('MOF', 'ACTIVE'))
        total_active = cur.fetchone()[0]
        scraped_cnt = len(scraped_unit_ids)
        # Ước tính số tài sản sẽ bị archive
        cur.execute('SELECT COUNT(*) FROM "Property" WHERE source_provider = %s AND status = %s AND sale_unit_id != ALL(%s)', ('MOF', 'ACTIVE', scraped_unit_ids))
        potential_ghost = cur.fetchone()[0]
        
        is_safe, reason = is_ghost_sweep_safe(
            total_active=total_active,
            ghost_count=potential_ghost,
            scraped_count=scraped_cnt,
            max_drop_ratio=0.50,
            min_sample=10
        )
        if not is_safe:
            print(f"🛑 [CIRCUIT BREAKER MOF] Hủy Ghost Sweep MOF: {reason}", flush=True)
        else:
            cur.execute("""
                UPDATE "Property"
                SET status = 'ARCHIVED', updated_at = NOW()
                WHERE source_provider = 'MOF'
                  AND status = 'ACTIVE'
                  AND sale_unit_id != ALL(%s)
            """, (scraped_unit_ids,))
            archived = cur.rowcount
            if archived > 0:
                print(f"📦 [GHOST SWEEP MOF] Đã lưu trữ {archived} tài sản không còn mở thầu.", flush=True)

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Kokuyu Crawler complete: saved={inserted}, archived={archived}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Limit items for dry-run testing")
    args = parser.parse_args()
    run_kokuyu_crawler(limit=args.limit)
