import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute("""
SELECT 
    prefecture,
    COUNT(*) as total,
    AVG("winningPrice") / 10000 as avg_win_man,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "winningPrice") / 10000 as median_win_man,
    AVG("winningPrice"::numeric / NULLIF("basePrice"::numeric, 0)) * 100 as avg_multiple
FROM "AuctionResult"
WHERE prefecture = '長崎県' AND "winningPrice" > 0 AND "basePrice" > 0
GROUP BY prefecture;
""")
r = cur.fetchone()
print(f"Pref: {r[0]} | Count: {r[1]} | Mean: {round(r[2]):,} 万円 | Median: {round(r[3]):,} 万円 | Multiple: {round(r[4], 1)}%")
