import os
import psycopg2
import psycopg2.extras
import pandas as pd
from dotenv import load_dotenv

def process_ekidata():
    print("Khởi động trình nhập liệu Ekidata...")
    
    # Load .env variables depending on environment running area
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        load_dotenv(dotenv_path="../web/.env")
        load_dotenv(dotenv_path="../web/.env.local")
        load_dotenv(dotenv_path="/app/web/.env")
        db_url = os.environ.get("DATABASE_URL")
        
    db_url = db_url.replace("?schema=public", "")
    
    # Files
    station_file = "./data/station.csv"
    line_file = "./data/line.csv"
    
    if not os.path.exists(station_file) or not os.path.exists(line_file):
        print(f"[ERROR] Không tìm thấy file gốc tại {station_file} hoặc {line_file}!")
        print("Vui lòng tải xuống từ http://www.ekidata.jp/dl/ và giải nén vào thư mục crawler/data/")
        exit(1)
        
    # Read files
    print("Đang nạp file CSV lên bộ nhớ để phân tích...")
    df_station = pd.read_csv(station_file)
    df_line = pd.read_csv(line_file)
    
    # Perform inner join on line_cd
    # station.csv: station_cd, station_g_cd, station_name, line_cd, lon, lat...
    # line.csv: line_cd, line_name...
    print("Đang nối (Join) dữ liệu Ga Tàu với Tuyến Tàu và loại bỏ dữ liệu Rác...")
    df_merged = pd.merge(df_station, df_line, on="line_cd", how="inner")
    
    records = []
    skipped = 0
    for idx, row in df_merged.iterrows():
        name_ja = row.get("station_name")
        line_name = row.get("line_name")
        lng = row.get("lon_x")
        lat = row.get("lat_x")
        
        if pd.isna(name_ja) or pd.isna(line_name) or pd.isna(lng) or pd.isna(lat):
            skipped += 1
            continue
            
        records.append((str(name_ja).strip(), str(line_name).strip(), float(lat), float(lng)))
        
    print(f"Tổng hợp thành công {len(records)} dữ liệu chuẩn (mất {skipped} lỗi trống). Bắt đầu làm việc với Database...")

    # DB Connection
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Xóa sách toàn bộ bản ghi rác
        cur.execute('DELETE FROM "RailwayStation"')
        
        # Nhập hàng loạt toàn bộ
        query = """INSERT INTO "RailwayStation" (id, name_ja, line_name, lat, lng, created_at) 
                   VALUES %s"""
        
        # Prepare valid records using execute_values
        values = [(psycopg2.extensions.AsIs('gen_random_uuid()'), r[0], r[1], r[2], r[3], psycopg2.extensions.AsIs('NOW()')) for r in records]
        
        psycopg2.extras.execute_values(cur, query, values, page_size=1000)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Hoàn thành 100%! Cơ sở dữ liệu Cục quản lý Ga đã được tái sinh hoàn hảo.")
    except Exception as e:
        print(f"❌ Database error: {e}")
        exit(1)

if __name__ == "__main__":
    process_ekidata()
