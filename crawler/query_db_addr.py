import psycopg2, os
from dotenv import load_dotenv
load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute('SELECT address FROM "Property" LIMIT 5')
print([r[0] for r in cur.fetchall()])
