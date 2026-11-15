import psycopg2, time

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()

t0 = time.time()
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
GROUP BY prefecture
ORDER BY avg_win DESC;
""")
rows = cur.fetchall()
elapsed = time.time() - t0
print(f"Query returned {len(rows)} prefectures in {elapsed*1000:.1f}ms!")
print("\nTop 5 by average price:")
for r in rows[:5]:
    print(f"  {r[0]}: TB={r[3]:,}万円 (Trung vị={r[4]:,}万円) | Bội số={r[5]}% | Số căn={r[1]:,}")

print("\nBottom 5 (Affordable / Bargain):")
for r in rows[-5:]:
    print(f"  {r[0]}: TB={r[3]:,}万円 (Trung vị={r[4]:,}万円) | Bội số={r[5]}% | Số căn={r[1]:,}")
