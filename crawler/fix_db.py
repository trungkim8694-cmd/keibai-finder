import os, psycopg2
from dotenv import load_dotenv
load_dotenv("../web/.env")

conn = psycopg2.connect(os.environ["DATABASE_URL"].replace("?schema=public", ""))
cur = conn.cursor()
cur.execute("UPDATE \"Property\" SET mlit_investment_gap = NULL, mlit_estimated_price = NULL WHERE property_type IN ('農地', 'その他')")
conn.commit()
print(f"Updated {cur.rowcount} properties.")
