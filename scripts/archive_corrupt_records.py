import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db"
)

def archive_corrupt():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        UPDATE "Property"
        SET status = 'ARCHIVED'
        WHERE status = 'ACTIVE' AND (address = 'Unknown' OR address IS NULL OR lat IS NULL OR lng IS NULL)
    """)
    conn.commit()
    print(f"Archived invalid active records: {cur.rowcount}")

    
    cur.execute("""
        SELECT sale_unit_id, address, lat, lng, city, status, source_provider FROM "Property"
        WHERE status = 'ACTIVE' AND (address = 'Unknown' OR address IS NULL OR lat IS NULL OR lng IS NULL)
    """)
    rows = cur.fetchall()
    print(f"Remaining active corrupt records count: {len(rows)}")
    for r in rows:
        print("Corrupt row:", r)

    conn.close()

if __name__ == "__main__":
    archive_corrupt()
