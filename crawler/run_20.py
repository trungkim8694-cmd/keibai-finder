import os
import time
import subprocess
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv(".env")
    
    print("=== SCRAPING NTA (limit 20) ===")
    from nta_parser import scrape_nta
    scrape_nta(limit=20)
    
    print("=== SCRAPING BIT (Tokyo) until 20 properties are loaded ===")
    proc = subprocess.Popen(["/Users/kimtrung/keibai-finder/crawler/venv/bin/python", "/Users/kimtrung/keibai-finder/crawler/advanced_crawler.py", "-p", "東京都"])
    
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    last_count = -1
    while True:
        cur.execute("SELECT count(*) FROM \"Property\" WHERE source_provider='BIT'")
        cnt = cur.fetchone()[0]
        if cnt != last_count:
            print(f"BIT count so far: {cnt}")
            last_count = cnt
        if cnt >= 20: 
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
