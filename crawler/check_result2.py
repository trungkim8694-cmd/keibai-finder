import psycopg2, os, json
from dotenv import load_dotenv

load_dotenv('../web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL').replace('?schema=public', ''))
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT';")
total = cur.fetchone()[0]
print(f"\n===== KẾT QUẢ KIỂM TRA BIT ({total} tài sản) =====")

# Check images (images is text[] type)
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT' AND array_length(images, 1) > 1;")
with_images = cur.fetchone()[0]
print(f"✅ Có hình ảnh (>1 ảnh): {with_images}/{total} tài sản")

# Check raw_text
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT' AND raw_text IS NOT NULL AND raw_text != '';")
with_text = cur.fetchone()[0]
print(f"✅ Có raw_text cho AI: {with_text}/{total} tài sản")

# Check contact_url in raw_display_data
cur.execute("""
    SELECT COUNT(*) FROM "Property" 
    WHERE source_provider='BIT'
    AND raw_display_data::text LIKE '%contact_url%';
""")
with_contact = cur.fetchone()[0]
print(f"✅ Có contact_url: {with_contact}/{total} tài sản")

# Sample
cur.execute("""
    SELECT sale_unit_id, 
           array_length(images, 1) as img_count,
           length(raw_text) as text_len,
           raw_display_data::text LIKE '%contact_url%' as has_contact
    FROM "Property" WHERE source_provider='BIT' LIMIT 5;
""")
print("\n--- Mẫu 5 tài sản BIT ---")
for row in cur.fetchall():
    print(f"  ID: {row[0]} | Ảnh: {row[1]} | Text: {row[2]} chars | ContactURL: {row[3]}")

# Sample contact_url value
cur.execute("""
    SELECT sale_unit_id, raw_display_data
    FROM "Property" WHERE source_provider='BIT' 
    AND raw_display_data::text LIKE '%contact_url%' LIMIT 1;
""")
row = cur.fetchone()
if row:
    data = row[1]
    if isinstance(data, list):
        summary = next((d for d in data if d.get('asset_title') == 'Summary'), None)
        if summary:
            print(f"\n  contact_url mẫu: {summary.get('data', {}).get('contact_url')}")
conn.close()
