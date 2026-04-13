import os
import requests
import json
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
api_key = os.environ.get("GEMINI_API_KEY")
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("?schema=public", "")

def geocode_address(address, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    prompt = f"Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include any markdown formatting or code blocks. Address: Japan, {address}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    res = requests.post(url, headers=headers, json=payload, timeout=15)
    if res.status_code != 200:
        print(f"Error {res.status_code}: {res.text}")
        return None, None
    data = res.json()
    if "candidates" in data and len(data["candidates"]) > 0:
        text_response = data["candidates"][0]["content"]["parts"][0]["text"]
        try:
            loc = json.loads(text_response)
            return loc.get("lat"), loc.get("lng")
        except:
             print("Failed to parse JSON:", text_response)
    return None, None

conn = psycopg2.connect(db_url)
cur = conn.cursor()
# We target all properties to ensure we fix any wrong mock data.
cur.execute("SELECT sale_unit_id, address FROM \"Property\"")
rows = cur.fetchall()

print(f"Starting geocode fix for {len(rows)} properties...")
for row in rows:
    sale_unit_id, address = row
    print(f"Geocoding {sale_unit_id}: {address}...")
    lat, lng = geocode_address(address, api_key)
    if lat and lng:
        print(f"  Got: {lat}, {lng}")
        cur.execute("UPDATE \"Property\" SET lat=%s, lng=%s WHERE sale_unit_id=%s", (lat, lng, sale_unit_id))
        conn.commit()
    else:
        print("  Failed to geocode.")
    time.sleep(2)

cur.close()
conn.close()
print("Done fixing coordinates!")
