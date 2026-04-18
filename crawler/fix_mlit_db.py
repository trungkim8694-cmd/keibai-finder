import os
import psycopg2
from dotenv import load_dotenv

def fix_db():
    print("Fixing -999 mlit gaps...")
    # Load .env depending on execution place
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        load_dotenv(dotenv_path="../web/.env")
        load_dotenv(dotenv_path="../web/.env.local")
        load_dotenv(dotenv_path="/app/web/.env")
        db_url = os.environ.get("DATABASE_URL")
        
    db_url = db_url.replace("?schema=public", "")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute('UPDATE "Property" SET mlit_investment_gap = NULL WHERE mlit_investment_gap = -999')
    row_count = cur.rowcount
    
    cur.execute('UPDATE "Property" SET mlit_investment_gap = NULL WHERE mlit_investment_gap < -250')
    row_count += cur.rowcount
    
    print(f"Successfully reset {row_count} properties to NULL.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    fix_db()
