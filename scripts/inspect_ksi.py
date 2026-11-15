import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT * FROM \"Property\" WHERE sale_unit_id = 'KSI_73703';")
row = cur.fetchone()
if not row:
    print("Record KSI_73703 NOT FOUND in DB!")
else:
    colnames = [desc[0] for desc in cur.description]
    for k, v in zip(colnames, row):
        print(f"{k}: {v}")
cur.close()
conn.close()
