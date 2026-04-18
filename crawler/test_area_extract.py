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
                # Japanese full to half width
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
    except Exception as e:
        print(f"Error parsing area: {e}")
        return None

import psycopg2, os
from dotenv import load_dotenv
load_dotenv("../web/.env")

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()
cur.execute("SELECT raw_display_data FROM \"Property\" WHERE sale_unit_id = '00000010316'")
row = cur.fetchone()
if row and row[0]:
    print(f"Extracted Area: {extract_total_area(row[0])}")
