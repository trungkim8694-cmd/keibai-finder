import psycopg2, os, json
from dotenv import load_dotenv

load_dotenv('../web/.env')
conn=psycopg2.connect(os.getenv('DATABASE_URL').replace('?schema=public', ''))
cur=conn.cursor()
cur.execute("UPDATE \"Property\" SET images = '[]' WHERE source_provider = 'BIT';")
conn.commit()
print("Reset images for BIT to force crawler to pick them up.")
