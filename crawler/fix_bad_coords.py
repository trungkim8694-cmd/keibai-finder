"""
fix_bad_coords.py
-----------------
Script chạy 1 lần để phát hiện và sửa các tài sản có tọa độ sai
(ngoài lãnh thổ Nhật Bản hoặc NULL) bằng cách geocode lại qua OSM Nominatim.

Chạy: python fix_bad_coords.py
"""

import os
import re
import time
import psycopg2
import requests
import unicodedata
import urllib.parse
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

JAPAN_BOUNDS = {"lat_min": 24.0, "lat_max": 46.0, "lng_min": 122.0, "lng_max": 154.0}

def is_valid_japan_coords(lat, lng):
    if lat is None or lng is None:
        return False
    return (JAPAN_BOUNDS["lat_min"] <= float(lat) <= JAPAN_BOUNDS["lat_max"] and
            JAPAN_BOUNDS["lng_min"] <= float(lng) <= JAPAN_BOUNDS["lng_max"])

def to_half_width(text):
    return unicodedata.normalize('NFKC', text)

def aggressive_clean(address):
    addr = to_half_width(address)
    addr = re.sub(r'[番番地号]$', '', addr)
    addr = re.sub(r'番地?', '-', addr)
    addr = re.sub(r'号', '', addr)
    addr = re.sub(r'-+', '-', addr).strip('-')
    return addr

def reverse_validate_coords(lat, lng, original_address):
    if not is_valid_japan_coords(lat, lng):
        return False
    try:
        time.sleep(1.2)
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        res = requests.get(url, headers={"User-Agent": "KeibaiFinderApp/1.0 (kimtrung@keibai)"}, timeout=10)
        rev = res.json()
        addr_parts = rev.get('address', {})
        returned_place = ' '.join([
            addr_parts.get('city', ''),
            addr_parts.get('town', ''),
            addr_parts.get('village', ''),
            addr_parts.get('county', ''),
            addr_parts.get('province', ''),
            addr_parts.get('subprovince', ''),
        ])
        
        # Tiêu chuẩn validation đa lớp
        import re as _re
        m_city = _re.search(r'(?:都|道|府|県)([^\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', original_address)
        m_pref = _re.search(r'([\u3040-\u9fff]+(?:都|道|府|県))', original_address)
        m_city_bare = _re.search(r'^([\u3040-\u9fff]+(?:市|区|郡|町|村))', original_address)
        m_town = _re.search(r'郡([\u3040-\u9fff]+?(?:町|村))', original_address)
        m_county = _re.search(r'([\u3040-\u9fff]+郡)', original_address)
        
        expected_parts = []
        if m_city: expected_parts.append(m_city.group(1).strip())
        if m_pref: expected_parts.append(m_pref.group(1))
        if m_city_bare and not m_city: expected_parts.append(m_city_bare.group(1))
        if m_town: expected_parts.append(m_town.group(1))
        if m_county: expected_parts.append(m_county.group(1))
        
        if not expected_parts:
            return True
        
        is_match = any(part in returned_place for part in expected_parts)
        if not is_match:
            print(f"      [Reverse-Mismatch] Gốc '{expected_parts}' | OSM: '{returned_place.strip()}'")
        return is_match
    except Exception as e:
        print(f"      [Reverse-Error]: {e}")
        return True

def get_osm_coords(addr, original_address=None):
    time.sleep(1.2)
    headers = {"User-Agent": "KeibaiFinderApp/1.0 (kimtrung@keibai)"}
    query = f"{addr}, Japan"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        data = res.json()
        if data and len(data) > 0:
            lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
            check_addr = original_address or addr
            if reverse_validate_coords(lat, lng, check_addr):
                return lat, lng
            else:
                print(f"      [OSM-Rejected] {lat},{lng} không khớp '{addr}'")
    except Exception as e:
        print(f"      [OSM-Error]: {e}")
    return None, None

from crawler_utils import get_gsi_coords

def geocode_address(address):
    if not address or address.strip() == "Unknown":
        return None, None
    clean_addr = aggressive_clean(address)

    # Layer 00: GSI API
    lat_gsi, lng_gsi = get_gsi_coords(clean_addr)
    if lat_gsi and lng_gsi:
        if reverse_validate_coords(lat_gsi, lng_gsi, address):
            return lat_gsi, lng_gsi
        else:
            print(f"      [GSI-Rejected] {lat_gsi},{lng_gsi} không khớp '{address}'")

    # Layer 0: Đầy đủ
    lat, lng = get_osm_coords(clean_addr, address)
    if lat and lng:
        return lat, lng

    # Layer 1: Cấp phường
    m = re.match(r"^(.*?)[0-9\-]+$", clean_addr)
    if m:
        addr1 = m.group(1).strip()
        print(f"      [L1] Thử: {addr1}")
        lat, lng = get_osm_coords(addr1, address)
        if lat and lng:
            return lat, lng

    # Layer 2: Cấp quận/thành phố
    m2 = re.match(r"(.*?[都道府県]?.*?[市区郡町村])", clean_addr)
    if m2:
        addr2 = m2.group(1).strip()
        addr1_val = m.group(1).strip() if m else ''
        if addr2 != clean_addr and addr2 != addr1_val:
            print(f"      [L2] Thử: {addr2}")
            lat, lng = get_osm_coords(addr2, address)
            if lat and lng:
                return lat, lng

    return None, None


def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Tìm tất cả tài sản bị lỗi tọa độ:
    # 1. lat/lng = NULL
    # 2. Tọa độ ngoài biên giới Nhật Bản
    cur.execute("""
        SELECT sale_unit_id, address, lat, lng
        FROM "Property"
        WHERE lat IS NULL
           OR lng IS NULL
           OR lat < 24 OR lat > 46
           OR lng < 122 OR lng > 154
        ORDER BY updated_at ASC
    """)
    rows = cur.fetchall()
    print(f"\n=== Tìm thấy {len(rows)} tài sản cần sửa tọa độ ===\n")

    fixed = 0
    failed = 0

    for i, (sale_unit_id, address, old_lat, old_lng) in enumerate(rows):
        status = "NULL" if old_lat is None else f"{round(float(old_lat),4)},{round(float(old_lng),4)}"
        print(f"[{i+1}/{len(rows)}] {sale_unit_id} | Cũ: {status}")
        print(f"         Địa chỉ: {address}")

        lat, lng = geocode_address(address)

        if lat and lng:
            cur.execute(
                'UPDATE "Property" SET lat=%s, lng=%s, updated_at=NOW() WHERE sale_unit_id=%s',
                (lat, lng, sale_unit_id)
            )
            conn.commit()
            print(f"         ✅ Đã sửa: {lat},{lng}\n")
            fixed += 1
        else:
            # Giữ nguyên NULL, không dùng random
            cur.execute(
                'UPDATE "Property" SET lat=NULL, lng=NULL WHERE sale_unit_id=%s',
                (sale_unit_id,)
            )
            conn.commit()
            print(f"         ❌ Không geocode được → giữ NULL\n")
            failed += 1

    cur.close()
    conn.close()

    print(f"\n=== HOÀN THÀNH ===")
    print(f"✅ Đã sửa: {fixed} tài sản")
    print(f"❌ Không sửa được (NULL): {failed} tài sản")


if __name__ == "__main__":
    main()
