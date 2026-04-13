import psycopg2
import requests
import urllib.parse
import time
import re
import os
import sys

def geocode_osm(address):
    headers = {"User-Agent": "KeibaiFinderApp/1.0"}
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(address)}&format=json&limit=1"
        res = requests.get(url, headers=headers, timeout=10)
        data = res.json()
        if data and len(data) > 0:
            return float(data[0]["lat"]), float(data[0]["lon"])
            
        m = re.match(r"(.*?[都道府県].*?[市区町村].*?[町丁])", address)
        if m:
            short_addr = m.group(1)
            time.sleep(1)
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(short_addr)}&format=json&limit=1"
            res = requests.get(url, headers=headers, timeout=10)
            data = res.json()
            if data and len(data) > 0:
                return float(data[0]["lat"]), float(data[0]["lon"])
        return None, None
    except Exception as e:
        return None, None

with open("gc_log.txt", "w") as f:
    f.write("Starting...\n")

db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT sale_unit_id, address FROM \"Property\" WHERE source_provider = 'NTA' AND lat IS NULL")
rows = cur.fetchall()

with open("gc_log.txt", "a") as f:
    f.write(f"Bắt đầu geocoding OSM cho {len(rows)} tài sản...\n")

success = 0
for i, row in enumerate(rows):
    sale_unit_id, address = row
    lat, lng = geocode_osm(address)
    if lat and lng:
        cur.execute("UPDATE \"Property\" SET lat = %s, lng = %s WHERE sale_unit_id = %s", (lat, lng, sale_unit_id))
        conn.commit()
        success += 1
        msg = f"[{i+1}/{len(rows)}] [OK] {sale_unit_id} -> {lat}, {lng}\n"
    else:
        msg = f"[{i+1}/{len(rows)}] [FAIL] {sale_unit_id} ({address})\n"
    with open("gc_log.txt", "a") as f:
        f.write(msg)
    time.sleep(1)

with open("gc_log.txt", "a") as f:
    f.write(f"Done: {success}/{len(rows)}\n")

cur.close()
conn.close()
