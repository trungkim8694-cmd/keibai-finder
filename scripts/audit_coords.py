import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT 
        count(*) as total,
        count(lat) as has_coords,
        count(*) - count(lat) as missing_coords,
        ROUND(count(lat)::numeric / count(*) * 100, 2) as success_pct
    FROM "Property"
""")
row = cur.fetchone()
print(f"Total: {row[0]}, Has coords: {row[1]}, Missing: {row[2]}, Success rate: {row[3]}%")

cur.execute("""
    SELECT 
        source_provider,
        status,
        count(*) as total,
        count(lat) as has_coords,
        count(*) - count(lat) as missing,
        ROUND(count(lat)::numeric / count(*) * 100, 2) as success_pct
    FROM "Property"
    GROUP BY source_provider, status
    ORDER BY source_provider, status
""")
for r in cur.fetchall():
    print(f"Provider {r[0]} ({r[1]}): Total {r[2]}, Has coords: {r[3]}, Missing: {r[4]}, Rate: {r[5]}%")

# Check samples with missing coords
cur.execute("""
    SELECT sale_unit_id, source_provider, prefecture, city, address
    FROM "Property"
    WHERE lat IS NULL
    LIMIT 10
""")
print("\nSample missing coords:")
for r in cur.fetchall():
    print(f"  [{r[0]}] ({r[1]}) {r[4]}")

cur.close()
conn.close()

