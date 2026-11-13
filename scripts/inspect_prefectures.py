import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT prefecture, status, count(*)
    FROM "Property"
    WHERE source_provider = 'BIT' AND prefecture IN ('東京都', '神奈川県', '大阪府', '新潟県', '茨城県', '千葉県', '埼玉県')
    GROUP BY prefecture, status
    ORDER BY prefecture, status
""")
for r in cur.fetchall():
    print(f"{r[0]} | status={r[1]} | count={r[2]}")

cur.close()
conn.close()
