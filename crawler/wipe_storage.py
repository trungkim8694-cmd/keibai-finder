import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("../web/.env")
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
STORAGE_BUCKET = "keibai-storage"

def wipe_directory(path):
    print(f"Listing files in {path}...")
    files = supabase.storage.from_(STORAGE_BUCKET).list(path)
    if not files:
        return
        
    for f in files:
        if f['name'] == '.emptyFolderPlaceholder':
            continue
            
        full_path = f"{path}/{f['name']}"
        
        # If it has no file extension, it might be a nested folder (like properties/001...)
        if f['id'] is None:
            wipe_directory(full_path)
        else:
            print(f"Deleting {full_path}")
            supabase.storage.from_(STORAGE_BUCKET).remove([full_path])

if __name__ == "__main__":
    print("WARNING: Wiping ALL images in properties folder...")
    wipe_directory("properties")
    print("Storage Wipe Complete!")
