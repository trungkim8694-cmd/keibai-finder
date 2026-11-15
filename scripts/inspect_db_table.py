import os, psycopg2
from dotenv import load_dotenv
load_dotenv('web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM "RealEstateCompany";')
print("Total companies:", cur.fetchone()[0])

cur.execute('SELECT prefecture, count(*) FROM "RealEstateCompany" GROUP BY prefecture ORDER BY count(*) DESC LIMIT 5;')
for r in cur.fetchall():
    print("Prefecture:", r)
cur.close()
conn.close()
