import os
import re
import json
import psycopg2
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT sale_unit_id, bid_end_date, raw_display_data FROM \"Property\" WHERE source_provider = 'BIT'")
    rows = cur.fetchall()
    
    print(f"Bắt đầu kiểm tra {len(rows)} tài sản BIT...")
    
    for row in rows:
        sale_unit_id = row[0]
        old_end_date = row[1]
        raw_display_data = row[2]
        
        if not raw_display_data: continue
        if isinstance(raw_display_data, str):
            try:
                raw_display_data = json.loads(raw_display_data)
            except: continue
            
        summary_data = {}
        # Tìm summary data
        if raw_display_data and isinstance(raw_display_data, list):
            for section in raw_display_data:
                if section.get('asset_title') == 'Summary' or section.get('asset_type') == 'Summary':
                    summary_data = section.get('data', {})
                    break
                    
        # Parse schedule_str
        schedule_str = None
        for key in summary_data.keys():
            if "期間入札" in key or "入札期間" in key or "期間" in key:
                schedule_str = summary_data[key]
                break
                
        if not schedule_str: continue
        
        m_dates = list(re.finditer(r'(令和|平成|昭和)(\d+|元)年(\d+)月(\d+)日', schedule_str))
        if m_dates:
            def parse_m(match):
                era = match.group(1)
                y_str = match.group(2)
                mo = match.group(3)
                da = match.group(4)
                y = 1 if y_str == "元" else int(y_str)
                if era == "令和": year = 2018 + y
                elif era == "平成": year = 1988 + y
                elif era == "昭和": year = 1925 + y
                else: year = 2024
                return year, int(mo), int(da)
            
            s_y, s_m, s_d = parse_m(m_dates[-1])
            new_end_date_str = f"{s_y}-{s_m:02d}-{s_d:02d}T23:59:59+09:00"
            raw_target_str = f"{s_m}/{s_d}"
            
            new_start_date_str = None
            if len(m_dates) > 1:
                e_y, e_m, e_d = parse_m(m_dates[0])
                new_start_date_str = f"{e_y}-{e_m:02d}-{e_d:02d}T00:00:00+09:00"
            
            old_str = ""
            if old_end_date:
                # Convert the datetime object to string directly from postgres if it was fetched as datetime
                try:
                    # In python it could be a datetime object
                    old_str = f"{old_end_date.month}/{old_end_date.day}"
                except:
                    old_str = str(old_end_date)
            
            # Print log
            print(f"[Fix-BIT] Property ID: {sale_unit_id} | Raw: {raw_target_str} | DB Before: {old_str} | DB After: {s_m}/{s_d}")
            
            cur2 = conn.cursor()
            cur2.execute("UPDATE \"Property\" SET bid_start_date = %s, bid_end_date = %s WHERE sale_unit_id = %s", (new_start_date_str, new_end_date_str, sale_unit_id))
            cur2.close()
    
    conn.commit()
    cur.close()
    conn.close()
    print("Done retroactive update!")

if __name__ == "__main__":
    main()
