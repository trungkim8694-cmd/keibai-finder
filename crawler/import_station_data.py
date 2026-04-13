import os
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Database URL not found in .env")
    exit(1)

db_url = db_url.replace("?schema=public", "")

print("Downloading railway station dataset via OpenStreetMap Overpass (Japan)...")
overpass_url = "http://overpass-api.de/api/interpreter"
overpass_query = """
[out:json][timeout:90];
area["name:en"="Japan"]->.searchArea;
(
  node["railway"="station"](area.searchArea);
);
out center;
"""

try:
    response = requests.post(overpass_url, data={'data': overpass_query})
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Error calling Overpass API: {e}")
    exit(1)

data = response.json()
elements = data.get("elements", [])
print(f"Fetched {len(elements)} station nodes from OSM. Preparing to insert to DB...")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Optional: Clear existing data before import? No, let's clear it just to be clean.
cur.execute('DELETE FROM "RailwayStation"')

inserted = 0
skipped = 0
for node in elements:
    tags = node.get("tags", {})
    name_ja = tags.get("name")
    
    # If no default name, fallback to name:ja
    if not name_ja:
        name_ja = tags.get("name:ja")
        
    if not name_ja:
        skipped += 1
        continue
        
    # Operator or line name if available
    line_name = tags.get("network") or tags.get("operator") or "Unknown Railway"
    
    lat = node.get("lat")
    lng = node.get("lon")
    
    if lat is not None and lng is not None:
        try:
            cur.execute(
                """INSERT INTO "RailwayStation" (id, name_ja, line_name, lat, lng, created_at)
                   VALUES (gen_random_uuid(), %s, %s, %s, %s, NOW())""",
                (name_ja, line_name, lat, lng)
            )
            inserted += 1
        except Exception as e:
            print(f"Error inserting station {name_ja}: {e}")
            conn.rollback()

conn.commit()
cur.close()
conn.close()

print(f"Script completed! Successfully imported {inserted} stations into PostgreSQL.")
print(f"Skipped {skipped} nodes due to missing Japanese names.")
