import re
import math
import unicodedata
import datetime
import urllib.parse
import requests
import random
import os
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env'))

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

COURT_PREFIX_MAPPING = {
    "札幌": "北海道", "函館": "北海道", "旭川": "北海道", "釧路": "北海道",
    "青森": "青森県", "盛岡": "岩手県", "仙台": "宮城県", "秋田": "秋田県",
    "山形": "山形県", "福島": "福島県", "水戸": "茨城県", "宇都宮": "栃木県",
    "前橋": "群馬県", "さいたま": "埼玉県", "千葉": "千葉県", "東京": "東京都", "立川": "東京都",
    "横浜": "神奈川県", "新潟": "新潟県", "富山": "富山県", "金沢": "石川県",
    "福井": "福井県", "甲府": "山梨県", "長野": "長野県", "岐阜": "岐阜県",
    "静岡": "静岡県", "名古屋": "愛知県", "津": "三重県", "大津": "滋賀県",
    "京都": "京都府", "大阪": "大阪府", "神戸": "兵庫県", "奈良": "奈良県",
    "和歌山": "和歌山県", "鳥取": "鳥取県", "松江": "島根県", "岡山": "岡山県",
    "広島": "広島県", "山口": "山口県", "徳島": "徳島県", "高松": "香川県",
    "松山": "愛媛県", "高知": "高知県", "福岡": "福岡県", "佐賀": "佐賀県",
    "長崎": "長崎県", "熊本": "熊本県", "大分": "大分県", "宮崎": "宮崎県",
    "鹿児島": "鹿児島県", "那覇": "沖縄県"
}

def prepend_prefecture(address, court_name):
    if not address or address == "Unknown":
        return address
    matched_pref = None
    for court_key, pref in COURT_PREFIX_MAPPING.items():
        if court_name.startswith(court_key):
            matched_pref = pref
            break
    if matched_pref and not address.startswith(matched_pref):
        return f"{matched_pref}{address}"
    return address

def get_gsi_coords(address):
    """
    Gọi API GSI (Quốc thổ Địa lý Viện Nhật Bản) để lấy toạ độ siêu chuẩn cho địa chỉ.
    Docs: https://msearch.gsi.go.jp/address-search/AddressSearch?q=
    Returns: lat, lng (float) or None, None
    """
    if not address: return None, None
    try:
        url = f"https://msearch.gsi.go.jp/address-search/AddressSearch?q={urllib.parse.quote(address)}"
        res = requests.get(url, timeout=10)
        data = res.json()
        if data and isinstance(data, list) and len(data) > 0:
            # GSI API trả về [lng, lat] trong geometry.coordinates
            coords = data[0].get("geometry", {}).get("coordinates", [])
            if len(coords) == 2:
                lng, lat = coords[0], coords[1]
                print(f"      [GSI-Success] Lấy toạ độ từ cơ sở dữ liệu quốc gia: {lat},{lng}")
                return float(lat), float(lng)
    except Exception as e:
        print(f"      [GSI-Error] API lỗi: {e}")
    return None, None


def clean_area_string(val):
    if not val:
        return None
    raw = str(val).split('\n')[0]
    hw = unicodedata.normalize('NFKC', raw) # Full to Half-width
    clean_str = re.sub(r'[,，\s]', '', hw) # Remove all commas
    m = re.search(r'(\d+(?:\.\d+)?)', clean_str)
    if m:
        return float(m.group(1))
    return None

def convert_reiwa_to_datetime(date_str):
    if not date_str:
        return None
    date_str = str(date_str)
    # Ex: 〜令和08年04月14日
    matches = list(re.finditer(r'令和([0-9０-９]+)年([0-9０-９]+)月([0-9０-９]+)日', date_str))
    if not matches:
        return None
    
    # If there are multiple dates (e.g. range), usually bid_end_date is the LAST date in the range, or the only date.
    last_match = matches[-1]
    
    try:
        y = int(unicodedata.normalize('NFKC', last_match.group(1)))
        m = int(unicodedata.normalize('NFKC', last_match.group(2)))
        d = int(unicodedata.normalize('NFKC', last_match.group(3)))
        year = y + 2018
        return f"{year}-{m:02d}-{d:02d}T23:59:59+09:00"
    except:
        return None

def convert_reiwa_range_to_datetimes(date_str):
    if not date_str:
        return None, None
    date_str = str(date_str)
    # Match generic range
    matches = list(re.finditer(r'(?:令和|平成|昭和)([0-9０-９元]+)年([0-9０-９]+)月([0-9０-９]+)日', date_str))
    
    start_date, end_date = None, None
    
    def parse_match(match):
        era = match.group(0)[:2] # 令和 or 平成 etc
        y_str = unicodedata.normalize('NFKC', match.group(1))
        y_val = 1 if y_str == "元" else int(y_str)
        m = int(unicodedata.normalize('NFKC', match.group(2)))
        d = int(unicodedata.normalize('NFKC', match.group(3)))
        year = 2018 + y_val if era == "令和" else 1988 + y_val if era == "平成" else 1925 + y_val if era == "昭和" else 2024
        
        # Determine if it's start or end based on context, but typically we return the formatted string.
        # It will be assigned later based on the array. We default to midnight for start, end of day for end.
        return year, m, d
        
    try:
        if matches:
            e_y, e_m, e_d = parse_match(matches[-1])
            end_date = f"{e_y}-{e_m:02d}-{e_d:02d}T23:59:59+09:00"
            if len(matches) > 1:
                s_y, s_m, s_d = parse_match(matches[0])
                start_date = f"{s_y}-{s_m:02d}-{s_d:02d}T00:00:00+09:00"
    except Exception as e:
        print(f"Error parsing date {date_str}: {e}")
        
    return start_date, end_date

def get_nearest_station_from_db(lat, lng, cur):
    if not lat or not lng:
        return None, None, None, None
        
    sql = f"""
      SELECT 
        "name_ja", "line_name",
        ( 6371 * acos( cos( radians({lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians({lng}) ) + sin( radians({lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
      FROM "RailwayStation"
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    """
    try:
        cur.execute(sql)
        row = cur.fetchone()
        if row:
            name_ja, line_name, dist_km = row
            if dist_km is not None and dist_km < 100: # 100km reasonable limit
                dist_m = int(dist_km * 1000)
                walk_min = math.ceil((dist_km * 1000 * 1.25) / 80.0)
                st_name = name_ja
                if line_name in ['Unknown Railway', '未知の路線', '']:
                    line_name = None
                elif line_name:
                    line_name = line_name.split(';')[0].split(',')[0].strip()
                return st_name, line_name, dist_m, walk_min
    except Exception as e:
        print(f"      [Station DB Error]: {e}")
    return None, None, None, None

def to_half_width(text):
    return unicodedata.normalize('NFKC', text)

def aggressive_clean(address):
    if not address: return ""
    addr = to_half_width(address)
    addr = re.sub(r'[番番地号]$', '', addr)
    addr = re.sub(r'番地?', '-', addr)
    addr = re.sub(r'号', '', addr)
    addr = re.sub(r'-+', '-', addr).strip('-')
    return addr

JAPAN_BOUNDS = {"lat_min": 24.0, "lat_max": 46.0, "lng_min": 122.0, "lng_max": 154.0}

def is_valid_japan_coords(lat, lng):
    if lat is None or lng is None:
        return False
    return (JAPAN_BOUNDS["lat_min"] <= float(lat) <= JAPAN_BOUNDS["lat_max"] and
            JAPAN_BOUNDS["lng_min"] <= float(lng) <= JAPAN_BOUNDS["lng_max"])

def reverse_validate_coords(lat, lng, original_address):
    if not is_valid_japan_coords(lat, lng):
        return False
    try:
        import time
        time.sleep(1.2)
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        res = requests.get(url, headers={"User-Agent": "KeibaiFinderApp/1.0"}, timeout=10)
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
        
        m_pref = re.search(r'^(.{2,3}?(?:都|道|府|県))', original_address)
        m_city = re.search(r'(?:都|道|府|県|^)([^都道府県\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', original_address)
        m_city_bare = re.search(r'^([^都道府県\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', original_address)
        m_town = re.search(r'郡([\u3040-\u9fff]+?(?:町|村))', original_address)
        m_county = re.search(r'([\u3040-\u9fff]+郡)', original_address)
        
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
            print(f"      [Reverse-Mismatch] Địa chỉ gốc: '{expected_parts}' | OSM trả về: '{returned_place.strip()}'")
        return is_match
    except Exception as e:
        print(f"      [Reverse-Error]: {e}")
        return True

def get_osm_coords(addr, original_address=None):
    import time
    time.sleep(1.2)
    headers = {"User-Agent": "KeibaiFinderApp/1.0"}
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
                print(f"      [OSM-Rejected] Không khớp địa chỉ: {lat},{lng} cho '{addr}'")
    except:
        pass
    return None, None

def get_gemini_coords(address, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        prompt = f"Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include any markdown formatting, backticks, or other text. Address: {address}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        data = res.json()
        if "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"]
            location = json.loads(text_response)
            lat, lng = location.get("lat"), location.get("lng")
            if lat and lng:
                return float(lat), float(lng)
    except Exception as e:
        print(f"      [Gemini-Error] Lỗi khi gọi Gemini: {e}")
    return None, None

def geocode_address(address, api_key=None):
    if not address or address == "Unknown":
        return None, None
        
    clean_addr = aggressive_clean(address)
    
    # Layer 00: GSI API
    lat_gsi, lng_gsi = get_gsi_coords(clean_addr)
    if lat_gsi and lng_gsi:
        if reverse_validate_coords(lat_gsi, lng_gsi, address):
            return lat_gsi, lng_gsi
        else:
            print(f"      [GSI-Rejected] Tọa độ không khớp địa chỉ: {lat_gsi},{lng_gsi} cho '{address}'")

    # Layer 0.5: AI Gemini API
    actual_api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if actual_api_key:
        lat_ai, lng_ai = get_gemini_coords(address, actual_api_key)
        if lat_ai and lng_ai:
            if reverse_validate_coords(lat_ai, lng_ai, address):
                print(f"      [Gemini-Success] Đã dùng AI lấy tọa độ: {lat_ai},{lng_ai} cho '{address}'")
                return lat_ai, lng_ai
            else:
                print(f"      [Gemini-Rejected] AI trả về tọa độ không khớp địa chỉ: {lat_ai},{lng_ai} cho '{address}'")

    # Layer 0: Full OSM
    lat, lng = get_osm_coords(clean_addr, address)
    if lat and lng:
        return lat, lng
        
    # Layer 1: Town level
    m_phuong = re.match(r"^(.*?)[0-9\-]+$", clean_addr)
    if m_phuong:
        addr_phuong = m_phuong.group(1).strip()
        print(f"      [OSM-Retry] Không tìm thấy số nhà, đang thử lại với cấp độ Phường: {addr_phuong}...")
        lat, lng = get_osm_coords(addr_phuong, address)
        if lat and lng: return lat, lng
        
    # Layer 2: City/Ward level
    m_quan = re.match(r"(.*?[都道府県]?.*?[市区郡町村])", clean_addr)
    if m_quan:
        addr_quan = m_quan.group(1).strip()
        if addr_quan != address and addr_quan != getattr(m_phuong, 'group', lambda x: '')(1).strip():
            print(f"      [OSM-Retry] Vẫn không tìm thấy, thử lại với cấp độ Quận/Thành phố: {addr_quan}...")
            lat, lng = get_osm_coords(addr_quan, address)
            if lat and lng: return lat, lng
            
    print(f"      [OSM-Fail] Bó tay với địa chỉ: {address}")
    return None, None
