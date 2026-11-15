import os, psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

print("=== AUDIT TEST 1: Line Name Search ===")
cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND (
        address ILIKE '%山手線%' OR 
        nearest_station ILIKE '%山手線%' OR 
        prefecture ILIKE '%山手線%' OR 
        city ILIKE '%山手線%'
    );
""")
print("Current keyword matches for '山手線':", cur.fetchone()[0])

cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND line_name ILIKE '%山手線%';
""")
print("Actual properties with line_name='山手線':", cur.fetchone()[0])

print("\n=== AUDIT TEST 2: Court Name Search ===")
cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND (
        address ILIKE '%東京地方裁判所%' OR 
        nearest_station ILIKE '%東京地方裁判所%' OR 
        prefecture ILIKE '%東京地方裁判所%' OR 
        city ILIKE '%東京地方裁判所%'
    );
""")
print("Current keyword matches for '東京地方裁判所':", cur.fetchone()[0])

cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND court_name ILIKE '%東京地方裁判所%';
""")
print("Actual properties with court_name='東京地方裁判所':", cur.fetchone()[0])

print("\n=== AUDIT TEST 3: Multi-word Token Search ('東京 マンション') ===")
cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' AND (
        address ILIKE '%東京 マンション%' OR 
        nearest_station ILIKE '%東京 マンション%'
    );
""")
print("Current single-string match for '東京 マンション':", cur.fetchone()[0])

cur.execute("""
    SELECT COUNT(*) 
    FROM "Property" 
    WHERE status = 'ACTIVE' 
      AND (address ILIKE '%東京%' OR prefecture ILIKE '%東京%')
      AND (property_type ILIKE '%マンション%' OR address ILIKE '%マンション%');
""")
print("Multi-token AND match for '東京' AND 'マンション':", cur.fetchone()[0])

print("\n=== AUDIT TEST 4: Case Number Search ('令和' or 'ケ') ===")
cur.execute("""
    SELECT sale_unit_id, court_name, address 
    FROM "Property" 
    WHERE status = 'ACTIVE' 
    LIMIT 3;
""")
sample = cur.fetchall()
for s in sample:
    print("Sample ID:", s[0], "Court:", s[1], "Address:", s[2][:30])

cur.close()
conn.close()
