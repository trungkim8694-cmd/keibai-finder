import os
import psycopg2
import sys
from dotenv import load_dotenv

sys.path.append("/Users/kimtrung/keibai-finder/crawler")
from crawler_utils import convert_reiwa_range_to_datetimes

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT sale_unit_id, raw_display_data FROM \"Property\" WHERE source_provider = 'NTA'")
    
    rows = cur.fetchall()
    print(f"Kiểm tra {len(rows)} tài sản NTA...")
    for row in rows:
        sale_unit_id = row[0]
        raw = row[1]
        
        b_end = None
        if raw and isinstance(raw, dict) and "overview" in raw:
            b_end = raw["overview"].get("入札期間")
            
        if b_end:
            s_date, e_date = convert_reiwa_range_to_datetimes(b_end)
            if s_date and e_date:
                cur2 = conn.cursor()
                cur2.execute("UPDATE \"Property\" SET bid_start_date = %s, bid_end_date = %s WHERE sale_unit_id = %s", (s_date, e_date, sale_unit_id))
                cur2.close()
                print(f"[Fix-NTA] {sale_unit_id}: {s_date} ~ {e_date}")
        
    conn.commit()
    cur.close()
    conn.close()
    print("Xong rà soát NTA!")

if __name__ == "__main__":
    main()
