import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
load_dotenv('web/.env')

db_url = os.environ.get("DATABASE_URL").split("?")[0]
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("""
    SELECT source_provider, DATE_TRUNC('month', updated_at) as m, COUNT(*)
    FROM "Property"
    GROUP BY source_provider, m
    ORDER BY source_provider, m DESC
""")
print("Updated by Month:")
for r in cur.fetchall():
    print(r)

cur.execute("""
    SELECT source_provider, DATE_TRUNC('month', bid_end_date) as m, COUNT(*)
    FROM "Property"
    WHERE status = 'ACTIVE'
    GROUP BY source_provider, m
    ORDER BY source_provider, m DESC
""")
print("\nActive Properties by bid_end_date Month:")
for r in cur.fetchall():
    print(r)
