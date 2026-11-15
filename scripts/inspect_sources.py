import psycopg2
import json

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

cur.execute("""
SELECT 
    ar.raw_data->>'source' as src,
    COUNT(*),
    COUNT(ar.address) as count_with_address,
    COUNT(ar.lat) as count_with_lat
FROM "AuctionResult" ar
GROUP BY ar.raw_data->>'source';
""")
for row in cur.fetchall():
    print(f"Source: {row[0]} | Total: {row[1]} | With address: {row[2]} | With Lat: {row[3]}")

cur.execute("""
SELECT jsonb_object_keys(raw_data::jsonb) as k, COUNT(*) 
FROM "AuctionResult" 
WHERE raw_data IS NOT NULL 
GROUP BY k;
""")
for row in cur.fetchall():
    print(f"Key: {row[0]} ({row[1]})")
