import os
import psycopg2
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in environment.")
    exit(1)

def normalize_category(raw_val):
    if not raw_val: return "その他"
    val_lower = raw_val.lower()
    if any(x in val_lower for x in ["建物", "家屋", "戸建", "居宅", "店舗", "事務所", "診療所", "工場", "倉庫", "旅館"]): return "戸建て"
    if "区分所有" in val_lower or "マンション" in val_lower: return "マンション"
    if "宅地" in val_lower or "山林" in val_lower or "原野" in val_lower or "雑種地" in val_lower or "土地" in val_lower: return "土地"
    if "田" in val_lower or "畑" in val_lower or "農地" in val_lower: return "農地"
    return "その他"

def parse_property_type(overview, details):
    if "財産種別" in overview: 
        raw_category = overview["財産種別"]
    elif "主たる種類" in overview: 
        raw_category = overview["主たる種類"]
    elif "主たる地目" in overview: 
        if "床面積合計" in overview or "床面積合計" in details:
            raw_category = "建物"
        else:
            raw_category = overview["主たる地目"]
    else: 
        raw_category = None
    return normalize_category(raw_category)

def main():
    print("Connecting to the database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Fetching NTA properties...")
    cur.execute("""SELECT sale_unit_id, property_type, raw_display_data FROM "Property" WHERE source_provider = 'NTA'""")
    rows = cur.fetchall()
    
    updated_count = 0
    updates = []
    
    for row in rows:
        sale_unit_id, old_type, raw_display_data = row
        if not raw_display_data:
            continue
            
        if isinstance(raw_display_data, str):
            try:
                data = json.loads(raw_display_data)
            except json.JSONDecodeError:
                continue
        else:
            data = raw_display_data
            
        overview = data.get("overview", {})
        details = data.get("details", {})
        
        new_type = parse_property_type(overview, details)
        
        if new_type != old_type:
            print(f"ID: {sale_unit_id: >8} | {old_type} -> {new_type}")
            updates.append((new_type, sale_unit_id))
            updated_count += 1
            
    if updates:
        print(f"\\nExecuting {len(updates)} database updates...")
        for batch_args in updates:
            cur.execute("""UPDATE "Property" SET property_type = %s WHERE sale_unit_id = %s""", batch_args)
        conn.commit()
        print("Success! Changes committed.")
    else:
        print("No updates required.")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
