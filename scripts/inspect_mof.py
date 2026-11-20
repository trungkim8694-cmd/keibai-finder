import os, psycopg2, json
from dotenv import load_dotenv

load_dotenv('web/.env.local')
db_url = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('SELECT source_provider, count(*) FROM "Property" GROUP BY 1')
print("--- SOURCE PROVIDERS ---")
for r in cur.fetchall():
    print(r)

cur.execute('SELECT sale_unit_id, source_provider, court_name, managing_authority, source_url, pdf_url, raw_display_data FROM "Property" WHERE sale_unit_id = %s', ('MOF_kantou_0038_b7c2',))
row = cur.fetchone()
print("\n--- PROPERTY MOF_kantou_0038_b7c2 raw_display_data ---")
print(json.dumps(row[6], indent=2, ensure_ascii=False) if row and row[6] else "None")

cur.execute('SELECT sale_unit_id, source_provider, court_name, managing_authority, source_url, pdf_url FROM "Property" WHERE source_provider = %s LIMIT 2', ('KSI',))
print("\n--- SAMPLE KSI ---")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
