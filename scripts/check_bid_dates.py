import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT 
        status,
        count(*),
        count(CASE WHEN bid_end_date >= NOW() THEN 1 END) as future_bid_end,
        count(CASE WHEN bid_end_date < NOW() THEN 1 END) as past_bid_end,
        count(CASE WHEN bid_end_date IS NULL THEN 1 END) as null_bid_end
    FROM "Property"
    GROUP BY status
""")
for r in cur.fetchall():
    print(f"Status {r[0]}: Total={r[1]}, Future={r[2]}, Past={r[3]}, Null={r[4]}")

cur.execute("""
    SELECT min(bid_end_date), max(bid_end_date)
    FROM "Property"
    WHERE status = 'ACTIVE'
""")
row = cur.fetchone()
print(f"\nActive properties bid_end_date range: {row[0]} -> {row[1]}")

cur.close()
conn.close()
