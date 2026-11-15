import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("""
    SELECT sale_unit_id, address, lat, lng, prefecture 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND lat IS NOT NULL 
    ORDER BY lat DESC 
    LIMIT 10;
""")
print("Highest Latitudes:")
for r in cur.fetchall():
    print(r)

cur.execute("""
    SELECT sale_unit_id, address, lat, lng, prefecture 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND lat IS NOT NULL 
    ORDER BY lat ASC 
    LIMIT 10;
""")
print("\nLowest Latitudes:")
for r in cur.fetchall():
    print(r)

cur.execute("""
    SELECT 
        MIN(lat), MAX(lat), MIN(lng), MAX(lng), COUNT(*)
    FROM "Property"
    WHERE status = 'ACTIVE' AND lat IS NOT NULL;
""")
print("\nOverall Min/Max:")
print(cur.fetchone())

cur.close()
conn.close()
