import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("Wiping all BIT properties...")
cur.execute("DELETE FROM \"Property\" WHERE source_provider = 'BIT' OR source_provider IS NULL")
deleted_rows = cur.rowcount

conn.commit()
cur.close()
conn.close()

print(f"[BIT-Reset] Deleted old data | Deleted {deleted_rows} rows.")
