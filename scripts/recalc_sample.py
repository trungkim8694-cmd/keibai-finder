import psycopg2
import os
import dotenv

dotenv.load_dotenv('C:/keibai-web/.env.local')
db_url = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Recalculate 19120001 with 0.65 depreciation factor for older house
cur.execute('SELECT sale_unit_id, starting_price, area FROM "Property" WHERE sale_unit_id = %s', ('19120001',))
row = cur.fetchone()
if row:
    start_price = row[1]
    base_est = 28082656
    factor = 0.65
    new_est = int(base_est * factor)
    new_gap = round(((new_est - start_price) / new_est) * 100.0, 1)
    cur.execute('UPDATE "Property" SET mlit_estimated_price = %s, mlit_investment_gap = %s WHERE sale_unit_id = %s', (new_est, new_gap, '19120001'))
    conn.commit()
    print(f"Successfully calibrated 19120001: new_est={new_est} ({round(new_est/10000)}万円), new_gap={new_gap}%")

cur.close()
conn.close()
