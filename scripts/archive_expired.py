import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env.local')
if not os.getenv('DATABASE_URL'):
    load_dotenv('web/.env')
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("No DATABASE_URL found!")
    exit(1)

conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("--- Current Breakdown by Status ---")
cur.execute("""
    SELECT 
        status,
        COUNT(*),
        COUNT(CASE WHEN bid_end_date < NOW() THEN 1 END) as expired_count,
        COUNT(CASE WHEN bid_end_date >= NOW() THEN 1 END) as valid_count,
        COUNT(CASE WHEN bid_end_date IS NULL THEN 1 END) as null_date_count
    FROM "Property"
    GROUP BY status;
""")
for row in cur.fetchall():
    print(f"Status: {row[0]} | Total: {row[1]} | Expired (< NOW): {row[2]} | Valid (>= NOW): {row[3]} | Null date: {row[4]}")

print("\n--- By Source Provider for status='ACTIVE' ---")
cur.execute("""
    SELECT 
        source_provider,
        COUNT(*),
        COUNT(CASE WHEN bid_end_date < NOW() THEN 1 END) as expired_count,
        COUNT(CASE WHEN bid_end_date >= NOW() THEN 1 END) as valid_count,
        COUNT(CASE WHEN bid_end_date IS NULL THEN 1 END) as null_date_count
    FROM "Property"
    WHERE status = 'ACTIVE'
    GROUP BY source_provider;
""")
for row in cur.fetchall():
    print(f"Provider: {row[0]} | Total: {row[1]} | Expired: {row[2]} | Valid: {row[3]} | Null date: {row[4]}")

print("\n--- Executing Archival of Expired Properties ---")
cur.execute("""
    UPDATE "Property"
    SET status = 'ARCHIVED', updated_at = NOW()
    WHERE status = 'ACTIVE' AND bid_end_date < NOW();
""")
conn.commit()
print(f"Archived {cur.rowcount} expired properties.")

print("\n--- After Archival: status='ACTIVE' remaining ---")
cur.execute("""
    SELECT 
        source_provider,
        COUNT(*),
        COUNT(CASE WHEN bid_end_date >= NOW() THEN 1 END) as valid_count,
        COUNT(CASE WHEN bid_end_date IS NULL THEN 1 END) as null_date_count
    FROM "Property"
    WHERE status = 'ACTIVE'
    GROUP BY source_provider;
""")
for row in cur.fetchall():
    print(f"Provider: {row[0]} | Total ACTIVE: {row[1]} | Valid (>= NOW): {row[2]} | Null date: {row[3]}")

cur.close()
conn.close()
