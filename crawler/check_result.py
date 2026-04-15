import psycopg2, os, json
from dotenv import load_dotenv

load_dotenv('../web/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL').replace('?schema=public', ''))
cur = conn.cursor()

# Count total
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT';")
total = cur.fetchone()[0]
print(f"\n===== KẾT QUẢ KIỂM TRA BIT ({total} tài sản) =====")

# Check images
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT' AND jsonb_array_length(images::jsonb) > 1;")
with_images = cur.fetchone()[0]
print(f"✅ Có hình ảnh (>1 ảnh): {with_images}/{total} tài sản")

# Check raw_text
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT' AND raw_text IS NOT NULL AND raw_text != '';")
with_text = cur.fetchone()[0]
print(f"✅ Có raw_text cho AI: {with_text}/{total} tài sản")

# Check contact_url
cur.execute("SELECT COUNT(*) FROM \"Property\" WHERE source_provider='BIT' AND raw_display_data IS NOT NULL;")
with_data = cur.fetchone()[0]
cur.execute("""
    SELECT COUNT(*) FROM "Property" 
    WHERE source_provider='BIT'
    AND raw_display_data::text LIKE '%contact_url%'
    AND raw_display_data::text NOT LIKE '%contact_url": null%';
""")
with_contact = cur.fetchone()[0]
print(f"✅ Có contact_url: {with_contact}/{total} tài sản")

# Show 1 sample
cur.execute("""
    SELECT sale_unit_id, 
           jsonb_array_length(images::jsonb) as img_count,
           length(raw_text) as text_len,
           raw_display_data::text LIKE '%contact_url%' as has_contact
    FROM "Property" WHERE source_provider='BIT' LIMIT 5;
""")
print("\n--- Mẫu 5 tài sản BIT ---")
for row in cur.fetchall():
    print(f"  ID: {row[0]} | Ảnh: {row[1]} | Text: {row[2]} chars | ContactURL: {row[3]}")

conn.close()
