"""
cleanup_property_images.py
--------------------------
Dọn dẹp thư mục ảnh cục bộ trên VPS (/var/www/keibai-images/) và Supabase Storage (nếu có).
Xóa folder hình ảnh của các tài sản ĐÃ HOÀN TẤT (Không còn ACTIVE), chỉ giữ lại text trong DB.

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

load_dotenv(os.path.join(os.path.dirname(__file__), "../web/.env.local"))
load_dotenv(os.path.join(os.path.dirname(__file__), "../web/.env"))
load_dotenv("/app/web/.env.local")
load_dotenv("/app/web/.env")

db_url = os.environ.get("DATABASE_URL", "").split("?")[0]
LOCAL_IMAGE_DIR = os.environ.get("LOCAL_IMAGE_DIR", "/var/www/keibai-images")
DRY_RUN = "--delete" not in sys.argv


def get_active_ids():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT sale_unit_id FROM "Property" WHERE status = \'ACTIVE\'')
    ids = {row[0] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return ids


def cleanup_local_vps_images(active_ids):
    if not os.path.isdir(LOCAL_IMAGE_DIR):
        print(f"ℹ️ Local image directory does not exist: {LOCAL_IMAGE_DIR}")
        return

    folders = [
        name for name in os.listdir(LOCAL_IMAGE_DIR)
        if os.path.isdir(os.path.join(LOCAL_IMAGE_DIR, name))
    ]
    orphaned = [name for name in folders if name not in active_ids]
    print(f"📁 Local VPS folders: {len(folders)} | 🗑️ Orphaned (non-ACTIVE): {len(orphaned)}")

    if not orphaned:
        print("✅ Không có thư mục ảnh cũ nào cần dọn dẹp.")
        return

    if DRY_RUN:
        print(f"🧪 [DRY-RUN] Sẽ xóa {len(orphaned)} thư mục (chạy với --delete để xóa thật).")
        return

    deleted = 0
    for name in orphaned:
        target = os.path.join(LOCAL_IMAGE_DIR, name)
        try:
            shutil.rmtree(target)
            deleted += 1
        except Exception as e:
            print(f"⚠️ Không thể xóa {target}: {e}")
    print(f"🧹 Đã xóa {deleted}/{len(orphaned)} thư mục ảnh của tài sản hết hạn.")


def main():
    print("=== VPS Property Image Cleanup ===")
    if not db_url:
        print("❌ DATABASE_URL is not set.")
        sys.exit(1)

    active_ids = get_active_ids()
    print(f"🗃️ Total ACTIVE properties in DB: {len(active_ids)}")
    cleanup_local_vps_images(active_ids)


if __name__ == "__main__":
    main()
