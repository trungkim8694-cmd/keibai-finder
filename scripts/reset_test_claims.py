import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True
cur = conn.cursor()

# Reset test agency
cur.execute('''
UPDATE "RealEstateCompany"
SET "isVerified" = false,
    "isClaimed" = false,
    "claimedUserId" = null
WHERE "companyName" LIKE '%博多駅前エステート%';
''')

# Delete test claim requests
cur.execute('''
DELETE FROM "CompanyClaimRequest"
WHERE "applicantEmail" = 'trungkim8694@gmail.com' OR id = 'test-hakata-claim-req';
''')

cur.execute('SELECT id, "companyName", "isVerified", "isClaimed" FROM "RealEstateCompany" WHERE "isVerified" = true OR "isClaimed" = true;')
rows = cur.fetchall()
print('Remaining verified companies in DB:', len(rows))

cur.close()
conn.close()
