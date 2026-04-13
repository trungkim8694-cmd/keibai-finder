import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('UPDATE "Property" SET line_name = NULL WHERE line_name = \'Unknown Railway\' OR line_name = \'\'')
print(f"Purged Unknown Railway from {cur.rowcount} properties.")

conn.commit()
cur.close()
conn.close()
