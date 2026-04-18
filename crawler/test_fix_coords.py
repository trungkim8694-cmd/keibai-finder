import sys
import os
import psycopg2

# Thêm đường dẫn để import crawler_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from crawler_utils import geocode_address
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env'))
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("?schema=public", "")

print("Connecting to DB...")
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute('SELECT sale_unit_id, address FROM "Property" WHERE lat IS NULL OR lng IS NULL;')
    missing_props = cur.fetchall()
    
    print(f"Found {len(missing_props)} properties missing lat/lng.")
    
    success_count = 0
    for prop in missing_props:
        sale_unit_id, address = prop
        print(f"\nProcessing ID: {sale_unit_id} | Address: {address}")
        lat, lng = geocode_address(address)
        if lat and lng:
            print(f"  -> Trích xuất TOẠ ĐỘ THÀNH CÔNG: {lat}, {lng}")
            cur.execute('UPDATE "Property" SET lat = %s, lng = %s, updated_at = NOW() WHERE sale_unit_id = %s', (lat, lng, sale_unit_id))
            success_count += 1
        else:
            print("  -> THẤT BẠI khi lấy tọa độ.")
            
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✅ Đã cập nhật thành công {success_count}/{len(missing_props)} tài sản.")
    
except Exception as e:
    print(f"Error: {e}")
