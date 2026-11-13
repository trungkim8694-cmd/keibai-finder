import psycopg2

conn = psycopg2.connect("postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db")
cur = conn.cursor()

cur.execute("""
    SELECT count(*)
    FROM "Property"
    WHERE source_provider = 'BIT'
      AND status = 'ARCHIVED'
      AND bid_end_date >= NOW()
""")
to_recover = cur.fetchone()[0]
print(f"Found {to_recover} BIT properties falsely marked as ARCHIVED with future bid_end_date.")

if to_recover > 0:
    cur.execute("""
        UPDATE "Property"
        SET status = 'ACTIVE', updated_at = NOW()
        WHERE source_provider = 'BIT'
          AND status = 'ARCHIVED'
          AND bid_end_date >= NOW()
    """)
    conn.commit()
    print(f"Successfully recovered {cur.rowcount} properties back to ACTIVE!")

cur.execute("""
    SELECT count(*)
    FROM "Property"
    WHERE status = 'ACTIVE' AND (bid_end_date >= NOW() OR bid_end_date IS NULL)
""")
total_active = cur.fetchone()[0]
print(f"Total ACTIVE valid properties in DB now: {total_active}")

cur.close()
conn.close()

