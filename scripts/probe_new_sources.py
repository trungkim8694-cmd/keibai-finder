import os, psycopg2
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'web', '.env'))
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("""
    SELECT sale_unit_id, property_type, starting_price, mlit_estimated_price, mlit_investment_gap
    FROM "Property" WHERE sale_unit_id = '00000002727';
""")
print("00000002727:", cur.fetchone())
cur.execute("""
    SELECT source_provider, COUNT(*) AS total,
           COUNT(*) FILTER (WHERE mlit_estimated_price IS NOT NULL AND mlit_estimated_price > 0) AS has_est
    FROM "Property" WHERE status = 'ACTIVE'
    GROUP BY 1 ORDER BY 1;
""")
for r in cur.fetchall():
    print("Coverage:", r)
cur.close()
conn.close()
