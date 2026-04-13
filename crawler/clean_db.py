import psycopg2
import os
from dotenv import load_dotenv
load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
conn = psycopg2.connect(os.environ.get("DATABASE_URL", "").replace("?schema=public", ""))
cur = conn.cursor()
cur.execute('DELETE FROM "AuctionHistory"')
cur.execute('DELETE FROM "Property"')
conn.commit()
print("All Property and AuctionHistory data deleted successfully.")
