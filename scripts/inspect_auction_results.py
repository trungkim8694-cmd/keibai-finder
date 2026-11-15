import psycopg2
import json

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

cur.execute('SELECT COUNT(*) FROM "AuctionResult";')
total = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM "AuctionResult" WHERE "winningPrice" IS NOT NULL AND "winningPrice" > 0;')
has_win = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM "AuctionResult" WHERE "basePrice" IS NOT NULL AND "basePrice" > 0;')
has_base = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM "AuctionResult" WHERE "winningPrice" > 0 AND "basePrice" > 0;')
both_prices = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM "AuctionResult" WHERE "address" IS NOT NULL AND "address" != \'\';')
has_addr = cur.fetchone()[0]

print(f"Total: {total}")
print(f"Has winningPrice > 0: {has_win}")
print(f"Has basePrice > 0: {has_base}")
print(f"Both prices > 0: {both_prices}")
print(f"Has address: {has_addr}")

cur.execute('SELECT address, "basePrice", "winningPrice", "caseNumber", "raw_data" FROM "AuctionResult" WHERE "winningPrice" > 0 LIMIT 15;')
for row in cur.fetchall():
    print(f"Address: {row[0]} | Base: {row[1]} | Win: {row[2]} | Case: {row[3]}")
