import psycopg2
import json

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

cur.execute('SELECT "caseNumber", "sale_unit_id", "raw_data" FROM "AuctionResult" WHERE "address" IS NULL OR "address" = \'\' LIMIT 5;')
for row in cur.fetchall():
    print(f"Case: {row[0]} | SaleUnitId: {row[1]} | RawData keys: {list(row[2].keys()) if row[2] else None}")
    if row[2]:
        print("RawData sample:", json.dumps(row[2], ensure_ascii=False)[:300])

cur.execute('SELECT COUNT(*) FROM "AuctionResult" WHERE "sale_unit_id" IS NOT NULL;')
has_sale_unit_id = cur.fetchone()[0]
print("Has sale_unit_id:", has_sale_unit_id)

cur.execute('SELECT COUNT(*) FROM "AuctionResult" ar JOIN "Property" p ON ar.sale_unit_id = p.sale_unit_id;')
joined_property = cur.fetchone()[0]
print("Joined Property:", joined_property)

cur.execute('SELECT COUNT(*) FROM "AuctionResult" ar JOIN "Property" p ON ar."caseNumber" = p.case_number;')
joined_by_case = cur.fetchone()[0]
print("Joined Property by caseNumber:", joined_by_case)
