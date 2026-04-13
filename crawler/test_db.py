import os
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT raw_display_data FROM \"Property\" WHERE source_provider = 'NTA' LIMIT 1;")
    row = cur.fetchone()
    print(json.dumps(row[0], indent=2, ensure_ascii=False))
    
main()
