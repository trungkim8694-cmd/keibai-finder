import os
import psycopg2
from dotenv import load_dotenv

# Load env
env_path = os.path.join(os.path.dirname(__file__), '../web/.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found. Check your .env file.")
    exit(1)

def main():
    try:
        clean_url = DATABASE_URL.split('?')[0]
        conn = psycopg2.connect(clean_url)
        cur = conn.cursor()
        
        print("Connected to database. Searching for line_name with semicolons or commas...")
        
        cur.execute("""
            SELECT sale_unit_id, line_name 
            FROM "Property" 
            WHERE line_name LIKE '%;%' OR line_name LIKE '%,%'
        """)
        
        rows = cur.fetchall()
        print(f"Found {len(rows)} properties needing cleanup.")
        
        count = 0
        for row in rows:
            sale_unit_id, line_name_raw = row
            # Clean it
            new_line = line_name_raw.split(';')[0].split(',')[0].strip()
            
            # Update DB
            cur.execute("""
                UPDATE "Property" 
                SET line_name = %s 
                WHERE sale_unit_id = %s
            """, (new_line, sale_unit_id))
            
            print(f"[Cleanup] Chuyển đổi '{line_name_raw}' thành '{new_line}' cho ID: {sale_unit_id}")
            count += 1
            
        conn.commit()
        print(f"Done! Cleaned {count} records successfully.")
        
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    main()
