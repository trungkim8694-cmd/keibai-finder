import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT sale_unit_id FROM "Property" WHERE status = %s LIMIT 1', ('ACTIVE',))
prop_id = cur.fetchone()[0]
print("PROPERTY_ID:", prop_id)
