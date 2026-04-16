import os
import psycopg2

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="/Users/kimtrung/keibai-finder/web/.env")
    load_dotenv(dotenv_path="/Users/kimtrung/keibai-finder/web/.env.local")
    db_url = os.environ.get("DATABASE_URL")

db_url = db_url.replace("?schema=public", "")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

try:
    cur.execute('ALTER TABLE "Property" ADD COLUMN mlit_estimated_price BIGINT;')
    print("Added mlit_estimated_price")
except Exception as e:
    print(f"Error (maybe already exists): {e}")

try:
    cur.execute('ALTER TABLE "Property" ADD COLUMN mlit_investment_gap DOUBLE PRECISION;')
    print("Added mlit_investment_gap")
except Exception as e:
    print(f"Error (maybe already exists): {e}")

try:
    cur.execute('CREATE INDEX idx_property_mlit_gap ON "Property" (mlit_investment_gap);')
    print("Added index")
except Exception as e:
    print(f"Error (maybe already exists): {e}")

cur.close()
conn.close()
