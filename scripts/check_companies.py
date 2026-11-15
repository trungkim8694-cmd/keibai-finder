import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM "RealEstateCompany";')
print('Total RealEstateCompany:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM "RealEstateCompany" WHERE prefecture IS NOT NULL;')
print('With prefecture:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM "RealEstateCompany" WHERE lat IS NOT NULL AND lng IS NOT NULL;')
print('With lat/lng:', cur.fetchone()[0])
