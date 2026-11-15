import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM "CompanyClaimRequest";')
print('Claim requests count:', cur.fetchone()[0])

cur.execute('SELECT id, "companyId", "applicantName", "applicantEmail", status FROM "CompanyClaimRequest";')
for r in cur.fetchall():
    print('Claim row:', r)

cur.close()
conn.close()
