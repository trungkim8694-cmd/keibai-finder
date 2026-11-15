import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
load_dotenv('web/.env')
db_url = os.environ.get('DATABASE_URL').split('?')[0]
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT count(*), max(created_at) FROM \"AuctionResult\" WHERE raw_data->>'source' = 'NTA'")
r = cur.fetchone()
print(f"NTA AuctionResults in DB: {r[0]}, Latest: {r[1]}")

cur.execute("SELECT id, sale_unit_id, \"caseNumber\", address, \"winningPrice\", \"completionDate\", \"winnerType\" FROM \"AuctionResult\" WHERE raw_data->>'source' = 'NTA' LIMIT 10")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
