import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT 
        status,
        COUNT(*),
        COUNT(CASE WHEN bid_end_date >= NOW() THEN 1 END) as future_end_date,
        COUNT(CASE WHEN bid_end_date < NOW() THEN 1 END) as past_end_date,
        COUNT(CASE WHEN bid_end_date IS NULL THEN 1 END) as null_end_date
    FROM "Property"
    WHERE source_provider = 'BIT'
    GROUP BY status
""")
print("BIT properties by status and bid_end_date:")
for r in cur.fetchall():
    print(f"Status: {r[0]} | Total: {r[1]} | Future: {r[2]} | Past: {r[3]} | Null: {r[4]}")

cur.execute("""
    SELECT sale_unit_id, address, status, bid_start_date, bid_end_date, updated_at
    FROM "Property"
    WHERE source_provider = 'BIT'
    ORDER BY updated_at DESC
    LIMIT 10
""")
print("\nMost recently updated BIT properties:")
for r in cur.fetchall():
    print(f"  [{r[0]}] status={r[2]} | start={r[3]} | end={r[4]} | updated={r[5]} | addr={r[1]}")

cur.close()
conn.close()
