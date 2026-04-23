import psycopg2
import psycopg2.extras
from collections import OrderedDict
import sys

# Khai báo trực tiếp 2 connection strings
OLD_DB_URL = "postgresql://postgres.nuyfejmbvxkgcitvygcy:%40Hrptlcct6789@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
NEW_DB_URL = "postgresql://postgres:h5.9n%24AudB%2Fh_ch@db.qtgefqhqdfnpadufhnye.supabase.co:5432/postgres"

# Thứ tự Insert rất quan trọng để tránh lỗi Foreign Key constraints
TABLES_ORDER = [
    '"User"',
    '"Account"',
    '"Session"',
    '"VerificationToken"',
    '"RailwayStation"',
    '"DailyDigest"',
    '"Property"',
    '"AuctionHistory"',
    '"AuctionSchedule"',
    '"AuctionResult"',
    '"Favorite"',
    '"UserMemo"',
    '"Comment"',
    '"MlitMarketCache"'
]

def drop_fk_checks(cur):
    # PostgreSQL doesn't have a simple disable FK, but we can truncate everything
    pass

def migrate():
    print("🔌 Đang kết nối tới Old DB...")
    old_conn = psycopg2.connect(OLD_DB_URL)
    old_cur = old_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("🔌 Đang kết nối tới New DB...")
    new_conn = psycopg2.connect(NEW_DB_URL)
    new_cur = new_conn.cursor()

    try:
        total_rows = 0
        for table in TABLES_ORDER:
            print(f"\n🔄 Đang xử lý bảng {table}...")
            
            # Đọc dữ liệu từ DB cũ
            old_cur.execute(f"SELECT * FROM {table}")
            rows = old_cur.fetchall()
            
            if not rows:
                print(f"   ℹ️ Bảng trống, bỏ qua.")
                continue
                
            # Lấy danh sách cột
            cols = [desc[0] for desc in old_cur.description]
            cols_str = ", ".join([f'"{c}"' for c in cols])
            placeholders = ", ".join(["%s"] * len(cols))
            insert_query = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            
            # Chuẩn bị dữ liệu insert
            data_to_insert = [tuple(row) for row in rows]
            
            # Bơm dữ liệu vào DB mới
            psycopg2.extras.execute_batch(new_cur, insert_query, data_to_insert, page_size=2000)
            print(f"   ✅ Đã bơm thành công {len(rows)} bản ghi vào {table}.")
            total_rows += len(rows)

        new_conn.commit()
        print(f"\n🎉 HOÀN TẤT! Đã copy tổng cộng {total_rows} bản ghi sang nhà mới an toàn.")
        
    except Exception as e:
        print(f"\n❌ Lỗi chết chóc: {e}")
        new_conn.rollback()
        sys.exit(1)
    finally:
        old_cur.close()
        old_conn.close()
        new_cur.close()
        new_conn.close()

if __name__ == "__main__":
    migrate()
