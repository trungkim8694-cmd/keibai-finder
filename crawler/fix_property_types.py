import os
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/keibai_db").split("?")[0]

def update_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute('SELECT sale_unit_id, court_name, property_type, raw_display_data FROM "Property"')
        rows = cur.fetchall()
        
        count = 0
        for row in rows:
            sale_unit_id, court_name, property_type, raw_json = row
            
            if not raw_json: continue
            if isinstance(raw_json, str):
                raw_json = json.loads(raw_json)
                
            has_land = False
            has_building = False
            is_condo = False
            chimoku_agri = False
            chimoku_house = False
            
            for section in raw_json:
                title = section.get("asset_title", "")
                data_dict = section.get("data", {})
                if "土地" in title: has_land = True
                if "建物" in title: has_building = True
                if "区分所有" in title or "マンション" in title or "敷地権" in title:
                    is_condo = True
                    
                chimoku = data_dict.get("地目", "")
                combined_text = title + " " + chimoku
                if "田" in combined_text or "畑" in combined_text or "農地" in combined_text:
                    chimoku_agri = True
                if "宅地" in combined_text or "山林" in combined_text or "雑種地" in combined_text:
                    chimoku_house = True
                    
            new_type = "Unknown"
            if is_condo:
                new_type = "マンション"
            elif has_land and has_building:
                new_type = "戸建て"
            elif has_building:
                new_type = "戸建て"
            elif has_land:
                if chimoku_agri:
                    new_type = "農地"
                elif chimoku_house:
                    new_type = "宅地"
                else:
                    new_type = "土地"
            else:
                new_type = "その他"
                
            if property_type != new_type:
                cur.execute('UPDATE "Property" SET property_type = %s WHERE sale_unit_id = %s', (new_type, sale_unit_id))
                count += 1
                
        conn.commit()
        cur.close()
        conn.close()
        print(f"Updated {count} properties' property_type successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_db()
