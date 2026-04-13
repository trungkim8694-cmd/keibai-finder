import subprocess
import time
import psycopg2

def count_properties():
    try:
        conn = psycopg2.connect("postgresql://keibai_user:keibai_password@localhost:5433/keibai_db")
        cur = conn.cursor()
        cur.execute("SELECT source_provider, COUNT(*) FROM \"Property\" GROUP BY source_provider")
        res = cur.fetchall()
        cur.close()
        conn.close()
        return dict(res)
    except:
        return {}

# Start BIT crawler
print("Starting BIT crawler...")
bit_proc = subprocess.Popen(["python", "advanced_crawler.py"])
while True:
    time.sleep(5)
    counts = count_properties()
    c = counts.get('BIT', 0)
    print(f"BIT count: {c}")
    if c >= 10:
        bit_proc.terminate()
        bit_proc.wait()
        print("Stopped BIT.")
        break

# Start NTA crawler
print("Starting NTA crawler...")
nta_proc = subprocess.Popen(["python", "nta_parser.py"])
while True:
    time.sleep(5)
    counts = count_properties()
    c = counts.get('NTA', 0)
    print(f"NTA count: {c}")
    if c >= 10:
        nta_proc.terminate()
        nta_proc.wait()
        print("Stopped NTA.")
        break

print("Done. Both crawlers fetched 10 items.")
