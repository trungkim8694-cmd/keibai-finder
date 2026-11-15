import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM "RealEstateCompany" WHERE "isVerified" = true OR "isClaimed" = true;')
print('Verified/claimed count:', cur.fetchone()[0])

cur.execute('SELECT id, "companyName", "isVerified", "isClaimed" FROM "RealEstateCompany" WHERE "isVerified" = true OR "isClaimed" = true;')
for r in cur.fetchall():
    print('Verified item:', r)

cur.close()
conn.close()
