import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Rounding all area values in DB...")
cur.execute('UPDATE "Property" SET area = ROUND(area) WHERE area IS NOT NULL')
affected_rows = cur.rowcount

conn.commit()
cur.close()
conn.close()

print(f"[Rounding-Complete] Updated all areas to integers. Updated {affected_rows} rows.")
