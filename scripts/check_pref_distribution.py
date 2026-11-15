import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute("""
SELECT prefecture, COUNT(*) 
FROM "AuctionResult" 
WHERE prefecture IS NOT NULL 
GROUP BY prefecture 
ORDER BY COUNT(*) DESC;
""")
rows = cur.fetchall()
print(f"Tổng số tỉnh có dữ liệu: {len(rows)} / 47")
print("Top 10 tỉnh có nhiều căn nhất:")
for r in rows[:10]:
    print(f"  - {r[0]}: {r[1]:,} căn")
print("10 tỉnh có ít căn nhất:")
for r in rows[-10:]:
    print(f"  - {r[0]}: {r[1]:,} căn")
