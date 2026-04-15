
import psycopg2, os
from dotenv import load_dotenv

load_dotenv("../web/.env")
db_url = os.environ.get("DATABASE_URL")
if db_url:
    print("Trucating...")
    db_url = db_url.replace("?schema=public", "")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("TRUNCATE TABLE \"Property\" CASCADE;")
    conn.commit()
    print("Database Wiped!")
    cur.close()
    conn.close()

