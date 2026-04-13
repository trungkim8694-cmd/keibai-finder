import psycopg2
import os
from dotenv import load_dotenv
load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute('UPDATE "Property" SET status=%s', ('ACTIVE',))
conn.commit()
print("All statuses restored to ACTIVE")
