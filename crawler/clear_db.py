import os, psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute('DELETE FROM "Property" WHERE raw_display_data IS NULL OR jsonb_array_length(raw_display_data::jsonb) = 0')
conn.commit()
print("Cleaned up missing raw_display_data records.")
cur.close()
conn.close()
