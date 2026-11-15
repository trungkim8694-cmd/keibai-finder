import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT "caseNumber", lat, lng, "raw_data" FROM "AuctionResult" WHERE raw_data->>\'source\' = \'competitor_dump\' LIMIT 5;')
for r in cur.fetchall():
    print(r[0], r[1], r[2], r[3])
