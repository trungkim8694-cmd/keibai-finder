import urllib.request
import json
import psycopg2, os
from dotenv import load_dotenv

load_dotenv('../web/.env')
conn=psycopg2.connect(os.getenv('DATABASE_URL').replace('?schema=public', ''))
cur=conn.cursor()
cur.execute("SELECT raw_display_data FROM \"Property\" WHERE source_provider='BIT' LIMIT 1;")
res = cur.fetchone()
print(res[0] if res else 'No Data')
