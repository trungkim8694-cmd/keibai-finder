import asyncio
import os
import re
import json
import psycopg2
import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv
load_dotenv("../web/.env")

from crawler_utils import get_nearest_station_from_db, get_gsi_coords
from ai_analyzer import extract_text_and_purge
from supabase import create_client, Client
import io

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
STORAGE_BUCKET = "keibai-storage"

import unicodedata
import urllib.parse
import time

db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")

JAPAN_BOUNDS = {"lat_min": 24.0, "lat_max": 46.0, "lng_min": 122.0, "lng_max": 154.0}

def is_valid_japan_coords(lat, lng):
    """Kiểm tra tọa độ có trong biên giới Nhật Bản không."""
    if lat is None or lng is None:
        return False
    return (JAPAN_BOUNDS["lat_min"] <= float(lat) <= JAPAN_BOUNDS["lat_max"] and
            JAPAN_BOUNDS["lng_min"] <= float(lng) <= JAPAN_BOUNDS["lng_max"])

def reverse_validate_coords(lat, lng, original_address):
    """
    Kiểm tra chéo: Reverse geocode tọa độ và xác nhận kết quả có khớp địa chỉ gốc không.
    Nếu OSM geocode nhầm thành phố hoặc tỉnh, sẽ bị từ chối.
    """
    if not is_valid_japan_coords(lat, lng):
        return False
    try:
        time.sleep(1.2)  # Rate limit
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        res = requests.get(url, headers={"User-Agent": "KeibaiFinderApp/1.0 (kimtrung@keibai)"}, timeout=10)
        rev = res.json()
        addr_parts = rev.get('address', {})
        # Tập hợp các thành phần địa chỉ được trả về
        returned_place = ' '.join([
            addr_parts.get('city', ''),
            addr_parts.get('town', ''),
            addr_parts.get('village', ''),
            addr_parts.get('county', ''),
            addr_parts.get('province', ''),
            addr_parts.get('subprovince', ''),
        ])
        # Tách riêng City và Prefecture từ địa chỉ gốc để tránh ghép nhầm
        import re as _re
        # Ưu tiên cấp Thành phố/Huyện (không lấy phần tỉnh đứng trước)
        m_city = _re.search(r'(?:都|道|府|県)([^\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', original_address)
        m_pref = _re.search(r'([\u3040-\u9fff]+(?:都|道|府|県))', original_address)
        # Fallback: Địa chỉ không có tỉnh đứng trước (VD: 小樽市..., 日高郡...)
        m_city_bare = _re.search(r'^([\u3040-\u9fff]+(?:市|区|郡|町|村))', original_address)
        # Tách Town ra khỏi County: 日高郡新ひだか町 → thêm cả '新ひだか町' và '日高郡'
        m_town = _re.search(r'郡([\u3040-\u9fff]+?(?:町|村))', original_address)
        m_county = _re.search(r'([\u3040-\u9fff]+郡)', original_address)
        
        expected_parts = []
        if m_city:
            expected_parts.append(m_city.group(1).strip())
        if m_pref:
            expected_parts.append(m_pref.group(1))
        if m_city_bare and not m_city:
            expected_parts.append(m_city_bare.group(1))
        if m_town:
            expected_parts.append(m_town.group(1))
        if m_county:
            expected_parts.append(m_county.group(1))
        
        if not expected_parts:
            return True  # Không tìm được đơn vị địa lý, bỏ qua kiểm tra
        
        is_match = any(part in returned_place for part in expected_parts)
        if not is_match:
            print(f"      [Reverse-Mismatch] Địa chỉ gốc: '{expected_parts}' | OSM trả về: '{returned_place.strip()}'")
        return is_match
    except Exception as e:
        print(f"      [Reverse-Error]: {e}")
        return True  # Nếu reverse lỗi, cấp nhận để không bỏ qua tất cả

def to_half_width(text):
    return unicodedata.normalize('NFKC', text)

def aggressive_clean(address):
    """Chuẩn hóa địa chỉ tiếng Nhật trước khi geocode (copy từ nta_parser.py)."""
    addr = to_half_width(address)
    addr = re.sub(r'[番番地号]$', '', addr)
    addr = re.sub(r'番地?', '-', addr)
    addr = re.sub(r'号', '', addr)
    addr = re.sub(r'-+', '-', addr).strip('-')
    return addr

def get_osm_coords(addr, original_address=None):
    """Gọi Nominatim OSM API để lấy tọa độ, có reverse validation."""
    time.sleep(1.2)  # Rate limit Nominatim: tối đa 1 request/giây
    headers = {"User-Agent": "KeibaiFinderApp/1.0 (kimtrung@keibai)"}
    query = f"{addr}, Japan"
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        data = res.json()
        if data and len(data) > 0:
            lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
            check_addr = original_address or addr
            if reverse_validate_coords(lat, lng, check_addr):
                return lat, lng
            else:
                print(f"      [OSM-Rejected] Tọa độ bị từ chối do không khớp địa chỉ: {lat},{lng} cho '{addr}'")
    except Exception as e:
        print(f"      [OSM-Error]: {e}")
    return None, None

def geocode_address(address, api_key=None):
    """Geocode địa chỉ tiếng Nhật qua GSI (chính phủ) với OSM Nominatim làm fallback."""
    if not address or address == 'Unknown':
        return None, None

    clean_addr = aggressive_clean(address)

    # Layer 00: GSI API
    lat_gsi, lng_gsi = get_gsi_coords(clean_addr)
    if lat_gsi and lng_gsi:
        if reverse_validate_coords(lat_gsi, lng_gsi, address):
            return lat_gsi, lng_gsi
        else:
            print(f"      [GSI-Rejected] Tọa độ không khớp địa chỉ: {lat_gsi},{lng_gsi} cho '{address}'")

    # Layer 0: Địa chỉ đầy đủ qua OSM
    lat, lng = get_osm_coords(clean_addr, address)
    if lat and lng:
        return lat, lng

    # Layer 1: Cấp phường/丁目 (cắt số cuối)
    m_phuong = re.match(r"^(.*?)[0-9\-]+$", clean_addr)
    if m_phuong:
        addr_phuong = m_phuong.group(1).strip()
        print(f"      [OSM-Retry L1] Thử lại cấp Phường: {addr_phuong}")
        lat, lng = get_osm_coords(addr_phuong, address)
        if lat and lng:
            return lat, lng

    # Layer 2: Cấp quận/市区郡
    m_quan = re.match(r"(.*?[都道府県]?.*?[市区郡町村])", clean_addr)
    if m_quan:
        addr_quan = m_quan.group(1).strip()
        phuong_addr = m_phuong.group(1).strip() if m_phuong else ''
        if addr_quan != clean_addr and addr_quan != phuong_addr:
            print(f"      [OSM-Retry L2] Thử lại cấp Quận/TP: {addr_quan}")
            lat, lng = get_osm_coords(addr_quan, address)
            if lat and lng:
                return lat, lng

    print(f"      [OSM-Fail] Không thể geocode: {address}")
    return None, None

def update_db(sale_unit_id, pdf_url, raw_data, pdf_images, thumbnail_url, address, start_price, court_name, prop_type, lat, lng, area, managing_authority, bid_start_date, bid_end_date, line_name, ai_analysis_json, prefecture, city, ai_status, raw_text):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    raw_data_json = json.dumps(raw_data, ensure_ascii=False)
    
    cur.execute('SELECT sale_unit_id FROM "Property" WHERE sale_unit_id = %s', (sale_unit_id,))
    if not cur.fetchone():
         query = """INSERT INTO "Property" (sale_unit_id, source_provider, court_name, property_type, address, starting_price, lat, lng, pdf_url, raw_display_data, images, "thumbnailUrl", area, managing_authority, bid_start_date, bid_end_date, line_name, ai_analysis, prefecture, city, ai_status, raw_text, updated_at) VALUES (%s, 'BIT', %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, NOW())"""
         cur.execute(query, (sale_unit_id, court_name, prop_type, address, start_price, lat, lng, pdf_url, raw_data_json, pdf_images, thumbnail_url, area, managing_authority, bid_start_date, bid_end_date, line_name, json.dumps(ai_analysis_json) if ai_analysis_json else None, prefecture, city, ai_status, raw_text))
    else:
         query = """UPDATE "Property" SET source_provider='BIT', court_name=COALESCE(%s, court_name), property_type=COALESCE(%s, property_type), address=COALESCE(%s, address), starting_price=COALESCE(%s, starting_price), lat=COALESCE(%s, lat), lng=COALESCE(%s, lng), pdf_url=%s, raw_display_data=%s::jsonb, images=%s, "thumbnailUrl"=%s, area=COALESCE(%s, area), managing_authority=COALESCE(%s, managing_authority), bid_start_date=COALESCE(%s, bid_start_date), bid_end_date=COALESCE(%s, bid_end_date), line_name=COALESCE(%s, line_name), ai_analysis=COALESCE(%s::jsonb, ai_analysis), prefecture=COALESCE(%s, prefecture), city=COALESCE(%s, city), ai_status=COALESCE(%s, ai_status), raw_text=COALESCE(%s, raw_text), updated_at=NOW() WHERE sale_unit_id = %s"""
         cur.execute(query, (court_name, prop_type, address, start_price, lat, lng, pdf_url, raw_data_json, pdf_images, thumbnail_url, area, managing_authority, bid_start_date, bid_end_date, line_name, json.dumps(ai_analysis_json) if ai_analysis_json else None, prefecture, city, ai_status, raw_text, sale_unit_id))
    conn.commit()
    cur.close()
    conn.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP", accept_downloads=True)
        page = await context.new_page()

        print("Navigating to BIT...")
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
        await page.locator("a:has-text('北海道')").first.wait_for(state="attached", timeout=15000)
        await page.evaluate("tranAreaMap('01','property');")
        await page.locator("h1:has-text('北海道の物件を検索する')").wait_for(state="attached", timeout=15000)
        await asyncio.sleep(2)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await page.locator("#otherMunicipalityIdArea input[type='checkbox']").first.wait_for(state="attached", timeout=15000)
        await asyncio.sleep(1)
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")
        
        processed_count = 0
        
        while processed_count < 15:
            detail_link_locators = page.locator("a[onclick*='tranPropertyDetail']")
            try:
                await detail_link_locators.first.wait_for(state="attached", timeout=15000)
            except:
                print("No properties found.")
                break
                
            count = await detail_link_locators.count()
            page_onclicks = []
            
            for i in range(count):
                onclick = await detail_link_locators.nth(i).get_attribute("onclick")
                if onclick and onclick not in page_onclicks:
                    page_onclicks.append(onclick)
            
            for onclick in page_onclicks:
                if processed_count >= 15:
                    break
                    
                match = re.search(r"tranPropertyDetail\([\"']([^\"']+)[\"'],", onclick)
                if not match: continue
                sale_unit_id = match.group(1)
                print(f"Scraping #{processed_count+1}: {sale_unit_id}")
                
                try:
                    safescript = f"window.event = {{preventDefault: function(){{}}, stopPropagation: function(){{}}}}; {onclick}"
                    async with context.expect_page(timeout=15000) as new_page_info:
                        await page.evaluate(safescript)
                    new_page = await new_page_info.value
                    await new_page.wait_for_load_state()
                    detail_html = await new_page.content()
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

                    # Extract 「お問い合わせ」 contact URL from bit__btn_secondary link
                    contact_url = None
                    contact_btn = soup.select_one('a.bit__btn_secondary')
                    if contact_btn and contact_btn.get('href'):
                        href = contact_btn['href']
                        # Convert relative path to absolute
                        if href.startswith('/'):
                            contact_url = "https://www.bit.courts.go.jp" + href
                        elif href.startswith('http'):
                            contact_url = href
                        else:
                            contact_url = "https://www.bit.courts.go.jp/" + href.lstrip('./')

                    if summary_data or summary_images:
                        summary_section = {"asset_title": "Summary", "asset_type": "Summary", "data": summary_data, "images": summary_images}
                        if contact_url:
                            summary_section["contact_url"] = contact_url
                        raw_data.insert(0, summary_section)

                    has_pdf_button = bool(soup.select_one('#threeSetPDF'))
                    pdf_url = None
                    pdf_images = []
                
                    if has_pdf_button:
                        try:
                            import fitz
                            print(f"  Detected #threeSetPDF, downloading...")
                            async with new_page.expect_download(timeout=30000) as download_info:
                                await new_page.evaluate("document.getElementById('threeSetPDF').click();")
                            import uuid
                            pdf_tmp_path = f"/tmp/{sale_unit_id}_{uuid.uuid4().hex[:8]}.pdf"
                            await download.save_as(pdf_tmp_path)
                            print(f"  Downloaded PDF to {pdf_tmp_path}")
                            
                            # Xóa đoạn mã upload PDF lên Supabase theo luật "Tuyệt đối không lưu file PDF lên Server để tiết kiệm Disk".
                            # Chỉ lấy URL Bypass trỏ thẳng vào tòa án.
                            pdf_url = None
                                
                            try:
                                doc = fitz.open(pdf_tmp_path)
                                from PIL import Image, ImageStat
                                import io
                            
                                for page_idx in range(len(doc)):
                                    pdf_page = doc[page_idx]
                                    
                                    # Để nhận diện màu sắc, chỉ cần render ma trận 1x1 rồi resize nhỏ cho nhẹ RAM
                                    pix_color = pdf_page.get_pixmap(matrix=fitz.Matrix(1, 1))
                                    try:
                                        pil_color = Image.frombytes("RGB", [pix_color.width, pix_color.height], pix_color.samples)
                                    except ValueError:
                                        pil_color = Image.frombytes("RGBA", [pix_color.width, pix_color.height], pix_color.samples).convert("RGB")
                                        
                                    sample = pil_color.resize((150, 150))
                                    pixels = list(sample.getdata())
                                    colorful = sum(1 for r,g,b in pixels if max(r,g,b) - min(r,g,b) > 20)
                                    color_ratio = colorful / len(pixels)
                                    
                                    if color_ratio <= 0.015:
                                        continue
                                        
                                    # Nếu đạt chuẩn có hình ảnh màu -> Render lại bản nét (DPI 200) để xuất xưởng
                                    mat_high = fitz.Matrix(200 / 72, 200 / 72)
                                    pix_high = pdf_page.get_pixmap(matrix=mat_high, alpha=False)
                                    try:
                                        pil_high = Image.frombytes("RGB", [pix_high.width, pix_high.height], pix_high.samples)
                                    except ValueError:
                                        pil_high = Image.frombytes("RGBA", [pix_high.width, pix_high.height], pix_high.samples).convert("RGB")

                                    # Upload ảnh Full page lên Supabase Storage qua bộ nhớ (BytesIO)
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
                                        print(f"    [IMG] Uploaded: {image_filename} | color_ratio={color_ratio:.4f}")
                                    except Exception as up_img_e:
                                        print(f"    [IMG] Error uploading {image_filename}: {up_img_e}")

                                print(f"  Extracted {len(pdf_images)} high-quality photo images from PDF to Supabase.")
                                doc.close()
                                
                                # Dọn dẹp file PDF tmp cho nhẹ server
                                if os.path.exists(pdf_tmp_path):
                                    os.remove(pdf_tmp_path)
                            except Exception as pdf_e:
                                print(f"  Failed to extract PDF images: {pdf_e}")

                        except Exception as e:
                            print(f"  Failed to download/extract PDF: {e}")
                
                    final_images = []
                    if summary_images:
                        for s_img in summary_images:
                            if s_img not in final_images:
                                final_images.append(s_img)
                    for p_img in pdf_images:
                        if p_img not in final_images:
                            final_images.append(p_img)
                            
                    thumbnail_url = final_images[0] if final_images else None
                
                    # Geocoding fields
                    address_raw = "Unknown"
                    for section in raw_data:
                        if "所在地" in section.get("data", {}):
                            address_raw = section["data"]["所在地"]
                            break
                        elif "所在" in section.get("data", {}):
                            address_raw = section["data"]["所在"]
                            break
                            
                    if address_raw != "Unknown" and not address_raw.startswith("北海道"):
                        address_raw = "北海道" + address_raw

                        
                    court_name = "Unknown"
                    court_p = soup.select_one('.bit__text_big.d-sm-inline')
                    if court_p:
                        court_text = court_p.get_text(strip=True)
                        if '　' in court_text:
                            court_name = court_text.split('　')[0].replace("本庁", "")
                        elif ' ' in court_text:
                            court_name = court_text.split(' ')[0].replace("本庁", "")
                    has_land = False
                    has_building = False
                    is_condo = False
                    chimoku_agri = False
                    chimoku_house = False
                    
                    for section in raw_data:
                        title = section.get("asset_title", "")
                        data_dict = section.get("data", {})
                        if "土地" in title: has_land = True
                        if "建物" in title: has_building = True
                        if "区分所有" in title or "マンション" in title or "敷地権" in title:
                            is_condo = True
                            
                        # Handle Chimoku (地目) or Title
                        chimoku = data_dict.get("地目", "")
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
                        if chimoku_agri:
                            prop_type_raw = "農地"
                        elif chimoku_house:
                            prop_type_raw = "宅地"
                        else:
                            prop_type_raw = "土地"
                    else:
                        prop_type_raw = "その他"
                    price_str = summary_data.get("売却基準価額", "")
                    start_price = int(re.sub(r'[^\d]', '', price_str)) if price_str else None
                
                    # Extract Data
                    area = None
                    bid_start_date = None
                    bid_end_date = None
                    managing_authority = court_name
                    
                    def to_half_width(s):
                        return s.translate(str.maketrans('０１２３４５６７８９．，', '0123456789.,'))

                    def process_land_val(val):
                        nonlocal area
                        if not val: return
                        hw = to_half_width(str(val))
                        m = re.search(r'([\d,\.]+)', hw)
                        if m:
                            num_str = m.group(1).replace(',', '')
                            try:
                                num = float(num_str)
                                if area is None: area = 0
                                area += num
                            except: pass

                    def process_mansion_val(val_str):
                        hw = to_half_width(val_str)
                        hw = re.sub(r'地下[\d\.]+\s*階(部分|建)?', ' ', hw)
                        hw = re.sub(r'[\d\.]+\s*階(部分|建)?', ' ', hw)
                        m = re.search(r'(\d+\.?\d*)\s*(m2|㎡|平米|ｍ２)', hw, re.IGNORECASE)
                        if m: return float(m.group(1))
                        m = re.search(r'(\d+\.?\d*)', hw)
                        if m: return float(m.group(1))
                        return None
                        
                    if prop_type_raw in ["戸建て", "土地", "農地", "山林", "宅地"]:
                        for section in raw_data:
                            for k, v in section.get('data', {}).items():
                                if "土地面積（登記）" in k:
                                    process_land_val(v)
                    elif prop_type_raw == "マンション":
                        found_area = None
                        for section in raw_data:
                            if found_area is not None: break
                            for target in ["専有面積（登記）", "専有面積", "面積"]:
                                for k, v in section.get('data', {}).items():
                                    if target in k:
                                        val = process_mansion_val(str(v))
                                        if val is not None:
                                            found_area = val
                                            break
                                if found_area is not None: break
                        if found_area is not None:
                            area = found_area

                    # Parse Bid End Date
                    schedule_str = None
                    for key in summary_data.keys():
                        if "期間入札" in key or "入札期間" in key or "期間" in key:
                            schedule_str = summary_data[key]
                            break
                    if schedule_str:
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
                            bid_end_date = f"{s_y}-{s_m:02d}-{s_d:02d}T23:59:59+09:00"
                            if len(m_dates) > 1:
                                e_y, e_m, e_d = parse_m(m_dates[0])
                                bid_start_date = f"{e_y}-{e_m:02d}-{e_d:02d}T00:00:00+09:00"
                            
                    lat = None
                    lng = None
                    # Preventive Measure: Check if lat/lng already exists in the DB
                    try:
                        conn_check = psycopg2.connect(db_url)
                        cur_check = conn_check.cursor()
                        cur_check.execute('SELECT lat, lng FROM "Property" WHERE sale_unit_id = %s', (sale_unit_id,))
                        existing = cur_check.fetchone()
                        if existing and existing[0] and existing[1]:
                            lat, lng = existing[0], existing[1]
                        cur_check.close()
                        conn_check.close()
                    except Exception as e:
                        print(f"  Warning: DB check for geocodes failed: {e}")
                    
                    if not lat:
                        print(f"  Geocoding missing location for {sale_unit_id}...")
                        lat, lng = geocode_address(address_raw)
                        
                    if not lat:
                        print(f"  [WARNING] Không thể geocode địa chỉ cho {sale_unit_id}. Lưu với tọa độ NULL.")
                        lat, lng = None, None

                    # Geo and local calculation (chỉ tính nếu có tọa độ hợp lệ)
                    st_name, line_name, st_dist, st_time = None, None, None, None
                    if lat and lng:
                        conn = psycopg2.connect(db_url)
                        cur = conn.cursor()
                        st_name, line_name, st_dist, st_time = get_nearest_station_from_db(lat, lng, cur)
                        cur.close()
                        conn.close()
                    
                    # Extract Data from downloaded PDF
                    ai_analysis_json = None
                    raw_text_val = None
                    ai_status = "SKIPPED_AI"
                    
                    if has_pdf_button and os.path.exists(pdf_path_full):
                        target_types = ["戸建て", "マンション"]
                        if prop_type_raw in target_types:
                            print(f"  [AI] Extracting text for {prop_type_raw}...")
                            raw_text_val = extract_text_and_purge([pdf_path_full])
                            ai_status = "PENDING_AI"
                        else:
                            print(f"  [AI] Skipping text extraction for type: {prop_type_raw}. Purging PDF...")
                            try: os.remove(pdf_path_full)
                            except: pass
                            ai_status = "SKIPPED_AI"
                        pdf_url = None 

                    if area is not None:
                        area = round(area)

                    # Extract prefecture and city from address_raw
                    prefecture_val = None
                    city_val = None
                    m_pref = re.search(r'^(.{2,3}[都道府県])', address_raw)
                    if m_pref:
                        prefecture_val = m_pref.group(1)
                        # Extract city: everything after prefecture until city/ward/town/village
                        m_city = re.search(r'(.{2,3}[都道府県])([^\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', address_raw)
                        if m_city:
                            city_val = m_city.group(2)

                    update_db(sale_unit_id, pdf_url, raw_data, final_images, thumbnail_url, address_raw, start_price, court_name, prop_type_raw, lat, lng, area, managing_authority, bid_start_date, bid_end_date, line_name, ai_analysis_json, prefecture_val, city_val, ai_status, raw_text_val)
                    print(f"  Saved JSON with {len(raw_data)} sections to DB. Geocoded: {lat},{lng} | Area: {area} | Auth/Date: {managing_authority}/{bid_start_date} to {bid_end_date} | Contact: {contact_url}")
                    
                    # Update nearest_station explicitly
                    if st_name:
                        conn2 = psycopg2.connect(db_url)
                        cur2 = conn2.cursor()
                        cur2.execute('UPDATE "Property" SET nearest_station = %s, distance_to_station = %s, walk_time_to_station = %s, line_name = %s WHERE sale_unit_id = %s', (st_name, st_dist, st_time, line_name, sale_unit_id))
                        conn2.commit()
                        cur2.close()
                        conn2.close()
                    await new_page.close()
                    processed_count += 1

                except Exception as e:
                    import traceback
                    print(f"  ERROR processing {sale_unit_id}: {e}\n{traceback.format_exc()}")
                    try:
                        await new_page.close()
                    except:
                        pass
                    continue

            if processed_count >= 15:
                break

            # After processing all current page links, go to next page
            next_btn = page.locator("a:has-text('次へ')")
            if await next_btn.count() > 0:
                async with page.expect_navigation():
                    await next_btn.first.click()
                await asyncio.sleep(2)
            else:
                break

        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
