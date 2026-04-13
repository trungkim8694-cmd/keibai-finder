import os
import re
import json
import psycopg2
import requests
import time
from bs4 import BeautifulSoup
from dotenv import load_dotenv

DUMP_DIR = "/Users/kimtrung/keibai-finder/.antigravity/research"
load_dotenv("/Users/kimtrung/keibai-finder/web/.env")

def parse_price(price_str):
    if not price_str:
        return None
    cleaned = re.sub(r'[^\d]', '', price_str)
    return int(cleaned) if cleaned else None

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

def geocode_address(address, api_key):
    """
    Gọi trực tiếp Gemini API để chuyển đổi địa chỉ thành tọa độ (vĩ độ, kinh độ).
    """
    if not api_key:
        return None, None
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        prompt = f"Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include any markdown formatting. Address: {address}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        data = res.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            text_response = data["candidates"][0]["content"]["parts"][0]["text"]
            location = json.loads(text_response)
            return location.get("lat"), location.get("lng")
        else:
            print(f"      [Geocode Warning]: Gemini không trả về tọa độ hợp lệ cho địa chỉ '{address}' (Phản hồi: {data.get('error')})")
            return None, None
    except Exception as e:
        print(f"      [Geocode Error]: Lỗi khi gọi Gemini API: {e}")
        return None, None

def parse_and_dump_to_db():
    file_path = os.path.join(DUMP_DIR, "property_list_dump.html")
    if not os.path.exists(file_path):
        print("Không tìm thấy property_list_dump.html")
        return
        
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, "html.parser")
    properties = soup.select(".bit__searchResult")
    print(f"Tìm thấy {len(properties)} tài sản tĩnh trong file HTML dump.")
    
    # Kết nối DB
    db_url = os.environ.get("DATABASE_URL")
    gemini_key = os.environ.get("GEMINI_API_KEY")  # Get Key API
    
    if not db_url:
        print("Lỗi: Không tìm thấy DATABASE_URL!")
        return
        
    if not gemini_key:
        print("Cảnh báo: GEMINI_API_KEY chưa được cấu hình trong .env. Quá trình Geocoding sẽ bị bỏ qua và tọa độ thiết lập giá trị null.")
        
    # Xoá Prisma-specific query parameter
    db_url = db_url.replace("?schema=public", "")
        
    print("Đang kết nối tới PostgreSQL...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    upsert_query = """
    INSERT INTO "Property" (sale_unit_id, court_name, property_type, address, starting_price, lat, lng, "thumbnailUrl", updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
    ON CONFLICT (sale_unit_id) DO UPDATE SET
        starting_price = EXCLUDED.starting_price,
        address = EXCLUDED.address,
        property_type = EXCLUDED.property_type,
        "thumbnailUrl" = COALESCE(EXCLUDED."thumbnailUrl", "Property"."thumbnailUrl"),
        lat = COALESCE(EXCLUDED.lat, "Property".lat),
        lng = COALESCE(EXCLUDED.lng, "Property".lng),
        updated_at = NOW();
    """
    
    count_success = 0
    count_geocoded = 0
    
    for idx, prop in enumerate(properties):
        title_a = prop.select_one("a.bit__link")
        if not title_a: continue
            
        onclick_val = title_a.get("onclick", "")
        match = re.search(r"tranPropertyDetail\([\"']([^\"']+)[\"'],\s*[\"']([^\"']+)[\"']", onclick_val)
        if not match: continue
            
        sale_unit_id = match.group(1)
        court_name = title_a.get_text(strip=True)
        
        type_badge = prop.select_one(".badge-primary")
        property_type = type_badge.get_text(strip=True) if type_badge else "Unspecified"
        
        price_p = prop.select_one(".bit_ichiran_text_kakaku")
        price = parse_price(price_p.get_text()) if price_p else None
        
        address = "Unknown"
        icon = prop.select_one(".bit__icon_access")
        if icon and icon.parent:
            address = icon.parent.get_text(strip=True)
            
        # Deduce Prefecture from Court Name and Prepend to Address if missing
        if address and address != "Unknown":
            matched_pref = None
            for court_key, pref in COURT_PREFIX_MAPPING.items():
                if court_name.startswith(court_key):
                    matched_pref = pref
                    break
                    
            if matched_pref and not address.startswith(matched_pref):
                # Ensure we do not add double province if address already starts with it somehow
                # Check for Edge Cases where address starts with 札幌 but not 北海道
                # (E.g. matched_pref="北海道", address="札幌市" -> "北海道札幌市")
                address = f"{matched_pref}{address}"
            
        img_tag = prop.select_one("img.bit__searchResult_img")
        thumbnailUrl = None
        if img_tag and img_tag.get("src"):
            src = img_tag.get("src")
            thumbnailUrl = src if src.startswith("http") else "https://bit.sikkou.jp" + src
            
        print(f"[{idx+1}/{len(properties)}] Đang xử lý: {court_name} | ID: {sale_unit_id}")
        
        # Geocoding if API key is present
        lat, lng = None, None
        if gemini_key and address and address != "Unknown":
            print(f"   -> Geocoding address via Gemini: {address}...")
            lat, lng = geocode_address(address, gemini_key)
            if lat and lng:
                count_geocoded += 1
            # Rate limit gracefully for Gemini API
            time.sleep(1.0)
            
        try:
            cur.execute(upsert_query, (sale_unit_id, court_name, property_type, address, price, lat, lng, thumbnailUrl))
            count_success += 1
        except Exception as e:
            print(f"   ❌ Lỗi khi Upsert {sale_unit_id}: {e}")
            conn.rollback()
            continue

    conn.commit()
    cur.close()
    conn.close()
    
    print("====================================")
    print(f"✅ Hoàn thành quá trình: Cập nhật thành công {count_success} tài sản vào Database!")
    if gemini_key:
        print(f"🗺️ Đã Geocode tọa độ thành công cho {count_geocoded} địa chỉ thông qua Gemini API.")
    else:
        print("🗺️ Chưa thiết lập GEMINI_API_KEY nên không có địa chỉ nào được chuyển hóa tọa độ.")
        
if __name__ == "__main__":
    parse_and_dump_to_db()
