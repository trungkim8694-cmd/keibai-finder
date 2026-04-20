import os
import json
import psycopg2
from dotenv import load_dotenv

# Load môi trường DB
load_dotenv("../web/.env")

from crawler_utils import convert_reiwa_range_to_datetimes

db_url = os.environ.get("DATABASE_URL", "").replace("?schema=public", "")

def fix_bit_dates():
    print("Đang kết nối tới Database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Lấy dữ liệu của tất cả các properties thuộc nguồn BIT
    print("Đang tải dữ liệu từ bảng Property...")
    cur.execute('''
        SELECT sale_unit_id, bid_start_date, bid_end_date, raw_display_data 
        FROM "Property" 
        WHERE source_provider = 'BIT'
    ''')
    rows = cur.fetchall()
    
    updated_count = 0
    checked_count = 0
    
    print(f"Đã lấy {len(rows)} tài sản. Bắt đầu xử lý...")
    for row in rows:
        sale_unit_id, old_start, old_end, raw_data = row
        checked_count += 1
        
        db_start_date, db_end_date = None, None
        
        # Ép kiểu an toàn cho dữ liệu raw_data nếu nó đang ở dạng String
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
            except:
                continue
                
        # Thực thi logic quét đúng ưu tiên
        if raw_data and isinstance(raw_data, list):
            for section in raw_data:
                data_dict = section.get("data", {})
                
                # Ưu tiên 1: 入札期間 or 期間入札
                for key in data_dict.keys():
                    if "入札期間" in key or "期間入札" in key:
                        s_d, e_d = convert_reiwa_range_to_datetimes(data_dict[key])
                        if s_d or e_d:
                            db_start_date, db_end_date = s_d, e_d
                            break
                if db_end_date: break
                
                # Ưu tiên 2: 特別売却期間
                for key in data_dict.keys():
                    if "特別売却期間" in key:
                        s_d, e_d = convert_reiwa_range_to_datetimes(data_dict[key])
                        if s_d or e_d:
                            db_start_date, db_end_date = s_d, e_d
                            break
                if db_end_date: break
        
        # Convert date ra chuỗi YYYY-MM-DD để so sánh thay đổi
        old_end_str = str(old_end)[:10] if old_end else None
        new_end_str = db_end_date[:10] if db_end_date else None
        
        # Cập nhật database nếu có sự khác biệt về ngày
        if old_end_str != new_end_str:
            print(f"  [SỬA LỖI] {sale_unit_id}: ({old_end_str}) ---> ({new_end_str})")
            
            update_cur = conn.cursor()
            update_cur.execute('''
                UPDATE "Property" 
                SET bid_start_date = %s, bid_end_date = %s, updated_at = NOW()
                WHERE sale_unit_id = %s
            ''', (db_start_date, db_end_date, sale_unit_id))
            conn.commit()
            update_cur.close()
            updated_count += 1

    print("=========================================")
    print(f"Hoàn thành! Đã kiểm tra {checked_count} properties.")
    print(f"Cập nhật thành công {updated_count} properties bị sai ngày.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    fix_bit_dates()
