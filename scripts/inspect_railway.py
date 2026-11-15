import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT name_ja, line_name, lat, lng FROM "RailwayStation" LIMIT 20;')
for r in cur.fetchall():
    print(r)
