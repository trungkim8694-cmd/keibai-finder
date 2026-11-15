import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

query = """
SELECT 
    source_provider,
    DATE(bid_end_date) as d,
    prefecture,
    COUNT(*)
FROM "Property"
WHERE status = 'ACTIVE' AND bid_end_date IS NOT NULL
GROUP BY source_provider, DATE(bid_end_date), prefecture
ORDER BY d ASC, count DESC
LIMIT 20;
"""
cur.execute(query)
rows = cur.fetchall()
print(f"Total grouped rows found: {len(rows)}")
for r in rows:
    print(f"Provider: {r[0]} | Date: {r[1]} | Pref: {r[2]} | Count: {r[3]}")

cur.close()
conn.close()
