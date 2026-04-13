import os, psycopg2, shutil
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
conn = psycopg2.connect(db_url)
cur = conn.cursor()
try:
    cur.execute('DELETE FROM "Property"')
    # We ignore Thumbnail since they might not be tightly coupled or are cascade deleted
    conn.commit()
    print("Database cleared successfully.")
except Exception as e:
    print(f"Error clearing db: {e}")
finally:
    cur.close()
    conn.close()

# Clear images and pdfs
img_dir = "/Users/kimtrung/keibai-finder/web/public/property_images/"
pdf_dir = "/Users/kimtrung/keibai-finder/web/public/pdfs/"

for root_dir in [img_dir, pdf_dir]:
    if os.path.exists(root_dir):
        for item in os.listdir(root_dir):
            path = os.path.join(root_dir, item)
            try:
                if os.path.isfile(path): os.remove(path)
                elif os.path.isdir(path): shutil.rmtree(path)
            except Exception as e:
                 print(f"Error removing {path}: {e}")
print("Local storage cleared successfully.")
