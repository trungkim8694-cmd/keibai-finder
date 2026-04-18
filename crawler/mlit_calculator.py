import os
import time
import requests
import psycopg2
from psycopg2.extras import Json
import re
import json

def extract_total_area(raw_display_data_json):
    if not raw_display_data_json:
        return None
    try:
        if isinstance(raw_display_data_json, str):
            parsed = json.loads(raw_display_data_json)
        else:
            parsed = raw_display_data_json
            
        total_area = 0.0
        
        def check_val(k, v):
            nonlocal total_area
            if "面積" in k and "現況" not in k:
                hw = v.translate(str.maketrans('０１２３４５６７８９．', '0123456789.'))
                m = re.search(r'([\d\.]+)', hw)
                if m:
                    try:
                        total_area += float(m.group(1))
                    except ValueError:
                        pass
                        
        if isinstance(parsed, list):
            for item in parsed:
                if isinstance(item, dict):
                    if "data" in item and isinstance(item["data"], dict):
                        for k, v in item["data"].items():
                            check_val(str(k), str(v))
                    elif "key" in item and "value" in item:
                        check_val(str(item["key"]), str(item["value"]))
                        
        return total_area if total_area > 0 else None
    except Exception:
        return None

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/kimtrung/keibai-finder/web/.env")
    load_dotenv(dotenv_path="/Users/kimtrung/keibai-finder/web/.env.local")
    DATABASE_URL = os.environ.get("DATABASE_URL")

db_url = DATABASE_URL.replace("?schema=public", "")
MLIT_API_KEY = "3cee958080dc40b2854698b6407d4b5a"
BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external"
HEADERS = {"Ocp-Apim-Subscription-Key": MLIT_API_KEY}

PREF_MAP = {
    "北海道": "01", "青森県": "02", "岩手県": "03", "宮城県": "04", "秋田県": "05", "山形県": "06", "福島県": "07",
    "茨城県": "08", "栃木県": "09", "群馬県": "10", "埼玉県": "11", "千葉県": "12", "東京都": "13", "神奈川県": "14",
    "新潟県": "15", "富山県": "16", "石川県": "17", "福井県": "18", "山梨県": "19", "長野県": "20", "岐阜県": "21",
    "静岡県": "22", "愛知県": "23", "三重県": "24", "滋賀県": "25", "京都府": "26", "大阪府": "27", "兵庫県": "28",
    "奈良県": "29", "和歌山県": "30", "鳥取県": "31", "島根県": "32", "岡山県": "33", "広島県": "34", "山口県": "35",
    "徳島県": "36", "香川県": "37", "愛媛県": "38", "高知県": "39", "福岡県": "40", "佐賀県": "41", "長崎県": "42",
    "熊本県": "43", "大分県": "44", "宮崎県": "45", "鹿児島県": "46", "沖縄県": "47"
}

city_map_cache = {}
valuation_cache = {}

def get_city_code(prefecture, city):
    pref_code = PREF_MAP.get(prefecture)
    if not pref_code or not city:
        return None
        
    if pref_code in city_map_cache:
        cities = city_map_cache[pref_code]
    else:
        url = f"{BASE_URL}/XIT002?year=2023&area={pref_code}"
        try:
            res = requests.get(url, headers=HEADERS, timeout=10)
            if res.status_code == 200:
                cities = res.json().get("data", [])
                city_map_cache[pref_code] = cities
            else:
                print(f"[ERROR] MLIT API Error in XIT002 (City Code): Status {res.status_code}")
                return "HTTP_ERROR"
        except Exception as e:
            print(f"[ERROR] Failed to fetch cities: {e}")
            return "HTTP_ERROR"

    clean_city = re.sub(r'[市区町村郡]$', '', city)
    for c in cities:
        clean_mlit = re.sub(r'[市区町村郡]$', '', c.get("name", ""))
        if c.get("name") == city or clean_mlit == clean_city or clean_mlit in city:
            return c.get("id")
    return None

def get_market_valuation(city_code, property_type, year="2023"):
    cache_key = f"{city_code}_{property_type}_{year}"
    if cache_key in valuation_cache:
        return valuation_cache[cache_key]
        
    if property_type == "マンション":
        mlit_types = ["中古マンション等"]
    elif property_type == "土地":
        mlit_types = ["宅地(土地)"]
    else:
        mlit_types = ["宅地(土地と建物)", "宅地(建物付)", "中古戸建"]
    search_type = mlit_types[0]
    
    url = f"{BASE_URL}/XIT001?year={year}&city={city_code}"
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=20)
        if res.status_code == 200:
            data = res.json().get("data", [])
            matched = [t for t in data if t.get("Type") in mlit_types]
            
            avgTradePrice = None
            avgPricePerSqm = None
            avgArea = 0
            
            if matched:
                total_price = sum(float(t.get("TradePrice", 0)) for t in matched if t.get("TradePrice"))
                avgTradePrice = round(total_price / len(matched))
                
                valid_area_trans = []
                for t in matched:
                    area_str = re.sub(r'[^0-9.]', '', str(t.get("Area", "")))
                    if area_str:
                        valid_area_trans.append({"price": float(t.get("TradePrice", 0)), "area": float(area_str)})
                        
                if valid_area_trans:
                    total_area = sum(t["area"] for t in valid_area_trans)
                    total_price_for_area = sum(t["price"] for t in valid_area_trans)
                    avgArea = total_area / len(valid_area_trans)
                    if total_area > 0:
                        avgPricePerSqm = round(total_price_for_area / total_area)
            
            res_dict = {
                "avgTradePrice": avgTradePrice,
                "avgArea": avgArea,
                "avgPricePerSqm": avgPricePerSqm
            }
            valuation_cache[cache_key] = res_dict
            return res_dict
        else:
            print(f"[ERROR] MLIT API Error in XIT001 (Market Valuation): Status {res.status_code}")
            return "HTTP_ERROR"
            
    except Exception as e:
        print(f"[ERROR] Failed to fetch valuation: {e}")
        return "HTTP_ERROR"

def m_print(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def process_mlit_gap():
    m_print("Starting MLIT Gap Background Calculator...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute("""
        SELECT sale_unit_id, property_type, prefecture, city, starting_price, area, raw_display_data 
        FROM "Property" 
        WHERE status = 'ACTIVE' 
          AND mlit_investment_gap IS NULL 
          AND property_type IN ('戸建て', 'マンション', '土地')
    """)
    rows = cur.fetchall()
    m_print(f"Found {len(rows)} properties need MLIT Gap calculation.")
    
    success_count = 0
    
    for row in rows:
        sale_unit_id, prop_type, pref, city, start_price, db_area, raw_data = row
        
        area = db_area if db_area and db_area > 0 else extract_total_area(raw_data)
        
        if not pref or not city:
            cur.execute('UPDATE "Property" SET mlit_investment_gap = -999 WHERE sale_unit_id = %s', (sale_unit_id,))
            continue
            
        city_code = get_city_code(pref, city)
        if city_code == "HTTP_ERROR":
            cur.execute('UPDATE "Property" SET mlit_investment_gap = NULL WHERE sale_unit_id = %s', (sale_unit_id,))
            m_print(f"  [ERROR] MLIT API Rate Limit/Maintenance when getting city code. Sleeping 3s. Property {sale_unit_id} will be retried next time.")
            time.sleep(3)
            continue
        elif not city_code:
            cur.execute('UPDATE "Property" SET mlit_investment_gap = -999 WHERE sale_unit_id = %s', (sale_unit_id,))
            continue
            
        val = get_market_valuation(city_code, prop_type)
        if val == "HTTP_ERROR":
            cur.execute('UPDATE "Property" SET mlit_investment_gap = NULL WHERE sale_unit_id = %s', (sale_unit_id,))
            m_print(f"  [ERROR] MLIT API Rate Limit/Maintenance when getting valuation. Sleeping 3s. Property {sale_unit_id} will be retried next time.")
            time.sleep(3)
            continue
            
        if val and isinstance(val, dict) and val.get("avgTradePrice"):
            avgPricePerSqm = val.get("avgPricePerSqm")
            avgArea = val.get("avgArea", 0)
            
            referenceArea = area if area and area > 0 else avgArea
            estimatedPrice = val["avgTradePrice"]
            
            if avgPricePerSqm and avgPricePerSqm > 0 and referenceArea > 0:
                estimatedPrice = avgPricePerSqm * referenceArea
                
            gap = 0
            if start_price and start_price > 0 and estimatedPrice > 0:
                gap = ((estimatedPrice - start_price) / estimatedPrice) * 100.0
                
            cur.execute('''
                UPDATE "Property" 
                SET mlit_estimated_price = %s, mlit_investment_gap = %s
                WHERE sale_unit_id = %s
            ''', (int(estimatedPrice), round(gap, 1), sale_unit_id))
            success_count += 1
            m_print(f"  [Calculated] {sale_unit_id} ({city}) gap = {round(gap, 1)}%")
        else:
            cur.execute('UPDATE "Property" SET mlit_investment_gap = -999 WHERE sale_unit_id = %s', (sale_unit_id,))
            m_print(f"  [Skipped] {sale_unit_id} - No MLIT Data.")
            
        time.sleep(0.5)
        
    cur.close()
    conn.close()
    m_print(f"Completed! Successfully calculated gap for {success_count} properties.")

if __name__ == "__main__":
    process_mlit_gap()
