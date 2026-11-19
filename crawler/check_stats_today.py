import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('web/.env')
conn = psycopg2.connect(os.environ['DATABASE_URL'].replace('?schema=public', ''))
cur = conn.cursor()

# 1. Chi tiết tài sản mới tạo hôm nay
cur.execute('SELECT source_provider, count(*) FROM "Property" WHERE created_at >= CURRENT_DATE GROUP BY source_provider')
print("=== TÀI SẢN MỚI CÀO HÔM NAY (created_at >= CURRENT_DATE) ===")
for row in cur.fetchall():
    print(f"Nguồn {row[0]}: {row[1]} tài sản")

# 2. Chi tiết tài sản ARCHIVED trong ngày hôm nay
cur.execute('SELECT source_provider, count(*) FROM "Property" WHERE status = \'ARCHIVED\' AND updated_at >= CURRENT_DATE GROUP BY source_provider')
print("\n=== TÀI SẢN BỊ ARCHIVED (HẾT HẠN / HỦY / GỠ BỎ) HÔM NAY ===")
for row in cur.fetchall():
    print(f"Nguồn {row[0]}: {row[1]} tài sản")

# 3. Phân bổ theo bid_end_date
cur.execute("""
    SELECT 
        status,
        count(*) FILTER (WHERE bid_end_date::date = CURRENT_DATE) as ended_today,
        count(*) FILTER (WHERE bid_end_date::date < CURRENT_DATE) as ended_before_today,
        count(*) FILTER (WHERE bid_end_date::date > CURRENT_DATE) as still_active_future
    FROM "Property"
    WHERE bid_end_date IS NOT NULL
    GROUP BY status
""")
print("\n=== PHÂN BỔ THEO BID_END_DATE (HẠN ĐẤU GIÁ) ===")
for row in cur.fetchall():
    print(f"Trạng thái {row[0]}: Hết hạn hôm nay={row[1]}, Đã quá hạn={row[2]}, Còn hạn tương lai={row[3]}")

# 4. Kiểm tra AuctionResult
cur.execute('SELECT count(*) FROM "AuctionResult"')
total_results = cur.fetchone()[0]
cur.execute('SELECT count(*) FROM "AuctionResult" WHERE created_at >= CURRENT_DATE')
today_results = cur.fetchone()[0]
print(f"\n=== KẾT QUẢ ĐẤU GIÁ (AuctionResult) ===\nTổng kết quả lưu trữ: {total_results}, Kết quả nạp hôm nay: {today_results}")

# 5. Phân tích tài sản ARCHIVED trên Web frontend xem chúng xuất hiện thế nào
cur.close()
conn.close()
