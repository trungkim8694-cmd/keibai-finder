import os
import psycopg2
from dotenv import load_dotenv
import math

load_dotenv("../web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

def get_nearest_station_from_db(lat, lng, cur2):
    if not lat or not lng:
        return None, None, None, None
        
    sql = f"""
      SELECT 
        "name_ja", "line_name",
        ( 6371 * acos( cos( radians({lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians({lng}) ) + sin( radians({lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
      FROM "RailwayStation"
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    """
    try:
        cur2.execute(sql)
        row = cur2.fetchone()
        if row:
            name_ja, dict_line_name, dist_km = row
            if dist_km is not None and dist_km < 100:
                dist_m = int(dist_km * 1000)
                walk_min = math.ceil((dist_km * 1000 * 1.25) / 80.0)
                return name_ja, dict_line_name, dist_m, walk_min
    except Exception as e:
        pass
    return None, None, None, None

cur.execute('SELECT sale_unit_id, lat, lng FROM "Property" WHERE lat IS NOT NULL')
rows = cur.fetchall()

updated = 0
for r in rows:
    sale_unit_id, lat, lng = r
    cur2 = conn.cursor()
    st_name, line_name, st_dist, st_time = get_nearest_station_from_db(lat, lng, cur2)
    cur2.close()
    
    if st_name:
        cur3 = conn.cursor()
        cur3.execute('UPDATE "Property" SET nearest_station = %s, line_name = %s, distance_to_station = %s, walk_time_to_station = %s WHERE sale_unit_id = %s', 
                     (st_name, line_name, st_dist, st_time, sale_unit_id))
        cur3.close()
        updated += 1

conn.commit()
cur.close()
conn.close()

print(f"Retroactively updated {updated} properties with new station structure")
