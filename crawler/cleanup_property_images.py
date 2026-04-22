"""
cleanup_property_images.py
--------------------------
Quét dọn kho lưu trữ Supabase Storage (keibai-storage).
Xóa folder hình ảnh và PDF của các tài sản ĐÃ HOÀN TẤT (Không còn ACTIVE).

Chạy ở chế độ DRY-RUN trước để xem danh sách sẽ bị xóa:
    python cleanup_property_images.py

Chạy thực sự để xóa:
    python cleanup_property_images.py --delete
"""

import os
import sys
import psycopg2
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../web/.env")

db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = "keibai-storage"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
DRY_RUN = "--delete" not in sys.argv

def get_active_ids():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT sale_unit_id FROM \"Property\" WHERE status = 'ACTIVE'")
    ids = {row[0] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return ids

def delete_supabase_folder(bucket_name, folder_path):
    limit = 1000
    offset = 0
    all_files = []
    while True:
        res = supabase.storage.from_(bucket_name).list(folder_path, {"limit": limit, "offset": offset})
        if not res: break
        count = len(res)
        all_files.extend([f"{folder_path}/{item['name']}" for item in res if item['name'] != '.emptyFolderPlaceholder'])
        if count < limit: break
        offset += limit
        
    if all_files:
        supabase.storage.from_(bucket_name).remove(all_files)

def get_all_folders(bucket_name, path=""):
    limit = 500
    offset = 0
    all_folders = []
    while True:
        res = supabase.storage.from_(bucket_name).list(path, {"limit": limit, "offset": offset})
        if not res: break
        count = len(res)
        all_folders.extend(res)
        if count < limit: break
        offset += limit
    return all_folders

def main():
    print("=== Supabase Storage Cleanup (Paginated) ===")
    
    active_ids = get_active_ids()
    print(f"🗃️  Total ACTIVE properties in DB: {len(active_ids)}")

    # 1. Clean properties/ folders
    print("\n[1] Checking 'properties/' folder...")
    prop_folders = get_all_folders(STORAGE_BUCKET, "properties")
    orphaned_props = []
    if prop_folders:
        for f in prop_folders:
            folder_name = f['name']
            if folder_name not in active_ids and folder_name != '.emptyFolderPlaceholder':
                orphaned_props.append(folder_name)
    
    print(f"Total folders found: {len(prop_folders)}")
    print(f"🗑️  Orphaned properties/ folders: {len(orphaned_props)}")

    # 2. Clean pdfs/ files
    print("\n[2] Checking 'pdfs/' folder...")
    pdf_files = get_all_folders(STORAGE_BUCKET, "pdfs")
    orphaned_pdfs = []
    if pdf_files:
        for f in pdf_files:
            file_name_with_ext = f['name']
            if file_name_with_ext == '.emptyFolderPlaceholder': continue
            file_id = file_name_with_ext.replace(".pdf", "")
            if file_id not in active_ids:
                orphaned_pdfs.append(file_name_with_ext)
                
    print(f"🗑️  Orphaned pdfs/ files: {len(orphaned_pdfs)}")
    
    if not orphaned_props and not orphaned_pdfs:
        print("\n🎉 Storage is clean. Nothing to delete!")
        return

    if DRY_RUN:
        print(f"\n⚠️  [DRY-RUN] Would delete {len(orphaned_props)} prop folders and {len(orphaned_pdfs)} PDFs.")
        print(f"💡 Run again with --delete to permanently remove them from Supabase:")
        print(f"   python cleanup_property_images.py --delete")
    else:
        print("\n🗑️  [DELETE] Removing orphaned data from Supabase...")
        
        deleted = 0
        for pdf in orphaned_pdfs:
             supabase.storage.from_(STORAGE_BUCKET).remove([f"pdfs/{pdf}"])
             print(f"   ✅ Deleted PDF: pdfs/{pdf}")
             deleted += 1
             
        for prop in orphaned_props:
             delete_supabase_folder(STORAGE_BUCKET, f"properties/{prop}")
             print(f"   ✅ Deleted Image Folder: properties/{prop}")
             deleted += 1

        print(f"\n=== RESULT ===")
        print(f"✅ Successfully deleted {deleted} items/folders from Supabase Storage.")

if __name__ == "__main__":
    main()
