import os
import requests
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("?schema=public", "")

def geocode_osm(address):
    # Nominatim API
    url = "https://nominatim.openstreetmap.org/search"
    clean_addr = address.split(" ")[0] # Lấy "伊達市東関内町" bỏ số băng
    headers = {
        'User-Agent': 'KeibaiFinder/1.0 (kimtrung@keibai)'
    }
    params = {
        'q': f"{clean_addr}, Hokkaido, Japan",
        'format': 'json',
        'limit': 1
    }
    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        data = res.json()
        if data and len(data) > 0:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"OSM Error: {e}")
    return None, None

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT sale_unit_id, address FROM \"Property\"")
rows = cur.fetchall()

print(f"Starting OSM geocode fix for {len(rows)} properties...")
for row in rows:
    sale_unit_id, address = row
    print(f"Geocoding {sale_unit_id}: {address}...")
    lat, lng = geocode_osm(address)
    if lat and lng:
        print(f"  Got: {lat}, {lng}")
        cur.execute("UPDATE \"Property\" SET lat=%s, lng=%s WHERE sale_unit_id=%s", (lat, lng, sale_unit_id))
        conn.commit()
    else:
        print("  Failed to geocode via OSM.")
    time.sleep(1.5) # rate limit nominatim

cur.close()
conn.close()
print("Done fixing coordinates using OSM!")
