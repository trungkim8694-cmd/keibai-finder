import os
import time
import subprocess
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv("../web/.env")
    
    print("=== SCRAPING BIT until 5 properties are loaded ===")
    
    # Run advanced_crawler.py in the background
    venv_python = "../.venv/bin/python" if os.path.exists("../.venv/bin/python") else "python3"
    proc = subprocess.Popen([venv_python, "advanced_crawler.py"])
    
    db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    last_count = -1
    
    while True:
        cur.execute("SELECT count(*) FROM \"Property\" WHERE source_provider='BIT' OR source_provider IS NULL")
        cnt = cur.fetchone()[0]
        if cnt != last_count:
            print(f"BIT count so far: {cnt}/5")
            last_count = cnt
        if cnt >= 5: 
            print("Reached limit of 5 BIT properties. Terminating script.")
            break
        if proc.poll() is not None:
            print("Crawler process exited unexpectedly.")
            break
        time.sleep(2)
        
    proc.terminate()
    proc.wait()
    print("=== SCRAPE COMPLETE ===")
    
if __name__ == "__main__":
    main()
