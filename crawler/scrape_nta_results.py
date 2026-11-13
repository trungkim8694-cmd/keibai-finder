"""
Crawler Kết quả Công bán Quốc thuế (NTA Koubai Results Crawler)
=============================================================
Thu thập và bóc tách dữ liệu kết quả đấu giá từ Cổng thông tin Công bán Quốc thuế (NTA):
- Hub: https://www.koubai.nta.go.jp/auctionx/public/hp001_01.php?pageid=0&doc=17
- Detail: https://www.koubai.nta.go.jp/auctionx/public/hp0743.php
- Item: https://www.koubai.nta.go.jp/auctionx/public/hp0201.php

Đồng bộ:
- Ghi nhận lịch sử vào bảng "AuctionResult" (có completionDate, sale_unit_id, source=NTA).
- Cập nhật trạng thái Property.status = 'SOLD' khi tài sản bán thành công.
"""

import os
import sys
import re
import json
import time
import random
import unicodedata
import requests
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Đảm bảo mã hóa UTF-8 trên Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load môi trường
load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env'))
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.split("?")[0]

from crawler_utils import geocode_address, get_gsi_coords

NTA_BASE_URL = "https://www.koubai.nta.go.jp/auctionx/public"

REGIONAL_BUREAUS = [
    ("01001", "札幌国税局"),
    ("02001", "仙台国税局"),
    ("03001", "関東信越国税局"),
    ("04001", "東京国税局"),
    ("05001", "金沢国税局"),
    ("06001", "名古屋国税局"),
    ("07001", "大阪国税局"),
    ("08001", "広島国税局"),
    ("09001", "高松国税局"),
    ("10001", "福岡国税局"),
    ("11001", "熊本国税局"),
    ("12001", "沖縄国税事務所"),
]

def to_half_width(text):
    if not text:
        return ""
    return unicodedata.normalize('NFKC', str(text)).strip()

def parse_price(val_str):
    if not val_str:
        return None
    hw = to_half_width(val_str)
    cleaned = re.sub(r'[^\d]', '', hw)
    return int(cleaned) if cleaned else None

def parse_japanese_datetime(dt_str):
    if not dt_str:
        return None
    hw = to_half_width(dt_str)
    m = re.search(r'(?:令和|平成|昭和)?\s*([0-9元]+)年\s*([0-9]+)月\s*([0-9]+)日', hw)
    if not m:
        return None
    
    y_val = 1 if m.group(1) == '元' else int(m.group(1))
    year = 2018 + y_val
    if '平成' in hw:
        year = 1988 + y_val
    elif '昭和' in hw:
        year = 1925 + y_val
    
    month = int(m.group(2))
    day = int(m.group(3))
    
    hour = 10
    minute = 0
    time_m = re.search(r'(午前|午後)?\s*([0-9]+)時(?:\s*([0-9]+)分)?', hw)
    if time_m:
        ampm = time_m.group(1)
        h = int(time_m.group(2))
        minute = int(time_m.group(3)) if time_m.group(3) else 0
        if ampm == '午後' and h < 12:
            h += 12
        elif ampm == '午前' and h == 12:
            h = 0
        hour = h
        
    try:
        return datetime(year, month, day, hour, minute)
    except Exception:
        return None

def normalize_sale_unit_id(code_str):
    if not code_str:
        return None, None
    hw = to_half_width(code_str).replace(' ', '')
    parts = hw.split('-')
    if len(parts) != 2:
        return None, None
    try:
        prefix = int(parts[0])
        sub = int(parts[1])
        fmt1 = f"{prefix}{sub:04d}"
        fmt2 = f"{prefix:04d}{sub:04d}"
        return fmt1, fmt2
    except ValueError:
        return None, None

def probe_single_url(target):
    kyoku_no, bureau_name, k_no = target
    k_no_str = f"{k_no:02d}"
    probe_url = f"{NTA_BASE_URL}/hp0743.php?fno=0&kyoku_no={kyoku_no}&koubai_nendo=2026&koubai_kind=2&koubai_no={k_no_str}"
    try:
        # Giãn cách nhẹ nhàng để không dồn dập vào cổng NTA
        time.sleep(random.uniform(0.3, 0.8))
        r = requests.get(probe_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        if "売却区分番号" in r.text and "開札期日" in r.text:
            return probe_url
    except Exception:
        pass
    return None

def crawl_nta_results():
    print("=" * 70, flush=True)
    print(" BẮT ĐẦU CRAWLER KẾT QUẢ CÔNG BÁN QUỐC THẾ (NTA KOUBAI RESULTS)", flush=True)
    print("=" * 70, flush=True)

    if not db_url:
        print("[LỖI] DATABASE_URL không được tìm thấy!", flush=True)
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Tải Memory Cache từ CSDL
    print("[Memory Cache] Đang tải danh sách tài sản NTA từ CSDL vào RAM...", flush=True)
    cur.execute("""
        SELECT sale_unit_id, address, lat, lng, starting_price, status 
        FROM "Property" 
        WHERE source_provider = 'NTA'
    """)
    property_cache = {}
    for r in cur.fetchall():
        property_cache[r[0]] = {
            "address": r[1],
            "lat": r[2],
            "lng": r[3],
            "price": r[4],
            "status": r[5]
        }
    print(f"[Memory Cache] Đã tải {len(property_cache)} tài sản NTA từ bảng Property.", flush=True)

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    })

    # 2. Khám phá các phiên công bán có kết quả
    discovered_urls = []

    # A. Quét từ trang chủ kết quả: doc=17
    main_url = f"{NTA_BASE_URL}/hp001_01.php?pageid=0&doc=17"
    try:
        print(f"[Hub] Đang quét Hub kết quả chính: {main_url}", flush=True)
        res = session.get(main_url, timeout=10)
        res.encoding = 'utf-8'
        soup = BeautifulSoup(res.text, 'html.parser')
        for a in soup.find_all('a', href=True):
            if 'hp0743.php' in a['href']:
                full_url = a['href'] if a['href'].startswith('http') else f"{NTA_BASE_URL}/{a['href']}"
                if full_url not in discovered_urls:
                    discovered_urls.append(full_url)
        print(f"[Hub] Tìm thấy {len(discovered_urls)} phiên kết quả từ doc=17.", flush=True)
    except Exception as e:
        print(f"[Hub Lỗi] Không thể truy cập doc=17: {e}", flush=True)

    # B. Dùng ThreadPool quét siêu nhanh các phiên bổ sung
    targets = []
    for kyoku_no, bureau_name in REGIONAL_BUREAUS:
        for k_no in range(1, 10):
            targets.append((kyoku_no, bureau_name, k_no))

    print(f"[Probe] Đang kiểm tra {len(targets)} cấu hình qua 3 luồng nhẹ nhàng...", flush=True)
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = executor.map(probe_single_url, targets)
        for valid_url in results:
            if valid_url and valid_url not in discovered_urls:
                print(f"  [Probe Phát hiện thêm] {valid_url}", flush=True)
                discovered_urls.append(valid_url)

    print(f"[Tổng kết Hub] Đã xác định {len(discovered_urls)} phiên kết quả đấu giá hợp lệ.", flush=True)

    # 3. Bóc tách từng phiên kết quả
    total_saved = 0
    total_sold_status_updated = 0

    for idx, session_url in enumerate(discovered_urls):
        print(f"\n--- [{idx+1}/{len(discovered_urls)}] Đang bóc tách: {session_url} ---", flush=True)
        try:
            res = session.get(session_url, timeout=10)
            res.encoding = 'utf-8'
            soup = BeautifulSoup(res.text, 'html.parser')
            tables = soup.find_all('table')
            if len(tables) < 2:
                print("  [Bỏ qua] Không đủ bảng dữ liệu.", flush=True)
                continue

            # Bảng 0: Header
            header_map = {}
            for tr in tables[0].find_all('tr'):
                cells = tr.find_all(['th', 'td'])
                if len(cells) >= 2:
                    k = to_half_width(cells[0].get_text())
                    v = to_half_width(cells[1].get_text())
                    header_map[k] = v

            open_date_raw = header_map.get('開札期日', '')
            completion_date = parse_japanese_datetime(open_date_raw)
            bureau_name = header_map.get('売却決定の場所', '国税局')
            for _, b_name in REGIONAL_BUREAUS:
                if b_name[:3] in bureau_name:
                    bureau_name = b_name
                    break

            koubai_notice_no = header_map.get('公売公告番号', '')
            print(f"  Cơ quan: {bureau_name} | Công cáo: {koubai_notice_no} | 開札日: {completion_date}", flush=True)

            # Bảng 1: Danh sách tài sản
            items_table = tables[1]
            rows = items_table.find_all('tr')
            for r_idx, row in enumerate(rows[1:], start=1):
                cols = row.find_all(['th', 'td'])
                if len(cols) < 3:
                    continue

                code_raw = cols[0].get_text(strip=True)
                winner_type_raw = cols[1].get_text(strip=True)
                price_raw = cols[2].get_text(strip=True)

                winning_price = parse_price(price_raw)
                fmt1, fmt2 = normalize_sale_unit_id(code_raw)
                if not fmt1:
                    continue

                matched_id = None
                prop_data = None
                for candidate_id in [fmt1, fmt2]:
                    if candidate_id in property_cache:
                        matched_id = candidate_id
                        prop_data = property_cache[candidate_id]
                        break

                if not matched_id:
                    matched_id = fmt1

                is_sold = "最高価申込者" in winner_type_raw or "買受" in winner_type_raw
                if is_sold:
                    winner_type_display = "最高価申込者（落札）"
                    bidder_count = 1
                elif "なし" in winner_type_raw:
                    winner_type_display = "入札なし（不落）"
                    bidder_count = 0
                else:
                    winner_type_display = winner_type_raw or "その他"
                    bidder_count = None

                address = None
                base_price = None
                lat, lng = None, None

                if prop_data:
                    address = prop_data.get("address")
                    lat = prop_data.get("lat")
                    lng = prop_data.get("lng")
                    base_price = prop_data.get("price")
                else:
                    m_kyoku = re.search(r'kyoku_no=([^&]+)', session_url)
                    m_nendo = re.search(r'koubai_nendo=([^&]+)', session_url)
                    m_kind = re.search(r'koubai_kind=([^&]+)', session_url)
                    m_kno = re.search(r'koubai_no=([^&]+)', session_url)

                    if m_kyoku and m_nendo and m_kind and m_kno:
                        detail_url = f"{NTA_BASE_URL}/hp0201.php?kyoku_no={m_kyoku.group(1)}&koubai_nendo={m_nendo.group(1)}&koubai_kind={m_kind.group(1)}&koubai_no={m_kno.group(1)}&baikyaku_no={matched_id}"
                        try:
                            d_res = session.get(detail_url, timeout=5)
                            if d_res.status_code == 200 and "不動産詳細情報" in d_res.text:
                                d_soup = BeautifulSoup(d_res.content.decode('utf-8', errors='ignore'), 'html.parser')
                                for d_tr in d_soup.find_all('tr'):
                                    d_cols = [to_half_width(c.get_text(strip=True)) for c in d_tr.find_all(['th', 'td'])]
                                    if len(d_cols) >= 2:
                                        if '所在地' in d_cols[0] and not address:
                                            address = d_cols[1].split('\n')[0].strip()
                                        elif '見積価額' in d_cols[0] and not base_price:
                                            base_price = parse_price(d_cols[1])

                                if address:
                                    lat, lng = get_gsi_coords(address)
                                    if not lat:
                                        lat, lng = geocode_address(address)
                        except Exception:
                            pass

                margin_rate = None
                if winning_price and base_price and base_price > 0 and winning_price > 0:
                    margin_rate = round((winning_price - base_price) / float(base_price), 4)

                comp_level = "低競争"
                if is_sold and winning_price and base_price:
                    if winning_price >= base_price * 1.5:
                        comp_level = "高競争"
                    elif winning_price >= base_price * 1.1:
                        comp_level = "中競争"

                case_number = f"公売 第{koubai_notice_no} 売却区分{code_raw}"

                raw_data = {
                    "source": "NTA",
                    "bureau": bureau_name,
                    "koubai_notice_no": koubai_notice_no,
                    "sale_code_raw": code_raw,
                    "winner_type_raw": winner_type_raw,
                    "url": session_url
                }

                upsert_sql = """
                    INSERT INTO "AuctionResult" (
                        id, sale_unit_id, "caseNumber", address, lat, lng,
                        "basePrice", "winningPrice", "bidderCount", "winnerType",
                        "marginRate", "competitionLevel", "completionDate",
                        raw_data, created_at
                    ) VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s,
                        %s::jsonb, NOW()
                    )
                    ON CONFLICT (sale_unit_id) DO UPDATE SET
                        "completionDate" = EXCLUDED."completionDate",
                        "winningPrice" = EXCLUDED."winningPrice",
                        "basePrice" = COALESCE(EXCLUDED."basePrice", "AuctionResult"."basePrice"),
                        "winnerType" = EXCLUDED."winnerType",
                        "marginRate" = EXCLUDED."marginRate",
                        "competitionLevel" = EXCLUDED."competitionLevel",
                        raw_data = EXCLUDED.raw_data;
                """
                cur.execute(upsert_sql, (
                    matched_id, case_number, address, lat, lng,
                    base_price, winning_price, bidder_count, winner_type_display,
                    margin_rate, comp_level, completion_date,
                    json.dumps(raw_data, ensure_ascii=False)
                ))
                total_saved += 1

                if is_sold and matched_id in property_cache:
                    cur.execute("""
                        UPDATE "Property" 
                        SET status = 'SOLD', updated_at = NOW() 
                        WHERE sale_unit_id = %s AND status != 'SOLD'
                    """, (matched_id,))
                    if cur.rowcount > 0:
                        total_sold_status_updated += 1
                        print(f"    [ĐỒNG BỘ SOLD] Property {matched_id} -> SOLD", flush=True)

                conn.commit()
                sold_info = f"Bán: {winning_price:,}円" if winning_price else "Không có người mua"
                print(f"    [LƯU] {code_raw} (ID: {matched_id}) | {address or 'N/A'} | {winner_type_display} | {sold_info}", flush=True)

        except Exception as e_session:
            print(f"  [LỖI PHIÊN] {session_url}: {e_session}", flush=True)
            conn.rollback()

    cur.close()
    conn.close()

    print("\n" + "=" * 70, flush=True)
    print(" HOÀN TẤT CRAWLER KẾT QUẢ CÔNG BÁN QUỐC THẾ (NTA)", flush=True)
    print(f" - Tổng số bản ghi kết quả đã lưu/cập nhật: {total_saved}", flush=True)
    print(f" - Số tài sản trong bảng Property chuyển sang 'SOLD': {total_sold_status_updated}", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    crawl_nta_results()
