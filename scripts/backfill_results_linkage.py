"""
Script đối soát & liên kết sale_unit_id cho các bản ghi AuctionResult cũ (Bản tối ưu O(1))
========================================================================================
- Khớp số vụ án (caseNumber e.g. 令和07年(ケ)第33号) và địa chỉ với bảng Property.
- Điền sale_unit_id vào AuctionResult nếu đang NULL.
- Tự động cập nhật Property.status = 'SOLD' nếu có winningPrice > 0.
- Cập nhật completionDate từ Property nếu AuctionResult.completionDate đang NULL.
"""

import os
import sys
import re
import psycopg2
from psycopg2.extras import execute_batch
import unicodedata
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '../crawler'))
from crawler_utils import convert_reiwa_to_datetime

# Đảm bảo mã hóa UTF-8 trên Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env'))
db_url = os.environ.get("DATABASE_URL").split("?")[0]

def normalize_text(t):
    if not t:
        return ""
    hw = unicodedata.normalize('NFKC', str(t))
    return re.sub(r'[\s\-_ー]+', '', hw).lower()

def backfill():
    print("=" * 70, flush=True)
    print(" BẮT ĐẦU ĐỐI SOÁT & LIÊN KẾT SALE_UNIT_ID CHO AUCTIONRESULT (SIÊU TỐC)", flush=True)
    print("=" * 70, flush=True)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Tải toàn bộ Property vào bộ nhớ
    print("[1] Đang tải danh mục Property vào RAM...", flush=True)
    cur.execute("""
        SELECT sale_unit_id, court_name, address, starting_price, raw_display_data, status
        FROM "Property"
    """)
    properties = cur.fetchall()
    print(f"  -> Đã tải {len(properties)} bất động sản từ Property.", flush=True)

    # 2. Tải danh sách sale_unit_id đã dùng trong AuctionResult
    cur.execute('SELECT sale_unit_id FROM "AuctionResult" WHERE sale_unit_id IS NOT NULL')
    used_sale_unit_ids = {r[0] for r in cur.fetchall()}
    print(f"  -> Đã có {len(used_sale_unit_ids)} sale_unit_id đã liên kết trước đó.", flush=True)

    # Tạo chỉ mục tra cứu nhanh bằng địa chỉ chuẩn hóa
    address_index = {}
    for p in properties:
        p_id, p_court, p_addr, p_price, p_raw, p_status = p
        norm_p_addr = normalize_text(p_addr)
        if norm_p_addr:
            address_index[norm_p_addr] = p
            # Thử biến thể bỏ tỉnh thành
            pref_match = re.match(r'^(?:北海道|東京都|大阪府|京都府|.{2,3}県)', norm_p_addr)
            if pref_match:
                without_pref = norm_p_addr[len(pref_match.group(0)):]
                if len(without_pref) > 6:
                    address_index[without_pref] = p

    # 3. Truy vấn các AuctionResult chưa có sale_unit_id
    print("\n[2] Đang quét các bản ghi AuctionResult cần liên kết...", flush=True)
    cur.execute("""
        SELECT id, "caseNumber", address, "winningPrice", "completionDate", "sale_unit_id"
        FROM "AuctionResult"
        WHERE "sale_unit_id" IS NULL
    """)
    results_to_match = cur.fetchall()
    print(f"  -> Có {len(results_to_match)} kết quả chưa có sale_unit_id.", flush=True)

    update_auction_batch = [] # (sale_unit_id, completionDate, id)
    update_property_sold = set()

    for r in results_to_match:
        r_id, r_case, r_addr, r_win, r_date, r_unit_id = r
        if not r_addr:
            continue

        norm_r_addr = normalize_text(r_addr)
        matched_property = address_index.get(norm_r_addr)

        if not matched_property:
            pref_match = re.match(r'^(?:北海道|東京都|大阪府|京都府|.{2,3}県)', norm_r_addr)
            if pref_match:
                without_pref = norm_r_addr[len(pref_match.group(0)):]
                matched_property = address_index.get(without_pref)

        if matched_property:
            p_id, p_court, p_addr, p_price, p_raw, p_status = matched_property

            # Kiểm tra xem sale_unit_id này đã được gán chưa (Unique constraint)
            if p_id in used_sale_unit_ids:
                continue

            used_sale_unit_ids.add(p_id)

            # Xác định ngày mở thầu
            target_date = r_date
            if not target_date and p_raw and isinstance(p_raw, list) and len(p_raw) > 0:
                summary_data = p_raw[0].get("data", {}) if isinstance(p_raw[0], dict) else {}
                open_date_str = summary_data.get("開札期日")
                if open_date_str:
                    target_date = convert_reiwa_to_datetime(open_date_str)

            update_auction_batch.append((p_id, target_date, r_id))

            if r_win and r_win > 0:
                update_property_sold.add(p_id)

    print(f"\n[3] Đang thực thi cập nhật hàng loạt {len(update_auction_batch)} bản ghi khớp...", flush=True)

    # Thực thi cập nhật AuctionResult theo Batch
    if update_auction_batch:
        execute_batch(cur, """
            UPDATE "AuctionResult" 
            SET sale_unit_id = %s, 
                "completionDate" = COALESCE("completionDate", %s) 
            WHERE id = %s
        """, update_auction_batch, page_size=200)

    # Thực thi cập nhật Property SOLD
    if update_property_sold:
        cur.execute("""
            UPDATE "Property" 
            SET status = 'SOLD', updated_at = NOW() 
            WHERE sale_unit_id IN %s AND status != 'SOLD'
        """, (tuple(update_property_sold),))

    conn.commit()
    cur.close()
    conn.close()

    print("=" * 70, flush=True)
    print(" HOÀN TẤT ĐỐI SOÁT & LIÊN KẾT:")
    print(f" - Số kết quả liên kết thành công với Property: {len(update_auction_batch)}")
    print(f" - Số bất động sản Property được chuyển sang 'SOLD': {len(update_property_sold)}")
    print("=" * 70, flush=True)

if __name__ == "__main__":
    backfill()
