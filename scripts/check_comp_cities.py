import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT COUNT(DISTINCT (city, prefecture)) FROM "RealEstateCompany" WHERE city IS NOT NULL AND prefecture IS NOT NULL;')
print('RealEstateCompany distinct (city, pref):', cur.fetchone()[0])
cur.execute('SELECT DISTINCT city, prefecture FROM "RealEstateCompany" WHERE city IS NOT NULL AND prefecture IS NOT NULL LIMIT 20;')
for r in cur.fetchall():
    print(r)
