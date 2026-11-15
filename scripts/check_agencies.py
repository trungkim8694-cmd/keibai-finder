import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env')
load_dotenv('web/.env.local')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
try:
    cur.execute('SELECT COUNT(*) FROM "RealEstateCompany";')
    print("RealEstateCompany count:", cur.fetchone()[0])
except Exception as e:
    print("Error querying RealEstateCompany:", e)
cur.close()
conn.close()

