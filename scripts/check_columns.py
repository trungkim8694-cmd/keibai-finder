import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AuctionResult';
""")
for r in cur.fetchall():
    print(r[0], r[1])
