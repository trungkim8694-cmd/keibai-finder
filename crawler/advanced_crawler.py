import asyncio
import os
import re
import json
import psycopg2
import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import time
import random
load_dotenv("../web/.env")

from crawler_utils import clean_area_string, convert_reiwa_range_to_datetimes, get_nearest_station_from_db, get_random_user_agent, geocode_address
from supabase import create_client, Client
import io

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
STORAGE_BUCKET = "keibai-storage"

db_url = os.environ.get("DATABASE_URL", "").replace("?schema=public", "")
gemini_key = os.environ.get("GEMINI_API_KEY")

PREF_MAP = {
    f"{i:02d}": name for i, name in enumerate([
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
        "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
        "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
        "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
        "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ], 1)
}
PREF_MAP.update({"91": "北海道", "92": "北海道", "93": "北海道", "94": "北海道"})

STATE_FILE = "advanced_crawler_state.json"

def get_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f: return json.load(f)
    return {"completed_courts": []}

def save_state(completed_courts):
    with open(STATE_FILE, "w") as f:
        json.dump({"completed_courts": completed_courts}, f)

def get_db_connection():
    return psycopg2.connect(db_url)



def extract_city(address, pref_name):
    addr = address.replace(pref_name, "")
    match = re.match(r'^(.+?(?:市.+?区|市|区|郡|町|村))', addr)
    if match:
        return match.group(1)
    return None

def check_and_update_db(sale_unit_id, pdf_url, raw_data, final_images, thumbnail_url, address, start_price, court_name, prop_type, lat, lng, prefecture, city, raw_text=None):
    conn = get_db_connection()
    cur = conn.cursor()
    raw_data_json = json.dumps(raw_data, ensure_ascii=False)
    
    # Extra DB Fields Parsing
    db_area = None
    if raw_data and "物件目録" in raw_data:
        mokuroku = raw_data.get("物件目録", [])
        for block in mokuroku:
            # We try to grab the first "地積" or "面積" or "床面積" from the blocks
            for val in block.values():
                if val:
                    val_str = str(val)
                    if "㎡" in val_str or "平方メートル" in val_str:
                        db_area = clean_area_string(val_str)
                        if db_area: break
            if db_area: break
            
    db_start_date, db_end_date = None, None
    if raw_data and isinstance(raw_data, list):
        for section in raw_data:
            data_dict = section.get("data", {})
            
            # Priority 1: 入札期間 or 期間入札
            for key in data_dict.keys():
                if "入札期間" in key or "期間入札" in key:
                    s_d, e_d = convert_reiwa_range_to_datetimes(data_dict[key])
                    if s_d or e_d:
                        db_start_date, db_end_date = s_d, e_d
                        break
            if db_end_date: break
            
            # Priority 2: 特別売却期間
            for key in data_dict.keys():
                if "特別売却期間" in key:
                    s_d, e_d = convert_reiwa_range_to_datetimes(data_dict[key])
                    if s_d or e_d:
                        db_start_date, db_end_date = s_d, e_d
                        break
            if db_end_date: break
         
    st_name, line_name, st_dist, st_time = get_nearest_station_from_db(lat, lng, cur)
    
    # 1. Fetch Existing
    cur.execute('SELECT starting_price, status FROM "Property" WHERE sale_unit_id = %s', (sale_unit_id,))
    existing = cur.fetchone()
    
    if not existing:
        # Insert new
        query = """INSERT INTO "Property" (sale_unit_id, court_name, property_type, address, prefecture, city, starting_price, lat, lng, pdf_url, raw_display_data, images, "thumbnailUrl", status, area, bid_start_date, bid_end_date, managing_authority, line_name, nearest_station, distance_to_station, walk_time_to_station, updated_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, 'ACTIVE', %s, %s, %s, %s, %s, %s, %s, %s, NOW())"""
        cur.execute(query, (sale_unit_id, court_name, prop_type, address, prefecture, city, start_price, lat, lng, pdf_url, raw_data_json, final_images, thumbnail_url, db_area, db_start_date, db_end_date, court_name, line_name, st_name, st_dist, st_time))
        
        # Insert initial History
        if start_price:
            hist_query = """INSERT INTO "AuctionHistory" (id, sale_unit_id, price, round_name, drop_percent) VALUES (gen_random_uuid(), %s, %s, %s, 0)"""
            cur.execute(hist_query, (sale_unit_id, start_price, "第1回または初期"))
    else:
        existing_price, existing_status = existing
        
        # Check if price changed
        price_changed = existing_price and start_price and existing_price != start_price
        
        # Always update basic info to catch any new parse improvements, and set status to ACTIVE
        query = """UPDATE "Property" SET 
                    court_name=COALESCE(%s, court_name), property_type=COALESCE(%s, property_type), 
                    address=COALESCE(%s, address), prefecture=COALESCE(%s, prefecture), city=COALESCE(%s, city), 
                    starting_price=COALESCE(%s, starting_price), lat=COALESCE(%s, lat), lng=COALESCE(%s, lng), 
                    pdf_url=%s, raw_display_data=%s::jsonb, images=%s, "thumbnailUrl"=%s, status='ACTIVE',
                    area=%s, bid_start_date=%s, bid_end_date=%s, managing_authority=%s, line_name=%s, nearest_station=%s, distance_to_station=%s, walk_time_to_station=%s,
                    updated_at=NOW() 
                   WHERE sale_unit_id = %s"""
        cur.execute(query, (court_name, prop_type, address, prefecture, city, start_price, lat, lng, pdf_url, raw_data_json, final_images, thumbnail_url, db_area, db_start_date, db_end_date, court_name, line_name, st_name, st_dist, st_time, sale_unit_id))
        
        if price_changed:
            drop_percent = 0
            if existing_price > 0:
                drop_percent = float(existing_price - start_price) / float(existing_price) * 100.0
            hist_query = """INSERT INTO "AuctionHistory" (id, sale_unit_id, price, round_name, drop_percent) VALUES (gen_random_uuid(), %s, %s, %s, %s)"""
            cur.execute(hist_query, (sale_unit_id, start_price, "価格差分更新", round(drop_percent, 1)))

    conn.commit()
    cur.close()
    conn.close()

async def process_listing_page(page, prefecture, state, save_state, memory_cache_prices, prefecture_scraped_ids):
    print("    [INFO] Đang tải trang danh sách...")
    await page.wait_for_timeout(2000)
    
    fast_scan_js = """
    () => {
        let items = document.querySelectorAll('.bit__searchResult, .bit__searchResult_item');
        let results = [];
        items.forEach(item => {
            let a = item.querySelector("a[onclick*='tranPropertyDetail']");
            if(a) {
                let onclick = a.getAttribute("onclick");
                let m = onclick.match(/tranPropertyDetail\\(['"]([^'"]+)['"]/);
                let id = m ? m[1] : null;
                
                let priceP = item.querySelector('.bit_ichiran_text_kakaku, .bit__ichiran_text_kakaku');
                let priceStr = priceP ? priceP.innerText : "";
                let priceNums = priceStr.replace(/[^0-9]/g, '');
                let price = priceNums ? parseInt(priceNums) : null;
                
                if(id) {
                    results.push({"id": id, "price": price, "onclick": onclick});
                }
            }
        });
        
        // Fallback
        if (results.length === 0) {
            let anchors = document.querySelectorAll("a[onclick*='tranPropertyDetail']");
            anchors.forEach(a => {
                let onclick = a.getAttribute("onclick");
                let m = onclick.match(/tranPropertyDetail\\(['"]([^'"]+)['"]/);
                let id = m ? m[1] : null;
                if(id) {
                    results.push({"id": id, "price": null, "onclick": onclick});
                }
            });
        }
        return results;
    }
    """
    scanned_items = await page.evaluate(fast_scan_js)
    
    if not scanned_items:
        return 0
        
    unique_items = {}
    for item in scanned_items:
        if item["id"] not in unique_items:
            unique_items[item["id"]] = item
            
    conn = get_db_connection()
    cur = conn.cursor()
            
    items_to_fetch = []
    
    for item_id, item_data in unique_items.items():
        prefecture_scraped_ids.add(item_id)
        
        if item_id not in memory_cache_prices:
            items_to_fetch.append(item_data)
        else:
            old_price = memory_cache_prices[item_id]
            new_price = item_data["price"]
            
            if new_price and old_price and new_price != old_price:
                items_to_fetch.append(item_data)
                print(f"    [FAST SCAN] Cập nhật giá mới: {item_id} ({old_price} -> {new_price})")
            else:
                # Không cần thực hiện DB Call "to_activate" nữa vì DB vốn dĩ đã là ACTIVE rồi
                print(f"    [FAST SCAN] Bỏ qua (không đổi): {item_id}")
                
    print(f"    [FAST SCAN] Tìm thấy {len(unique_items)} tài sản, cần crawl sâu {len(items_to_fetch)} tài sản mới/đổi giá.\n")
            
    for item in items_to_fetch:
        sale_unit_id = item["id"]
        onclick = item["onclick"]
        
        print(f"\n    [INFO] Đang xử lý tài sản ID: {sale_unit_id}")
        try:
            safescript = f"window.event = {{preventDefault: function(){{}}, stopPropagation: function(){{}}}}; {onclick}"
            
            # Timeout xử lý mỗi house là 30s. Sử dụng new_page context để không kẹt.
            async def load_and_parse():
                async with page.context.expect_page(timeout=15000) as new_page_info:
                    await page.evaluate(safescript)
                new_page = await new_page_info.value
                await new_page.wait_for_load_state()
                return new_page

            try:
                new_page = await asyncio.wait_for(load_and_parse(), timeout=30.0)
            except asyncio.TimeoutError:
                print(f"    [WARNING] Timeout vượt quá 30 giây khi tải data ID: {sale_unit_id}. Bỏ qua.")
                continue
            
            detail_html = await new_page.content()
            
            # Kiểm tra Captcha
            if "captcha" in detail_html.lower() or "異常なアクセス" in detail_html:
                print(f"    [CẢNH BÁO] Phát hiện Captcha trên tài sản {sale_unit_id}. Đang chụp ảnh màn hình...")
                os.makedirs("../logs", exist_ok=True)
                await new_page.screenshot(path=f"../logs/captcha_detected_{sale_unit_id}.png")
            
            soup = BeautifulSoup(detail_html, 'html.parser')

            raw_data = []
            summary_data = {}
            summary_images = []
        
            price_cont = soup.select_one('.bit__syousai_text_kakaku_container')
            if price_cont:
                base_price = price_cont.select_one('.bit__syousai_text_kakaku')
                if base_price:
                    summary_data["売却基準価額"] = base_price.get_text(strip=True)
                for p_tag in price_cont.select('p.bit__text_small'):
                    val_p = p_tag.find_next_sibling('p')
                    if val_p:
                        summary_data[p_tag.get_text(strip=True)] = val_p.get_text(strip=True)
                    
            for img in soup.select('img.bit__image'):
                src = img.get('src')
                if src:
                    if src.startswith('/'): src = "https://www.bit.courts.go.jp" + src
                    summary_images.append(src)

            from urllib.parse import urljoin
            for a_tag in soup.find_all('a', class_='bit__btn_secondary'):
                href = a_tag.get('href', '')
                if 'お問い合わせ' in a_tag.get_text() or 'info_' in href:
                    # Normalize URL: resolve ../ fragments cleanly
                    base = "https://www.bit.courts.go.jp/app/detail/pd001/h04"
                    href = urljoin(base, href)
                    summary_data["contact_url"] = href
                    break


            div_tables = soup.select('div.table')
            for idx, dt in enumerate(div_tables):
                parent_fc = dt.find_parent('div', class_='form-contents')
                heading = ""
                if parent_fc:
                    p_title = parent_fc.find('p', class_='bit__text_big')
                    if p_title: heading = p_title.get_text(strip=True)
                if not heading:
                    prev_header = dt.find_previous(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                    heading = prev_header.get_text(strip=True) if prev_header else f'Section {idx}'
            
                ths = dt.select('div[class*="_th"]')
                tds = dt.select('div[class*="_td"]')
                is_summary = ("期間入札" in heading or "入札" in heading or "Section" in heading)
            
                if is_summary:
                    for k in range(len(ths)):
                        key = ths[k].get_text(strip=True)
                        if key: summary_data[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''
                else:
                    asset_type = "Unknown"
                    if "土地" in heading: asset_type = "土地"
                    elif "建物" in heading: asset_type = "建物"
                    data_dict = {}
                    for k in range(len(ths)):
                        key = ths[k].get_text(strip=True)
                        if key: data_dict[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''
                        
                    images = []
                    context_node = dt.find_parent('div', class_='mb-3') or parent_fc
                    if context_node:
                        for img in context_node.find_all('img'):
                            src = img.get('src')
                            if not src or "icon" in src.lower() or "logo" in src.lower(): continue
                            if src.startswith('/'): src = "https://www.bit.courts.go.jp" + src
                            elif src.startswith('.'): src = "https://www.bit.courts.go.jp" + src.replace('../', '/')
                            images.append(src)
                
                    if data_dict or images:
                        raw_data.append({"asset_title": heading, "asset_type": asset_type, "data": data_dict, "images": images})

            if summary_data or summary_images:
                raw_data.insert(0, {"asset_title": "Summary", "asset_type": "Summary", "data": summary_data, "images": summary_images})
                
            has_pdf_button = bool(soup.select_one('#threeSetPDF'))
            pdf_url = None
            pdf_images = []
            pdf_full_text = None
            
            if has_pdf_button:
                try:
                    import fitz
                    print(f"  Detected #threeSetPDF, downloading...")
                    async with new_page.expect_download(timeout=30000) as download_info:
                        await new_page.evaluate("if(document.getElementById('threeSetPDF')) document.getElementById('threeSetPDF').click();")
                    download = await download_info.value
                    import uuid
                    pdf_tmp_path = f"/tmp/{sale_unit_id}_{uuid.uuid4().hex[:8]}.pdf"
                    await download.save_as(pdf_tmp_path)
                    
                    pdf_url = None

                    try:
                        doc = fitz.open(pdf_tmp_path)
                        from PIL import Image, ImageStat
                        import io
                        # Image Extraction Logic (From END to START)
                        for page_idx in range(len(doc) - 1, -1, -1):
                            pdf_page = doc[page_idx]
                            
                            image_list = pdf_page.get_images(full=True)
                            if len(image_list) > 0:
                                print(f"    [INFO] Đang xử lý ảnh tài sản trang {page_idx}...")
                                
                            pix_color = pdf_page.get_pixmap(matrix=fitz.Matrix(1, 1))
                            try:
                                pil_color = Image.frombytes("RGB", [pix_color.width, pix_color.height], pix_color.samples)
                            except ValueError:
                                pil_color = Image.frombytes("RGBA", [pix_color.width, pix_color.height], pix_color.samples).convert("RGB")
                                
                            sample = pil_color.resize((150, 150))
                            pixels = list(sample.getdata())
                            colorful = sum(1 for r,g,b in pixels if max(r,g,b) - min(r,g,b) > 20)
                            color_ratio = colorful / len(pixels)
                            
                            # Condition 2: Color ratio > 0.003
                            if color_ratio <= 0.003:
                                continue

                            mat_high = fitz.Matrix(200 / 72, 200 / 72)
                            pix_high = pdf_page.get_pixmap(matrix=mat_high, alpha=False)
                            try:
                                pil_high = Image.frombytes("RGB", [pix_high.width, pix_high.height], pix_high.samples)
                            except ValueError:
                                pil_high = Image.frombytes("RGBA", [pix_high.width, pix_high.height], pix_high.samples).convert("RGB")

                            image_filename = f"{sale_unit_id}_p{page_idx}.jpg"
                            img_byte_arr = io.BytesIO()
                            pil_high.save(img_byte_arr, format="JPEG", quality=85)
                            img_bytes = img_byte_arr.getvalue()
                            
                            try:
                                supabase.storage.from_(STORAGE_BUCKET).upload(
                                    path=f"properties/{sale_unit_id}/{image_filename}",
                                    file=img_bytes,
                                    file_options={"content-type": "image/jpeg", "upsert": "true"}
                                )
                                public_img_url = f"{supabase_url}/storage/v1/object/public/{STORAGE_BUCKET}/properties/{sale_unit_id}/{image_filename}"
                                pdf_images.append(public_img_url)
                                print(f"    [INFO] Uploaded: {image_filename} | color_ratio={color_ratio:.4f}")
                                
                                if len(pdf_images) >= 10:
                                    print("    [IMG] Reached maximum of 10 extracted images, stopping PDF image parsing.")
                                    break
                            except Exception as up_img_e:
                                print(f"    [IMG] Error uploading {image_filename}: {up_img_e}")
                        doc.close()
                        if os.path.exists(pdf_tmp_path):
                            os.remove(pdf_tmp_path)
                        print(f"    [INFO] Xử lý tài liệu 3点セット thành công.")
                    except Exception as e: print(f"  PDF IMG ERR: {e}")
                except Exception as e: print(f"  PDF ERR: {e}")
                
            final_images = []
            if summary_images:
                for s_img in summary_images:
                    if s_img not in final_images: final_images.append(s_img)
            for p_img in pdf_images:
                if p_img not in final_images: final_images.append(p_img)
                    
            thumbnail_url = final_images[0] if final_images else None
        
            # Address & Court logic
            address_raw = "Unknown"
            for section in raw_data:
                if "所在地" in section.get("data", {}):
                    address_raw = section["data"]["所在地"]
                    break
                elif "所在" in section.get("data", {}):
                    address_raw = section["data"]["所在"]
                    break
                    
            if address_raw != "Unknown" and not address_raw.startswith(prefecture):
                address_raw = prefecture + address_raw
                
            court_name = "Unknown"
            court_p = soup.select_one('.bit__text_big.d-sm-inline')
            if court_p:
                court_text = court_p.get_text(strip=True)
                if '　' in court_text:
                    court_name = court_text.split('　')[0].replace("本庁", "")
                elif ' ' in court_text:
                    court_name = court_text.split(' ')[0].replace("本庁", "")
                    
            # Property type logic
            has_land = False
            has_building = False
            is_condo = False
            chimoku_agri = False
            chimoku_house = False
            for section in raw_data:
                title = section.get("asset_title", "")
                d_dict = section.get("data", {})
                if "土地" in title: has_land = True
                if "建物" in title: has_building = True
                if "区分所有" in title or "マンション" in title or "敷地権" in title:
                    is_condo = True
                    
                chimoku = d_dict.get("地目", "")
                combined_text = title + " " + chimoku
                if "田" in combined_text or "畑" in combined_text or "農地" in combined_text:
                    chimoku_agri = True
                if "宅地" in combined_text or "山林" in combined_text or "雑種地" in combined_text:
                    chimoku_house = True
                    
            if is_condo:
                prop_type_raw = "マンション"
            elif has_land and has_building:
                prop_type_raw = "戸建て"
            elif has_building:
                prop_type_raw = "戸建て"
            elif has_land:
                if chimoku_agri: prop_type_raw = "農地"
                elif chimoku_house: prop_type_raw = "宅地"
                else: prop_type_raw = "土地"
            else:
                prop_type_raw = "その他"
                
            price_str = summary_data.get("売却基準価額", "")
            start_price = int(re.sub(r'[^\d]', '', price_str)) if price_str else None
        
            # Lat/Lng Check
            cur.execute('SELECT lat, lng FROM "Property" WHERE sale_unit_id = %s', (sale_unit_id,))
            existing_loc = cur.fetchone()
            lat, lng = None, None
            if existing_loc and existing_loc[0] and existing_loc[1]:
                lat, lng = existing_loc[0], existing_loc[1]
            else:
                lat, lng = geocode_address(address_raw, gemini_key)
                
            city_str = extract_city(address_raw, prefecture)
            check_and_update_db(sale_unit_id, pdf_url, raw_data, final_images, thumbnail_url, address_raw, start_price, court_name, prop_type_raw, lat, lng, prefecture, city_str, raw_text=None)
            print(f"    [INFO] Đã thêm/cập nhật thành công vào Database ({prop_type_raw}) - {city_str}")
            
            await new_page.close()
        except Exception as e:
            print(f"  Error on ID {sale_unit_id}: {e}")
            try:
                await new_page.close()
            except: pass
            
    cur.close()
    conn.close()
    return len(unique_items)

async def main():
    state = get_state()
    completed_courts = state.get("completed_courts", [])

    async with async_playwright() as p:
        all_court_args = []
        # Loop through all 8 regions of Japan
        for region_idx in range(1, 9):
            region_code = f"{region_idx:02d}"
            
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(locale="ja-JP", accept_downloads=True, user_agent=get_random_user_agent())
            page = await context.new_page()
            
            try:
                await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
                # Navigate to property map
                async with page.expect_navigation(timeout=30000):
                    await page.evaluate(f"tranAreaMap('{region_code}','property');")
                
                await page.wait_for_timeout(2000)
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                # Courts appear as areas
                areas = soup.select('area[onclick*="showSearchCondition"]')
                for a in areas:
                    onclick = a.get('onclick', '')
                    match = re.search(r"showSearchCondition\((.*?)\)", onclick)
                    if match:
                        args = [arg.strip(" '\"&quot;") for arg in match.group(1).split(",")]
                        args.append(region_code) # Store region_code for navigation
                        all_court_args.append(args)
            except Exception as e:
                print(f"Failed to load region {region_code}: {e}")
                
            await browser.close()
            
        # Group courts by prefecture
        prefs = {}
        for args in all_court_args:
            pref_id = args[0]
            pref_name = PREF_MAP.get(pref_id, "Unknown")
            if pref_name not in prefs:
                prefs[pref_name] = []
            prefs[pref_name].append(args)
            
        for pref_name, court_group in prefs.items():
            
            # Check if all courts in this prefecture are completed
            all_completed = True
            for args in court_group:
                court_id = f"{args[0]}_{args[1]}_{args[2]}"
                if court_id not in completed_courts:
                    all_completed = False
            
            if all_completed:
                print(f"Skipping prefecture (already fully completed): {pref_name}")
                continue
                
            print(f"=== Starting Prefecture: {pref_name} ({len(court_group)} Courts) ===")
            
            # KHỞI TẠO MEMORY CACHE CHO PREFECTURE
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute('SELECT sale_unit_id, starting_price FROM "Property" WHERE prefecture = %s AND status = %s AND source_provider = %s', (pref_name, 'ACTIVE', 'BIT'))
            memory_cache_prices = {row[0]: row[1] for row in cur.fetchall()}
            cur.close()
            conn.close()
            
            prefecture_scraped_ids = set()
            print(f"[Memory Cache] Đã load {len(memory_cache_prices)} ID có sẵn cho tỉnh {pref_name}")
            
            for args in court_group:
                court_id = f"{args[0]}_{args[1]}_{args[2]}"
                region_code = args[3]
                
                if court_id in completed_courts:
                    print(f"  Skipping court: {court_id}")
                    continue
                    
                print(f"  -> Crawling Court {court_id} ...")
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(locale="ja-JP", accept_downloads=True)
                page = await context.new_page()
                
                try:
                    await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
                    async with page.expect_navigation(timeout=30000):
                        await page.evaluate(f"tranAreaMap('{region_code}','property');")
                    
                    await page.wait_for_timeout(2000)
                    await page.evaluate(f"showSearchCondition('{args[0]}', '{args[1]}', '{args[2]}');")
                    await page.wait_for_timeout(2000)
                    
                    try:
                        await page.evaluate("if(document.getElementById('btnAllPlaceOn1')) document.getElementById('btnAllPlaceOn1').click();")
                    except: pass
                    
                    async with page.expect_navigation(timeout=30000):
                        await page.evaluate(f"tranResultSearch('{args[1]}');")
                    
                    await page.wait_for_load_state('networkidle')
                    await page.wait_for_timeout(2000)
                    
                    total_items = 0
                    try:
                        total_loc = page.locator('span.bit__numberOfResult_totalNumber')
                        if await total_loc.count() > 0:
                            total_text = await total_loc.first.inner_text()
                            total_items = int(total_text.replace(',', '').strip())
                    except Exception:
                        pass
                        
                    total_pages = (total_items + 9) // 10 if total_items > 0 else 1
                    print(f"  [BIT] Tìm thấy tổng cộng {total_items} vụ án, dự kiến cào trong {total_pages} trang.")
                    
                    crawled_count = 0
                    for page_num in range(1, total_pages + 1):
                        print(f"     Page {page_num}/{total_pages}")
                        
                        if page_num > 1:
                            await page.wait_for_timeout(random.randint(3000, 5000))
                            async with page.expect_navigation(timeout=30000):
                                await page.evaluate(f"getData({page_num});")
                            await page.wait_for_load_state('networkidle')
                            await page.wait_for_timeout(1000)
                            
                        processed_on_page = await process_listing_page(page, pref_name, state, save_state, memory_cache_prices, prefecture_scraped_ids)
                        if processed_on_page == 0:
                            break
                            
                        crawled_count += processed_on_page
                        if total_items > 0 and crawled_count >= total_items:
                            print(f"  [BIT] Đã cào đủ {total_items} vụ án theo chỉ tiêu, chuyển sang toà án mới.")
                            break
                            
                    completed_courts.append(court_id)
                    save_state(completed_courts)
                    
                except Exception as e:
                    print(f"Error during court {court_id}: {e}")
                    os.makedirs("../logs", exist_ok=True)
                    try:
                        await page.screenshot(path=f"../logs/error_advanced_{court_id}.png")
                    except: pass
                    
            # GHOST SWEEP FOR PREFECTURE USING MEMORY CACHE
            ghost_ids = set(memory_cache_prices.keys()) - prefecture_scraped_ids
            if ghost_ids:
                print(f"[GHOST SWEEP BIT] Cảnh báo: Tìm thấy {len(ghost_ids)} tài sản đã biến mất ở tỉnh {pref_name}. Đang lưu trữ...")
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute('UPDATE "Property" SET status = %s, updated_at = NOW() WHERE sale_unit_id IN %s', ('ARCHIVED', tuple(ghost_ids)))
                conn.commit()
                cur.close()
                conn.close()
                print(f"[GHOST SWEEP BIT] Đã Archive thành công {len(ghost_ids)} tài sản.")
            else:
                print(f"[GHOST SWEEP BIT] Không có tài sản biến mất ở tỉnh {pref_name}.")
                
                await browser.close()
                time.sleep(2)
                
            print(f"=== Finished Prefecture: {pref_name} ===")

if __name__ == "__main__":
    asyncio.run(main())
