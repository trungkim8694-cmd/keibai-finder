"""
cleanup_property_images.py
--------------------------
Kiểm tra thư mục property_images và xóa các folder ảnh không còn
được liên kết với bất kỳ bản ghi nào trong Database.

Chạy ở chế độ DRY-RUN trước để xem danh sách sẽ bị xóa:
    python cleanup_property_images.py

Chạy thực sự để xóa:
    python cleanup_property_images.py --delete
"""

import os
import sys
import shutil
import psycopg2
from dotenv import load_dotenv

load_dotenv("../web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

IMAGES_DIR = "../web/public/property_images"
DRY_RUN = "--delete" not in sys.argv

def get_sale_unit_ids_from_db():
    """Lấy toàn bộ sale_unit_id đang tồn tại trong DB."""
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT sale_unit_id FROM "Property"')
    ids = {row[0] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return ids

def main():
    print("=== Kiểm Tra Thư Mục property_images ===\n")

    # Lấy danh sách folder trên filesystem
    disk_folders = set(os.listdir(IMAGES_DIR))
    print(f"📁 Tổng số folder trên disk: {len(disk_folders)}")

    # Lấy danh sách sale_unit_id trong DB
    db_ids = get_sale_unit_ids_from_db()
    print(f"🗃️  Tổng số tài sản trong DB: {len(db_ids)}")

    # Tính phần dư: folder có trên disk nhưng KHÔNG có trong DB
    orphaned = disk_folders - db_ids
    active = disk_folders & db_ids

    print(f"\n✅ Folder đang dùng (có trong DB): {len(active)}")
    print(f"🗑️  Folder không dùng (không có trong DB): {len(orphaned)}")

    if not orphaned:
        print("\n🎉 Không có folder thừa nào. Thư mục đã sạch!")
        return

    # Tính tổng dung lượng sẽ giải phóng
    total_size = 0
    for folder in orphaned:
        folder_path = os.path.join(IMAGES_DIR, folder)
        for dirpath, dirnames, filenames in os.walk(folder_path):
            for f in filenames:
                total_size += os.path.getsize(os.path.join(dirpath, f))

    total_mb = total_size / (1024 * 1024)

    print(f"💾 Dung lượng có thể giải phóng: {total_mb:.2f} MB")

    if DRY_RUN:
        print(f"\n⚠️  [DRY-RUN] Danh sách {len(orphaned)} folder sẽ bị xóa:")
        for folder in sorted(orphaned):
            folder_path = os.path.join(IMAGES_DIR, folder)
            size = sum(
                os.path.getsize(os.path.join(dp, f))
                for dp, dn, fns in os.walk(folder_path) for f in fns
            )
            print(f"   - {folder}  ({size/1024:.1f} KB)")
        print(f"\n💡 Chạy lại với tham số --delete để thực sự xóa:")
        print(f"   python cleanup_property_images.py --delete")
    else:
        print(f"\n🗑️  [DELETE] Đang xóa {len(orphaned)} folder thừa...")
        deleted = 0
        errors = 0
        for folder in sorted(orphaned):
            folder_path = os.path.join(IMAGES_DIR, folder)
            try:
                shutil.rmtree(folder_path)
                print(f"   ✅ Đã xóa: {folder}")
                deleted += 1
            except Exception as e:
                print(f"   ❌ Lỗi khi xóa {folder}: {e}")
                errors += 1

        print(f"\n=== KẾT QUẢ ===")
        print(f"✅ Đã xóa: {deleted} folder")
        print(f"❌ Lỗi: {errors} folder")
        print(f"💾 Đã giải phóng: ~{total_mb:.2f} MB")

if __name__ == "__main__":
    main()
