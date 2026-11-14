"""
cleanup_property_images.py
--------------------------
Quản lý vòng đời hình ảnh thông minh trên VPS (/var/www/keibai-images/) chuẩn SEO:
1. Tài sản ACTIVE: Giữ nguyên toàn bộ hình ảnh.
2. Tài sản ARCHIVED / SOLD (Đã hết hạn / Đã đấu giá xong nhưng vẫn giữ URL để bảo toàn SEO):
   - Giữ lại DUY NHẤT 1 ảnh bìa đại diện (Cover Thumbnail) để tránh lỗi 404 Broken Image trên Googlebot & OpenGraph.
   - Xóa các ảnh phụ (trang 2..N trích xuất từ PDF) để giải phóng 80-90% dung lượng ổ cứng.
   - Đồng bộ lại mảng `images` và `thumbnailUrl` trong bảng `Property` để không còn bất kỳ link ảnh chết nào.
3. Thư mục mồ côi hoàn toàn (Không tồn tại sale_unit_id trong DB): Xóa toàn bộ thư mục.

Chạy ở chế độ DRY-RUN:
    python cleanup_property_images.py

Chạy thực sự để tối ưu & dọn dẹp:
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
LOCAL_IMAGE_URL_PREFIX = os.environ.get("LOCAL_IMAGE_URL_PREFIX", "/vps-images")
DRY_RUN = "--delete" not in sys.argv


def get_property_status_map(conn):
    cur = conn.cursor()
    cur.execute('SELECT sale_unit_id, status, images, "thumbnailUrl" FROM "Property"')
    status_map = {}
    for sale_unit_id, status, images, thumb in cur.fetchall():
        status_map[sale_unit_id] = {
            "status": status,
            "images": images or [],
            "thumbnailUrl": thumb,
        }
    cur.close()
    return status_map


def cleanup_local_vps_images(conn, status_map):
    if not os.path.isdir(LOCAL_IMAGE_DIR):
        print(f"ℹ️ Local image directory does not exist: {LOCAL_IMAGE_DIR}")
        return

    folders = [
        name for name in os.listdir(LOCAL_IMAGE_DIR)
        if os.path.isdir(os.path.join(LOCAL_IMAGE_DIR, name))
    ]

    active_count = 0
    archived_folders = []
    truly_orphaned = []

    for name in folders:
        info = status_map.get(name)
        if not info:
            truly_orphaned.append(name)
        elif info["status"] == "ACTIVE":
            active_count += 1
        else:
            archived_folders.append(name)

    print(
        f"📁 Local VPS folders: {len(folders)} | "
        f"🟢 ACTIVE: {active_count} | "
        f"📦 ARCHIVED/SOLD (Smart Prune): {len(archived_folders)} | "
        f"🗑️ Truly Orphaned: {len(truly_orphaned)}"
    )

    if DRY_RUN:
        print(
            f"🧪 [DRY-RUN] Sẽ thu gọn {len(archived_folders)} thư mục ARCHIVED (giữ 1 ảnh bìa SEO) "
            f"và xóa {len(truly_orphaned)} thư mục mồ côi."
        )
        return

    # 1. Xóa hoàn toàn các thư mục không có trong DB
    deleted_orphans = 0
    for name in truly_orphaned:
        target = os.path.join(LOCAL_IMAGE_DIR, name)
        try:
            shutil.rmtree(target)
            deleted_orphans += 1
        except Exception as e:
            print(f"⚠️ Không thể xóa {target}: {e}")

    # 2. Thu gọn thư mục của tài sản ARCHIVED/SOLD: chỉ giữ 1 ảnh đại diện đầu tiên
    pruned_folders = 0
    deleted_files = 0
    cur = conn.cursor()

    for name in archived_folders:
        prop_dir = os.path.join(LOCAL_IMAGE_DIR, name)
        try:
            files = sorted([
                f for f in os.listdir(prop_dir)
                if os.path.isfile(os.path.join(prop_dir, f))
            ])
            if not files:
                shutil.rmtree(prop_dir, ignore_errors=True)
                continue

            # Giữ lại file đầu tiên làm cover thumbnail cho trang lịch sử SEO
            keep_file = files[0]
            keep_url = f"{LOCAL_IMAGE_URL_PREFIX}/{name}/{keep_file}"

            if len(files) > 1:
                for extra_file in files[1:]:
                    try:
                        os.remove(os.path.join(prop_dir, extra_file))
                        deleted_files += 1
                    except Exception:
                        pass
                pruned_folders += 1

            # Cập nhật lại DB nếu mảng images đang chứa các file phụ đã xóa
            info = status_map.get(name, {})
            curr_images = info.get("images") or []
            if len(curr_images) > 1 or (curr_images and curr_images[0] != keep_url):
                cur.execute(
                    'UPDATE "Property" SET images = %s, "thumbnailUrl" = COALESCE("thumbnailUrl", %s) WHERE sale_unit_id = %s',
                    ([keep_url], keep_url, name)
                )
        except Exception as e:
            print(f"⚠️ Lỗi khi thu gọn {prop_dir}: {e}")

    # 3. Đối với các tài sản ARCHIVED/SOLD mà thư mục ảnh đã bị xóa từ trước (không còn trên đĩa),
    # lọc bỏ các link /vps-images/ bị chết trong DB để tránh 404 Broken Image
    cleaned_dead_refs = 0
    existing_folder_set = set(os.listdir(LOCAL_IMAGE_DIR))
    for sale_unit_id, info in status_map.items():
        if info["status"] == "ACTIVE":
            continue
        imgs = info.get("images") or []
        has_vps_img = any(isinstance(u, str) and u.startswith("/vps-images/") for u in imgs)
        if has_vps_img and sale_unit_id not in existing_folder_set:
            valid_imgs = [u for u in imgs if isinstance(u, str) and not u.startswith("/vps-images/")]
            thumb = info.get("thumbnailUrl")
            new_thumb = None if (isinstance(thumb, str) and thumb.startswith("/vps-images/")) else thumb
            cur.execute(
                'UPDATE "Property" SET images = %s, "thumbnailUrl" = %s WHERE sale_unit_id = %s',
                (valid_imgs, new_thumb, sale_unit_id)
            )
            cleaned_dead_refs += 1

    conn.commit()
    cur.close()
    print(
        f"🧹 Đã xóa {deleted_orphans} thư mục mồ côi, "
        f"thu gọn {pruned_folders} thư mục ARCHIVED (xóa {deleted_files} ảnh phụ, giữ lại 1 ảnh bìa SEO), "
        f"và dọn {cleaned_dead_refs} link ảnh chết trong DB."
    )


def main():
    print("=== VPS Property Image Lifecycle & SEO Hygiene ===")
    if not db_url:
        print("❌ DATABASE_URL is not set.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    try:
        status_map = get_property_status_map(conn)
        active_total = sum(1 for v in status_map.values() if v["status"] == "ACTIVE")
        print(f"🗃️ Total properties in DB: {len(status_map)} (ACTIVE: {active_total})")
        cleanup_local_vps_images(conn, status_map)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
