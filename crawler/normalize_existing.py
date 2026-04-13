import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("""
    UPDATE "AuctionResult"
    SET "marginRate" = (CAST("winningPrice" AS float) - CAST("basePrice" AS float)) / CAST("basePrice" AS float)
    WHERE "winningPrice" IS NOT NULL AND "basePrice" IS NOT NULL AND "basePrice" > 0;
""")

cur.execute("""
    UPDATE "AuctionResult"
    SET "competitionLevel" = CASE
        WHEN "bidderCount" > 10 THEN '高競争'
        WHEN "bidderCount" > 3 THEN '中競争'
        ELSE '低競争'
    END
    WHERE "bidderCount" IS NOT NULL;
""")

conn.commit()
print("Normalized existing DB rows.")
cur.close()
conn.close()
