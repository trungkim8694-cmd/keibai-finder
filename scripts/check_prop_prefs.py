import psycopg2

conn = psycopg2.connect('postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db')
cur = conn.cursor()
cur.execute('SELECT COUNT(DISTINCT (city, prefecture)) FROM "Property" WHERE city IS NOT NULL AND prefecture IS NOT NULL;')
print("Distinct (city, pref) in Property:", cur.fetchone()[0])

cur.execute('SELECT DISTINCT prefecture FROM "Property" WHERE prefecture IS NOT NULL ORDER BY prefecture;')
prefs = [r[0] for r in cur.fetchall()]
print(f"Total Prefectures in Property: {len(prefs)}")
