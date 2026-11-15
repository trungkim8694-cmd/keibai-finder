import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('ALTER TABLE "AuctionResult" ADD COLUMN IF NOT EXISTS "prefecture" text;')
cur.execute('CREATE INDEX IF NOT EXISTS "idx_auction_result_prefecture" ON "AuctionResult" ("prefecture");')
conn.commit()
print('Successfully added prefecture column and index to AuctionResult!')
