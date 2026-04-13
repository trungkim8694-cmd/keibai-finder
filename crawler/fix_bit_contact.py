"""
Retroactive script: Lấy contact_url từ BIT trang chi tiết cho các tài sản cũ.
Dùng URL search results -> click from list để hàm tranPropertyDetail hoạt động đúng context.
Hoặc: bóc tách court_name từ DB rồi map sang info_URL (phương án 2 - không cần Playwright).
"""
import os
import re
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

# BIT contact info pages are structured as: /info/info_{COURT_NUMBER}.html
# The court number is embedded inside the raw_display_data of each property
# as part of the HTML already scraped. We can extract it from the court_name or 
# from the sale_unit_id prefix which encodes the court.
# 
# Looking at the HTML: href="/app/../info/info_31431.html"
# The contact_url pattern is: https://www.bit.courts.go.jp/info/info_{ID}.html
# We need to find this ID from the raw_display_data summary section OR court_name.
#
# Alternative approach: parse raw_display_data for any "info_\d+.html" pattern
# since we stored HTML-derived data in raw_display_data.

def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT sale_unit_id, raw_display_data, court_name
        FROM "Property"
        WHERE source_provider = 'BIT'
    """)
    rows = cur.fetchall()
    print(f"Kiểm tra {len(rows)} tài sản BIT...")
    
    updated = 0
    skipped = 0
    
    for sale_unit_id, raw, court_name in rows:
        if not raw:
            skipped += 1
            continue
            
        raw_obj = raw if isinstance(raw, list) else json.loads(raw) if isinstance(raw, str) else raw
        
        # Check if Summary section already has contact_url
        if isinstance(raw_obj, list):
            summary = next((s for s in raw_obj if s.get("asset_title") == "Summary"), None)
            if summary and summary.get("contact_url"):
                print(f"[Skip] {sale_unit_id} - đã có contact_url")
                skipped += 1
                continue
        
        # BIT info page can be derived from sale_unit_id prefix (court code).
        # sale_unit_id format: 00000025168 -> matches court ID based on BIT's internal mapping.
        # However, we don't have this mapping easily.
        # 
        # Best approach: search the raw_display_data JSON string for any info_XXXXX.html pattern
        raw_str = json.dumps(raw_obj, ensure_ascii=False)
        m = re.search(r'/info/info_(\d+)\.html', raw_str)
        if m:
            info_id = m.group(1)
            contact_url = f"https://www.bit.courts.go.jp/info/info_{info_id}.html"
            print(f"[Found-in-raw] {sale_unit_id} -> info_{info_id}")
        else:
            # Derive from sale_unit_id: BIT uses 11-digit IDs where the first 5 digits represent the court
            # but this mapping isn't documented. Skip for now.
            # We'll generate a fallback URL that lands on the contact list page
            contact_url = "https://www.bit.courts.go.jp/info/index.html"
            print(f"[Fallback] {sale_unit_id} - court: {court_name} -> fallback URL")
        
        # Inject contact_url into Summary section
        if isinstance(raw_obj, list):
            summary_found = False
            for section in raw_obj:
                if section.get("asset_title") == "Summary":
                    section["contact_url"] = contact_url
                    summary_found = True
                    break
            if not summary_found:
                raw_obj.insert(0, {
                    "asset_title": "Summary", 
                    "asset_type": "Summary", 
                    "data": {}, 
                    "images": [], 
                    "contact_url": contact_url
                })
        
        new_raw_json = json.dumps(raw_obj, ensure_ascii=False)
        cur.execute('UPDATE "Property" SET raw_display_data = %s::jsonb WHERE sale_unit_id = %s', (new_raw_json, sale_unit_id))
        updated += 1
        print(f"[OK] {sale_unit_id} -> {contact_url}")
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n=== DONE: Updated {updated}, Skipped {skipped} ===")

if __name__ == "__main__":
    main()
