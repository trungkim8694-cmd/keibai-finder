import os, psycopg2
from dotenv import load_dotenv

load_dotenv('../web/.env')
conn = psycopg2.connect(os.environ['DATABASE_URL'].replace('?schema=public', ''))
cur = conn.cursor()

print("--- BIT Properties RAW TEXT ---")
cur.execute('SELECT sale_unit_id, CASE WHEN raw_text IS NULL THEN \'NULL\' ELSE length(raw_text)::text END as len FROM "Property" WHERE source_provider = \'BIT\' LIMIT 5')
for r in cur.fetchall():
    print(r)

print("\n--- BIT Properties IMAGES ---")
cur.execute('SELECT sale_unit_id, cardinality(images) as img_count FROM "Property" WHERE source_provider = \'BIT\' LIMIT 5')
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
