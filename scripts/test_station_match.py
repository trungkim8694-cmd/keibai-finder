import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

# Test matching nearest_station to RailwayStation
cur.execute("""
SELECT 
    COUNT(DISTINCT ar.raw_data->>'nearest_station') as unique_stations_in_dump,
    COUNT(DISTINCT rs.name_ja) as matched_stations
FROM "AuctionResult" ar
LEFT JOIN "RailwayStation" rs ON rs.name_ja = ar.raw_data->>'nearest_station'
WHERE ar.raw_data->>'source' = 'competitor_dump';
""")
r = cur.fetchone()
print(f"Unique stations in dump: {r[0]} | Matched in RailwayStation: {r[1]}")

cur.execute("""
SELECT 
    COUNT(*) as total_dump,
    COUNT(rs.id) as matched_rows
FROM "AuctionResult" ar
LEFT JOIN "RailwayStation" rs ON rs.name_ja = ar.raw_data->>'nearest_station'
WHERE ar.raw_data->>'source' = 'competitor_dump';
""")
r2 = cur.fetchone()
print(f"Total dump rows: {r2[0]} | Matched with RailwayStation: {r2[1]}")
