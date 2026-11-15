import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute('SELECT count(*) FROM "DailyDigest"')
cnt = cur.fetchone()[0]
print(f"Total DailyDigest Articles: {cnt}")

cur.execute('SELECT slug, title_ja, category, "publishDate" FROM "DailyDigest" ORDER BY "publishDate" DESC LIMIT 5')
for r in cur.fetchall():
    print(f"  [{r[2]}] {r[1]} (slug: {r[0]}) at {r[3]}")

cur.close()
conn.close()
