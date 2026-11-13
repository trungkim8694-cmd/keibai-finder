import sys
import psycopg2
sys.path.append('crawler')
from crawler_utils import geocode_address

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT sale_unit_id, address
    FROM "Property"
    WHERE lat IS NULL AND address != 'Unknown'
""")
rows = cur.fetchall()
print(f"Found {len(rows)} properties without coords that have a valid address:")

updated_count = 0
for sale_unit_id, addr in rows:
    lat, lng = geocode_address(addr)
    if lat and lng:
        cur.execute("""
            UPDATE "Property"
            SET lat = %s, lng = %s, updated_at = NOW()
            WHERE sale_unit_id = %s
        """, (lat, lng, sale_unit_id))
        print(f"  Fixed [{sale_unit_id}] => {lat}, {lng}")
        updated_count += 1
    else:
        print(f"  Could not resolve [{sale_unit_id}] {addr}")

conn.commit()
print(f"\nSuccessfully backfilled {updated_count}/{len(rows)} properties!")

cur.close()
conn.close()
