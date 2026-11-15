import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM "Property";')
print('Total Property:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM "Property" WHERE lat IS NOT NULL AND lng IS NOT NULL;')
print('Property with lat/lng:', cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM "Property" WHERE prefecture IS NOT NULL;')
print('Property with prefecture:', cur.fetchone()[0])
