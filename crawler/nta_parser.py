import os
import re
import json
import time
import psycopg2
import unicodedata
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import urllib.parse
import requests
from playwright.sync_api import sync_playwright

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")

NTA_BASE_URL = "https://www.koubai.nta.go.jp/auctionx/public"

from crawler_utils import clean_area_string, convert_reiwa_to_datetime, convert_reiwa_range_to_datetimes, get_nearest_station_from_db, get_gsi_coords, geocode_address
from ai_analyzer import extract_text_and_purge

def extract_table_data(soup_div):
    data = {}
    if not soup_div: return data
    for tr in soup_div.find_all("tr"):
        th = tr.find("th")
        td = tr.find("td")
        if th and td:
            th_text = th.get_text(strip=True)
            for br in td.find_all("br"):
                br.replace_with("\n")
            td_text = td.get_text(strip=True)
            data[th_text] = td_text
    return data


def parse_price(price_str):
    if not price_str:
        return None
    cleaned = re.sub(r'[^\d]', '', price_str)
    return int(cleaned) if cleaned else None

def normalize_category(raw_val):
    if not raw_val: return "その他"
    val_lower = raw_val.lower()
    if "建物" in val_lower or "家屋" in val_lower or "戸建" in val_lower: return "戸建て"
    if "区分所有" in val_lower or "マンション" in val_lower: return "マンション"
    if "宅地" in val_lower: return "土地"
    if "田" in val_lower or "畑" in val_lower or "農地" in val_lower: return "農地"
    return "その他"

def to_half_width(text):
    import unicodedata
    return unicodedata.normalize('NFKC', text)


def extract_pdf_links(soup):
    pdfs = []
    links = soup.find_all("a", href=True)
    for link in links:
        href = link["href"]
        text = link.get_text(strip=True)
        if "PDF" in text or href.lower().endswith(".pdf") or "pdf" in href.lower():
            full_url = href if href.startswith("http") else f"{NTA_BASE_URL}/{href}"
            if full_url not in pdfs:
                pdfs.append(full_url)
    return pdfs

def scrape_nta(limit=20):
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: return
    db_url = db_url.replace("?schema=public", "")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    upsert_query = """
    INSERT INTO "Property" (sale_unit_id, source_provider, source_url, court_name, property_type, address, starting_price, lat, lng, pdf_url, "thumbnailUrl", images, raw_display_data, area, bid_start_date, bid_end_date, managing_authority, line_name, nearest_station, distance_to_station, walk_time_to_station, ai_analysis, prefecture, city, ai_status, raw_text, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, NOW())
    ON CONFLICT (sale_unit_id) DO UPDATE SET
        source_provider = EXCLUDED.source_provider,
        source_url = EXCLUDED.source_url,
        starting_price = EXCLUDED.starting_price,
        address = EXCLUDED.address,
        property_type = EXCLUDED.property_type,
        pdf_url = COALESCE(EXCLUDED.pdf_url, "Property".pdf_url),
        lat = COALESCE(EXCLUDED.lat, "Property".lat),
        lng = COALESCE(EXCLUDED.lng, "Property".lng),
        "thumbnailUrl" = COALESCE(EXCLUDED."thumbnailUrl", "Property"."thumbnailUrl"),
        images = EXCLUDED.images,
        raw_display_data = EXCLUDED.raw_display_data,
        area = EXCLUDED.area,
        bid_start_date = EXCLUDED.bid_start_date,
        bid_end_date = EXCLUDED.bid_end_date,
        managing_authority = EXCLUDED.managing_authority,
        line_name = EXCLUDED.line_name,
        nearest_station = EXCLUDED.nearest_station,
        distance_to_station = EXCLUDED.distance_to_station,
        walk_time_to_station = EXCLUDED.walk_time_to_station,
        ai_analysis = COALESCE(EXCLUDED.ai_analysis, "Property".ai_analysis),
        prefecture = COALESCE(EXCLUDED.prefecture, "Property".prefecture),
        city = COALESCE(EXCLUDED.city, "Property".city),
        ai_status = COALESCE(EXCLUDED.ai_status, "Property".ai_status),
        raw_text = COALESCE(EXCLUDED.raw_text, "Property".raw_text),
        updated_at = NOW();
    """
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Step 1
        page.goto(f"{NTA_BASE_URL}/hp001.php")
        page.click('a.icon01_text[href="hp001_01.php?doc=3"]')
        page.wait_for_load_state('networkidle')
        
        # Step 2
        print("[NAV] Đang click Tìm kiếm...")
        page.click('a#do_search_submit')
        page.wait_for_load_state('networkidle')
        print("[NAV] Đã vào trang danh sách kết quả.")
        
        # Loop list
        detail_links = []
        pageid = 1
        has_next = True
        while has_next and len(detail_links) < limit:
            soup = BeautifulSoup(page.content(), "html.parser")
            anchors = soup.find_all("a", href=re.compile(r"hp0201\.php.*baikyaku_no", re.IGNORECASE))
            for a in anchors:
                href = a["href"]
                if href not in detail_links:
                    detail_links.append(href)
            if len(detail_links) >= limit: break
            
            # Click next page
            next_a = page.locator(f"a[href^='hp0241.php'][href*='pageid={pageid+1}']")
            if next_a.count() > 0:
                pageid += 1
                next_a.first.click()
                page.wait_for_load_state('networkidle')
            else:
                has_next = False
                
        # Khởi tạo Memory Cache (Load toàn bộ tài sản đang Active)
        print("[Memory Cache] Đang tải toàn bộ dữ liệu từ CSDL vào RAM...")
        cur.execute('SELECT sale_unit_id FROM "Property" WHERE source_provider = %s AND bid_end_date > NOW() AND status = \'ACTIVE\'', ('NTA',))
        memory_cache_ids = {row[0] for row in cur.fetchall()}
        print(f"[Memory Cache] Đã tải {len(memory_cache_ids)} ID tài sản NTA.")
        
        detail_links = list(dict.fromkeys(detail_links))[:limit] # Deduplicate URLs
        
        # FAST SCAN DEDUPLICATION WITH MEMORY CACHE
        links_to_fetch = []
        all_scraped_ids = set()
        
        for relative_url in detail_links:
            match = re.search(r"baikyaku_no=([^&]+)", relative_url)
            if match:
                s_id = match.group(1)
                all_scraped_ids.add(s_id) # Theo dõi toàn bộ ID thấy trên trang
                if s_id not in memory_cache_ids:
                    links_to_fetch.append(relative_url)
                else:
                    print(f"[FAST SCAN NTA] Đã tồn tại trong Cache & còn hạn, bỏ qua: {s_id}")
                    
        # THỰC THI GHOST SWEEP BẰNG MEMORY TỐI ƯU O(1)
        ghost_ids = memory_cache_ids.difference(all_scraped_ids)
        if ghost_ids:
            print(f"[GHOST SWEEP NTA] Cảnh báo: Tìm thấy {len(ghost_ids)} tài sản đã biến mất khỏi Web. Đang lưu trữ...")
            cur.execute('UPDATE "Property" SET status = \'ARCHIVED\', updated_at = NOW() WHERE sale_unit_id IN %s', (tuple(ghost_ids),))
            conn.commit()
            print(f"[GHOST SWEEP NTA] Đã Archive thành công {len(ghost_ids)} tài sản.")
        else:
            print("[GHOST SWEEP NTA] Không có tài sản nào bị rớt đài.")
                
        print(f"[FAST SCAN NTA] Tổng web: {len(detail_links)}. Cần cào sâu: {len(links_to_fetch)} tài sản mới.")
        detail_links = links_to_fetch
        
        count_success = 0
        img_success = 0
        pin_success = 0
        
        for i, relative_url in enumerate(detail_links):
            sale_unit_id = re.search(r"baikyaku_no=([^&]+)", relative_url).group(1)
            print(f"\n[NTA-Test] {i+1}/{limit}: Đang cào tài sản ID {sale_unit_id}...")
            detail_url = f"{NTA_BASE_URL}/{relative_url}"
            page.goto(detail_url)
            page.wait_for_load_state('domcontentloaded')
            
            detail_soup = BeautifulSoup(page.content(), "html.parser")
            court_name = "NTA (Quốc thuế)"
            property_type = "Bất động sản (NTA)"
            address = "Unknown"
            price_val = None
            
            raw_display_data_dict = {
                "overview": {},
                "details": {},
                "contact": {}
            }
            
            gaiyou_div = detail_soup.find("div", id="gaiyou")
            raw_display_data_dict["overview"] = extract_table_data(gaiyou_div)
            
            syousai_divs = detail_soup.find_all("div", class_="syousai-kyotsu-01")
            details_dict = {}
            for div in syousai_divs:
                details_dict.update(extract_table_data(div))
            raw_display_data_dict["details"] = details_dict
            
            toiawase_div = detail_soup.find("div", id="toiawase")
            raw_display_data_dict["contact"] = extract_table_data(toiawase_div)
            
            overview = raw_display_data_dict["overview"]
            if "見積価額" in overview: price_val = parse_price(overview["見積価額"])
            elif "見積(売却)価額" in overview: price_val = parse_price(overview["見積(売却)価額"])
            
            if "所在地" in overview: address = overview["所在地"]
            elif "所在" in overview: address = overview["所在"]
            elif "住居表示等" in overview: address = overview["住居表示等"]
            
            if "財産種別" in overview: raw_category = overview["財産種別"]
            elif "主たる地目" in overview: raw_category = overview["主たる地目"]
            else: raw_category = None
            property_type = normalize_category(raw_category)
            
            raw_area = None
            parsed_area = None
            for key in ['面積（地積）合計', '面積（登記簿表示内容）', '床面積（登記簿表示内容）']:
                val = raw_display_data_dict["overview"].get(key) or raw_display_data_dict["details"].get(key)
                if val:
                    raw_area = val
                    parsed_area = clean_area_string(val)
                    break
            
            if sale_unit_id == '40260001':
                print(f"[Final-Check] ID: {sale_unit_id} | Raw Area: {raw_area} | Parsed Area: {parsed_area}")
                            
            # Process Images explicitly mapping correctly
            img_urls = []
            thumbnail_area = detail_soup.find("div", class_="thumbnail_list_area")
            if thumbnail_area:
                for img in thumbnail_area.find_all("img"):
                    orig_src = img.get("src", "")
                    if orig_src.startswith("./"): orig_src = orig_src[2:]
                    src_full = orig_src.replace("_s.jpg", ".jpg").replace("_s.png", ".png")
                    absolute_url = f"{NTA_BASE_URL}/{src_full}"
                    if absolute_url not in img_urls: img_urls.append(absolute_url)
            
            main_thumbnail = img_urls[0] if img_urls else None
            if main_thumbnail: img_success += 1
            print(f"[NTA-Test] Link ảnh thu được: {main_thumbnail}")
            
            if toiawase_div:
                nta_map_a = toiawase_div.find("a", href=re.compile(r"nta\.go\.jp/about/organization"))
                if nta_map_a: raw_display_data_dict["nta_map_link"] = nta_map_a["href"]
                
            etax_a = detail_soup.find("a", class_="tablet-only", href=re.compile(r"clientweb\.e-tax\.nta\.go\.jp"))
            if etax_a: raw_display_data_dict["etax_link"] = etax_a["href"]
            
            pdfs = extract_pdf_links(detail_soup)
            ai_analysis_res = None
            raw_text_val = None
            ai_status = "SKIPPED_AI"
            
            if pdfs:
                local_pdf_paths = []
                for pdf_url in pdfs:
                    try:
                        filename = f"nta_{sale_unit_id}_{os.path.basename(pdf_url)}"
                        fpath = os.path.join("/tmp/", filename)
                        print(f"  Downloading NTA PDF for analysis: {pdf_url}")
                        resp = requests.get(pdf_url, timeout=15)
                        with open(fpath, "wb") as f:
                            f.write(resp.content)
                        local_pdf_paths.append(fpath)
                    except: pass
                
                if local_pdf_paths:
                    if property_type in ["戸建て", "マンション"]:
                        print("[AI] Extracting text for NTA property...")
                        raw_text_val = extract_text_and_purge(local_pdf_paths)
                        ai_status = "PENDING_AI"
                    else:
                        print(f"[AI] Skipping AI analysis for type: {property_type}. Purging...")
                        for fpath in local_pdf_paths:
                            try: os.remove(fpath)
                            except: pass
                        ai_status = "SKIPPED_AI"

            pdf_json = json.dumps(pdfs, ensure_ascii=False) if pdfs else None
            ai_analysis_db = Json(ai_analysis_res) if ai_analysis_res else None

            # Store native JSON for psycopg2 to prevent double-stringify
            from psycopg2.extras import Json
            raw_data_json = Json(raw_display_data_dict) if raw_display_data_dict else None
            
            # Geocoding & Station Match
            lat, lng = geocode_address(address)
            if lat and lng: pin_success += 1
            print(f"[NTA-Test] Địa chỉ sau làm sạch: {address} -> Tọa độ OSM: ({lat}, {lng})")
            
            # Additional DB Fields Extraction
            # 1. Authority
            m_auth = raw_display_data_dict["overview"].get("実施局署")
            
            # 2. Bid Start/End Date
            b_end = raw_display_data_dict["overview"].get("入札期間")
            db_start_date, db_end_date = convert_reiwa_range_to_datetimes(b_end) if b_end else (None, None)
            
            # 3. Area is parsed_area from earlier
            db_area = round(parsed_area) if parsed_area else None
            
            # 4. Nearest Station via DB
            st_name, line_name, st_dist, st_time = get_nearest_station_from_db(lat, lng, cur)
            
            if sale_unit_id == '40260001':
                print(f"[System-Upgrade] ID: {sale_unit_id} | Area: {db_area} | Station: {st_name} | Walk: {st_time}min.")
            
            # Extract prefecture and city from address
            prefecture_val = None
            city_val = None
            m_pref = re.search(r'^(.{2,3}[都道府県])', address)
            if m_pref:
                prefecture_val = m_pref.group(1)
                m_city = re.search(r'(.{2,3}[都道府県])([^\s\u0021-\u00ff]+?(?:市|区|郡|町|村))', address)
                if m_city:
                    city_val = m_city.group(2)

            try:
                cur.execute(upsert_query, (
                    sale_unit_id, 'NTA', detail_url, court_name, property_type, address, price_val, lat, lng, 
                    pdf_json, main_thumbnail, img_urls, raw_data_json, db_area, db_start_date, db_end_date, 
                    m_auth, line_name, st_name, st_dist, st_time, ai_analysis_db, prefecture_val, city_val, ai_status, raw_text_val
                ))
                conn.commit()
                count_success += 1
                print(f"[NTA-Test] Đã lưu vào DB thành công.")
            except Exception as e:
                print(f"[NTA-Test] Lỗi lưu DB: {e}")
                conn.rollback()
                
            time.sleep(1)
            
        browser.close()
        
    cur.close()
    conn.close()
    
    print("\n====================================")
    print(f"BÁO CÁO: Đã cào {count_success}/{limit}. Số lượng hiện ảnh: {img_success}, Số lượng có ghim: {pin_success}")

if __name__ == "__main__":
    scrape_nta(9999)
