import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

# 1. 47 Prefectures Aggregate
cur.execute("""
SELECT 
    prefecture,
    COUNT(*)::int as count,
    ROUND(AVG("basePrice") / 10000)::int as avg_base,
    ROUND(AVG("winningPrice") / 10000)::int as avg_win,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "winningPrice") / 10000)::int as median_win,
    ROUND((SUM("winningPrice"::numeric) / NULLIF(SUM("basePrice"::numeric), 0)) * 1000) / 10 as multiple_rate,
    ROUND(COALESCE(AVG("bidderCount"::numeric), 0), 1) as avg_bidders
FROM "AuctionResult"
WHERE prefecture IS NOT NULL 
  AND "winningPrice" > 0 
  AND "basePrice" > 0
GROUP BY prefecture;
""")
rows = cur.fetchall()
print(f"Total Prefectures: {len(rows)}")

# 2. National Stats
cur.execute("""
SELECT 
    COUNT(*)::int as total_records,
    ROUND(AVG("winningPrice") / 10000)::int as national_avg_win,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "winningPrice") / 10000)::int as national_median_win,
    ROUND((SUM("winningPrice"::numeric) / NULLIF(SUM("basePrice"::numeric), 0)) * 1000) / 10 as national_multiple_rate,
    ROUND(COALESCE(AVG("bidderCount"::numeric), 0), 1) as national_avg_bidders
FROM "AuctionResult"
WHERE prefecture IS NOT NULL 
  AND "winningPrice" > 0 
  AND "basePrice" > 0;
""")
nat = cur.fetchone()
print("National:", nat)

# 3. Competition Stats
cur.execute("""
SELECT 
  CASE 
    WHEN "bidderCount" = 1 THEN '1名（単独入札）'
    WHEN "bidderCount" BETWEEN 2 AND 4 THEN '2〜4名（低競争）'
    WHEN "bidderCount" BETWEEN 5 AND 9 THEN '5〜9名（標準競争）'
    ELSE '10名以上（激戦区）'
  END as range,
  COUNT(*)::int as count,
  ROUND(AVG("winningPrice"::numeric / NULLIF("basePrice"::numeric, 0) * 100)::numeric, 1) as avg_multiple
FROM "AuctionResult"
WHERE "bidderCount" IS NOT NULL AND "bidderCount" > 0 AND "winningPrice" > 0 AND "basePrice" > 0
GROUP BY 1;
""")
comp = cur.fetchall()
print("Competition:", comp)
