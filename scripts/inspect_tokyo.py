import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT sale_unit_id, status, updated_at, bid_start_date, bid_end_date, address
    FROM "Property"
    WHERE source_provider = 'BIT' AND prefecture = '東京都'
    ORDER BY updated_at DESC
    LIMIT 25
""")
print("Tokyo properties in DB:")
for r in cur.fetchall():
    print(f"[{r[0]}] status={r[1]} | updated={r[2]} | end={r[4]} | addr={r[5]}")

cur.close()
conn.close()
