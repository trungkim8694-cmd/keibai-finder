import os
import psycopg2
from dotenv import load_dotenv

# Load env
env_path = os.path.join(os.path.dirname(__file__), '../web/.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found. Check your .env file.")
    exit(1)

import re

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

def main():
    try:
        clean_url = DATABASE_URL.split('?')[0]
        conn = psycopg2.connect(clean_url)
        cur = conn.cursor()
        
        print("Connected to database. Fetching properties where source_provider is BIT (or default)...")
        
        cur.execute("""
            SELECT sale_unit_id, address, prefecture, court_name 
            FROM "Property" 
            WHERE status = 'ACTIVE'
        """)
        
        rows = cur.fetchall()
        print(f"Found {len(rows)} properties to analyze.")
        
        updates = []
        for row in rows:
            sale_unit_id, address, prefecture, court_name = row
            if not address or address == 'Unknown':
                continue
                
            new_address = address
            new_prefecture = prefecture
            
            # Step 1: Check if address already starts with a Prefecture (Ken, To, Do, Fu)
            pref_match = re.match(r'^(.{2,3}[都道府県])', new_address)
            if pref_match:
                new_prefecture = pref_match.group(1)
            else:
                # Step 2: Extract from court_name if not found in address
                if court_name:
                    for court_key, pref in COURT_PREFIX_MAPPING.items():
                        if court_name.startswith(court_key):
                            new_prefecture = pref
                            break
                
                # Prepend if we found a prefecture and it's missing!
                if new_prefecture and not new_address.startswith(new_prefecture):
                    new_address = f"{new_prefecture}{new_address}"
            
            # Only update if something changed
            if new_address != address or new_prefecture != prefecture:
                updates.append((new_address, new_prefecture, sale_unit_id, address))
        
        print(f"Found {len(updates)} properties needing address/prefecture retrofit.")
        
        # Apply updates
        count = 0
        for new_addr, new_pref, uid, old_addr in updates:
            cur.execute("""
                UPDATE "Property" 
                SET address = %s, prefecture = %s 
                WHERE sale_unit_id = %s
            """, (new_addr, new_pref, uid))
            
            # Print sample to log
            if count < 10:
                print(f"[Retrofit] ID: {uid} | Addr: {old_addr} -> {new_addr} | Pref: {new_pref}")
            elif count == 10:
                print("... (hiển thị thêm bị ẩn)")
            count += 1
            
        conn.commit()
        print(f"Done! Retrofitted {count} records successfully.")
        
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    main()
