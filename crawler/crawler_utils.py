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
load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env.local'))

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

def get_gsi_coords(address, return_title=False):
    """
    Gọi API GSI (Quốc thổ Địa lý Viện Nhật Bản) để lấy toạ độ siêu chuẩn cho địa chỉ.
    Docs: https://msearch.gsi.go.jp/address-search/AddressSearch?q=
    Returns: (lat, lng) or (lat, lng, title) if return_title=True
    """
    if not address:
        return (None, None, None) if return_title else (None, None)
    try:
        url = f"https://msearch.gsi.go.jp/address-search/AddressSearch?q={urllib.parse.quote(address)}"
        res = requests.get(url, timeout=8)
        data = res.json()
        if data and isinstance(data, list) and len(data) > 0:
            coords = data[0].get("geometry", {}).get("coordinates", [])
            title = data[0].get("properties", {}).get("title", "")
            if len(coords) == 2:
                lng, lat = coords[0], coords[1]
                if return_title:
                    return float(lat), float(lng), title
                return float(lat), float(lng)
    except Exception as e:
        pass
    return (None, None, None) if return_title else (None, None)


def clean_area_string(val):
    if not val:
        return None
    
    # Normalize unicode to NFKC (converts full-width to half-width)
    hw = unicodedata.normalize('NFKC', str(val))
    
    # Loại bỏ thông tin tỉ lệ sở hữu: e.g. 持分 1/2, (1/2), 持分: 3/4
    hw = re.sub(r'(?:持分\s*)?[\(（]?\d+\s*[/／]\s*\d+[\)）]?', ' ', hw)
    # Loại bỏ phần trăm: e.g. 60%, 200%
    hw = re.sub(r'\d+(?:\.\d+)?\s*%', ' ', hw)
    # Loại bỏ số thửa/bút: e.g. 外2筆, 3筆
    hw = re.sub(r'外?\d+\s*筆', ' ', hw)
    # Standardize area units to "㎡" (handle m2, m 2, etc.)
    hw = re.sub(r'm\s*2', '㎡', hw, flags=re.IGNORECASE)
    hw = re.sub(r'ｍ\s*２', '㎡', hw)
    hw = re.sub(r'平方メートル|平米', '㎡', hw)
    
    # Strip floor designations (e.g. 1階, 1階部分, 地下2階建)
    hw = re.sub(r'地下\d+(?:\.\d+)?\s*階(?:部分|建)?', ' ', hw, flags=re.IGNORECASE)
    hw = re.sub(r'\d+(?:\.\d+)?\s*階(?:部分|建)?', ' ', hw, flags=re.IGNORECASE)
    
    # Strip room numbers (e.g. 103号室, 103号)
    hw = re.sub(r'\d+\s*号室?', ' ', hw, flags=re.IGNORECASE)
    # Strip building/block numbers (e.g. 1棟, 2工区)
    hw = re.sub(r'\d+\s*棟', ' ', hw, flags=re.IGNORECASE)
    
    # Remove commas that are part of numbers like 1,234.56
    hw_no_commas = re.sub(r'(?<=\d),(?=\d)', '', hw)
    
    # Ưu tiên 1: Trích xuất các số gắn liền với đơn vị diện tích ㎡
    area_unit_matches = re.findall(r'(\d+(?:\.\d+)?)\s*㎡', hw_no_commas)
    if area_unit_matches:
        total = sum(float(x) for x in area_unit_matches if float(x) > 0)
        return total if total > 0 else None
        
    # Ưu tiên 2: Xử lý đơn vị 坪 (tsubo): 1 坪 ≈ 3.30578 ㎡
    tsubo_matches = re.findall(r'(\d+(?:\.\d+)?)\s*坪', hw_no_commas)
    if tsubo_matches:
        total = sum(float(x) * 3.30578 for x in tsubo_matches if float(x) > 0)
        return total if total > 0 else None

    # Fallback: Nếu không có nhãn ㎡ nhưng chuỗi chỉ chứa số
    matches = re.findall(r'(\d+(?:\.\d+)?)', hw_no_commas)
    if matches:
        if len(matches) == 1:
            try:
                v = float(matches[0])
                return v if v > 0 else None
            except ValueError:
                pass
        else:
            floats = []
            for m in matches:
                try:
                    f = float(m)
                    if 0 < f < 1000000:
                        floats.append(f)
                except ValueError:
                    pass
            if floats:
                return floats[0]
            
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
        
    sql = """
      SELECT 
        "name_ja", "line_name",
        ( 6371 * acos( cos( radians(%s) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians(%s) ) + sin( radians(%s) ) * sin( radians( "lat" ) ) ) ) AS distance
      FROM "RailwayStation"
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    """
    try:
        cur.execute(sql, (float(lat), float(lng), float(lat)))
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
    """
    Tiền xử lý và làm sạch địa chỉ tiếng Nhật chuẩn hóa:
    1. Bóc tách nội dung trong ngoặc kép 「...」 (đặc thù của NTA: 近隣の住居表示「...」付近)
    2. Loại bỏ tiền tố: 所在, 所在地, 近隣の住居表示
    3. Loại bỏ hậu tố: 付近, 周辺, 外○筆
    4. Chuẩn hóa NFKC (toàn giác sang bán giác), dấu gạch nối và số nhà
    """
    if not address or address == "Unknown":
        return ""
    
    # 1. Bóc tách địa chỉ NTA trong ngoặc
    m_bracket = re.search(r'「([^」]+)」', address)
    if m_bracket:
        address = m_bracket.group(1)
        
    addr = to_half_width(address)
    # 2. Xóa tiền tố
    addr = re.sub(r'^(?:所在|所在地|近隣の住居表示)[:：\s]*', '', addr)
    # 3. Xóa hậu tố
    addr = re.sub(r'[付近周辺]$', '', addr)
    addr = re.sub(r'外?\d+\s*筆', '', addr)
    addr = re.sub(r'[番番地号]$', '', addr)
    addr = re.sub(r'番地?', '-', addr)
    addr = re.sub(r'号', '', addr)
    addr = re.sub(r'-+', '-', addr).strip('-')
    return addr

JAPAN_BOUNDS = {"lat_min": 24.0, "lat_max": 46.0, "lng_min": 122.0, "lng_max": 154.0}

def is_valid_japan_coords(lat, lng):
    if lat is None or lng is None:
        return False
    try:
        return (JAPAN_BOUNDS["lat_min"] <= float(lat) <= JAPAN_BOUNDS["lat_max"] and
                JAPAN_BOUNDS["lng_min"] <= float(lng) <= JAPAN_BOUNDS["lng_max"])
    except (ValueError, TypeError):
        return False

def is_gsi_title_matching(title, original_address):
    """
    Xác minh toạ độ GSI bằng trường title trả về trực tiếp từ GSI mà không cần gọi OSM.
    Đảm bảo tỉnh hoặc thành phố/quận/huyện của địa chỉ gốc có trong title.
    """
    if not title or not original_address:
        return True
    
    m_pref = re.search(r'^(.{2,3}?(?:都|道|府|県))', original_address)
    m_city = re.search(r'(?:都|道|府|県|^)([^都道府県\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', original_address)
    
    checks = []
    if m_pref: checks.append(m_pref.group(1))
    if m_city: checks.append(m_city.group(1).strip())
    
    if not checks:
        return True
    
    return any(c in title for c in checks)

def get_gemini_coords(address, api_key):
    """Fallback dùng AI Gemini (2.5-flash -> 1.5-flash) giải mã toạ độ khi GSI không nhận"""
    for model_name in ["gemini-2.5-flash", "gemini-1.5-flash"]:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            headers = {'Content-Type': 'application/json'}
            prompt = f"Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include any markdown formatting, backticks, or other text. Address: {address}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            res = requests.post(url, headers=headers, json=payload, timeout=12)
            data = res.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                location = json.loads(text_response)
                lat, lng = location.get("lat"), location.get("lng")
                if lat and lng:
                    return float(lat), float(lng)
        except Exception:
            continue
    return None, None

def get_osm_coords(addr, original_address=None):
    """Last-resort fallback sử dụng OpenStreetMap Nominatim khi GSI và AI đều không tìm thấy"""
    try:
        import time
        headers = {"User-Agent": "KeibaiFinderApp/1.0"}
        query = f"{addr}, Japan"
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        res = requests.get(url, headers=headers, timeout=8)
        data = res.json()
        if data and len(data) > 0:
            lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
            if is_valid_japan_coords(lat, lng):
                return lat, lng
    except Exception:
        pass
    return None, None

def geocode_address(address, api_key=None):
    """
    Hệ thống Geocoding 3 lớp chuẩn B2B Nhật Bản:
    Layer 1: GSI Quốc gia phân tầng (Full -> Chome/Oaza -> City/Gun)
    Layer 2: Gemini AI (2.5-flash) dành cho địa chỉ phức tạp
    Layer 3: OSM Nominatim chốt chặn cuối cùng
    """
    if not address or address == "Unknown":
        return None, None
        
    clean_addr = aggressive_clean(address)
    if not clean_addr:
        return None, None
    
    # -------------------------------------------------------------
    # LAYER 1: GSI CƠ SỞ DỮ LIỆU ĐỊA LÝ QUỐC GIA (Tốc độ ~50ms, chuẩn 100%)
    # -------------------------------------------------------------
    # Nấc 1: Toàn bộ địa chỉ chi tiết (Full Address)
    lat_gsi, lng_gsi, title_gsi = get_gsi_coords(clean_addr, return_title=True)
    if lat_gsi and lng_gsi and is_valid_japan_coords(lat_gsi, lng_gsi):
        if is_gsi_title_matching(title_gsi, address):
            print(f"      [GSI-Success] Lấy toạ độ quốc gia (Chi tiết): {lat_gsi},{lng_gsi} [{title_gsi}]", flush=True)
            return lat_gsi, lng_gsi

    # Nấc 2: Cắt tỉa số thửa con (Chome / Oaza level)
    trimmed_addr = re.sub(r'[\s\-0-9]+$', '', clean_addr)
    if trimmed_addr and trimmed_addr != clean_addr:
        lat_gsi, lng_gsi, title_gsi = get_gsi_coords(trimmed_addr, return_title=True)
        if lat_gsi and lng_gsi and is_valid_japan_coords(lat_gsi, lng_gsi):
            if is_gsi_title_matching(title_gsi, address):
                print(f"      [GSI-Fallback] Lấy toạ độ quốc gia (Khu phố/Thôn xóm): {lat_gsi},{lng_gsi} [{title_gsi}]", flush=True)
                return lat_gsi, lng_gsi

    # Nấc 3: Cắt về cấp Quận / Huyện / Thị trấn (City / Gun level)
    m_city_level = re.match(r'^(.*?([都道府県])?.*?[市区郡町村])', clean_addr)
    if m_city_level:
        city_addr = m_city_level.group(1).strip()
        if city_addr and city_addr != clean_addr and city_addr != trimmed_addr:
            lat_gsi, lng_gsi, title_gsi = get_gsi_coords(city_addr, return_title=True)
            if lat_gsi and lng_gsi and is_valid_japan_coords(lat_gsi, lng_gsi):
                print(f"      [GSI-Fallback] Lấy toạ độ quốc gia (Quận/Huyện): {lat_gsi},{lng_gsi} [{title_gsi}]", flush=True)
                return lat_gsi, lng_gsi

    # -------------------------------------------------------------
    # LAYER 2: AI GEMINI (Dành cho địa chỉ có tên tranh chấp/cũ)
    # -------------------------------------------------------------
    actual_api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if actual_api_key:
        lat_ai, lng_ai = get_gemini_coords(address, actual_api_key)
        if lat_ai and lng_ai and is_valid_japan_coords(lat_ai, lng_ai):
            print(f"      [Gemini-Success] Đã dùng AI lấy tọa độ: {lat_ai},{lng_ai} cho '{address}'", flush=True)
            return lat_ai, lng_ai

    # -------------------------------------------------------------
    # LAYER 3: OSM NOMINATIM (Last Resort)
    # -------------------------------------------------------------
    lat_osm, lng_osm = get_osm_coords(clean_addr, address)
    if lat_osm and lng_osm:
        print(f"      [OSM-Fallback] Đã dùng OSM lấy tọa độ: {lat_osm},{lng_osm} cho '{address}'", flush=True)
        return lat_osm, lng_osm
        
    print(f"      [Geocode-Fail] Không tìm thấy tọa độ cho: {address}", flush=True)
    return None, None


def extract_prefecture_and_city(address: str):
    """Extract (prefecture, city) from a Japanese address string."""
    if not address:
        return None, None
    addr = address.strip()
    pref_match = re.match(r'^(.{2,3}?[都道府県])\s*(.*)$', addr)
    if not pref_match:
        return None, None
    prefecture = pref_match.group(1)
    rest = pref_match.group(2).strip()
    city_match = re.match(r'^([^0-9\s]+?[市区町村郡])', rest)
    city = city_match.group(1) if city_match else None
    return prefecture, city


def extract_pdf_images_to_vps(pdf_bytes: bytes, sale_unit_id: str, max_images: int = 5) -> list[str]:
    """
    Trích xuất ảnh chụp thực tế từ PDF (PyMuPDF) -> WebP -> lưu vào /var/www/keibai-images/{sale_unit_id}/
    Trả về danh sách URL dạng /vps-images/{sale_unit_id}/{filename}.webp
    """
    if not pdf_bytes or len(pdf_bytes) < 1000:
        return []
    try:
        import io
        import fitz
        from PIL import Image
    except ImportError:
        return []

    local_image_dir = os.environ.get("LOCAL_IMAGE_DIR", "/var/www/keibai-images")
    url_prefix = os.environ.get("LOCAL_IMAGE_URL_PREFIX", "/vps-images")
    pdf_images = []

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page_idx in range(len(doc) - 1, -1, -1):
            pdf_page = doc[page_idx]
            if not pdf_page.get_images(full=True):
                continue

            pix_color = pdf_page.get_pixmap(matrix=fitz.Matrix(1, 1))
            try:
                pil_color = Image.frombytes("RGB", [pix_color.width, pix_color.height], pix_color.samples)
            except ValueError:
                pil_color = Image.frombytes("RGBA", [pix_color.width, pix_color.height], pix_color.samples).convert("RGB")

            # Bỏ qua trang văn bản/bản vẽ nền trắng (> 75% pixel tập trung ở 30 mức xám cao nhất)
            sample = pil_color.resize((300, 300)).convert("L")
            hist_sorted = sorted(sample.histogram(), reverse=True)
            if sum(hist_sorted[:30]) / (300 * 300) > 0.75:
                continue

            mat_high = fitz.Matrix(200 / 72, 200 / 72)
            pix_high = pdf_page.get_pixmap(matrix=mat_high, alpha=False)
            try:
                pil_high = Image.frombytes("RGB", [pix_high.width, pix_high.height], pix_high.samples)
            except ValueError:
                pil_high = Image.frombytes("RGBA", [pix_high.width, pix_high.height], pix_high.samples).convert("RGB")

            pil_high.thumbnail((1200, 1600))
            image_filename = f"{sale_unit_id}_p{page_idx}.webp"
            img_byte_arr = io.BytesIO()
            pil_high.save(img_byte_arr, format="WEBP", quality=80)

            prop_dir = os.path.join(local_image_dir, sale_unit_id)
            os.makedirs(prop_dir, exist_ok=True)
            with open(os.path.join(prop_dir, image_filename), "wb") as f_img:
                f_img.write(img_byte_arr.getvalue())

            pdf_images.append(f"{url_prefix}/{sale_unit_id}/{image_filename}")
            if len(pdf_images) >= max_images:
                break
        doc.close()
    except Exception as e:
        print(f"      [PDF Image Error] {sale_unit_id}: {e}", flush=True)

    return pdf_images
