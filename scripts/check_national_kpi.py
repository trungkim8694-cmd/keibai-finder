import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
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
r = cur.fetchone()
print(f"Total: {r[0]:,} | National Avg: {r[1]:,} 万円 | Median: {r[2]:,} 万円 | Multiple: {r[3]}% | Avg Bidders: {r[4]}")
