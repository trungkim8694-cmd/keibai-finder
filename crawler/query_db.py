import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute('SELECT sale_unit_id, prefecture, city, property_type, status, ai_status FROM "Property"')
rows = cur.fetchall()

print(f"{'ID':<15} | {'Prefecture':<10} | {'Type':<10} | {'Status':<10} | AI Status")
print("-" * 75)
for row in rows:
    p = row[1] if row[1] else ""
    t = row[3] if row[3] else ""
    s = row[4] if row[4] else ""
    ais = row[5] if row[5] else "NULL"
    print(f"{row[0]:<15} | {p:<10} | {t:<10} | {s:<10} | {ais}")
    
cur.close()
conn.close()
