"""
BIT Active Auctions Crawler (Pure HTTP Requests - No Chromium)
==============================================================
Cào toàn diện danh sách và chi tiết các bất động sản phát mại (Keibai) đang mở thầu
từ hệ thống 50 Tòa án Nhật Bản (BIT):
- URL gốc: https://www.bit.courts.go.jp/app/top/pt001/h01
- Hub khu vực: /app/area/pk001/h01 (tabId=property, blockCls=01..08)
- Chọn tỉnh: /app/areaselect/ps002/h04
- Danh sách kết quả: /app/areaselect/ps002/h17
- Phân trang: /app/propertyresult/pr001/h04 (currentPage=2, 3...)
- Chi tiết tài sản: /app/propertyresult/pr001/h05
- Tải 3点セット PDF: /app/detail/pd001/h03 -> /app/detail/pd001/h04

Cơ chế:
- 100% Giả lập HTTP Request bằng requests.Session (Không cần Chromium / Playwright).
- Tiết kiệm 95% RAM (<35MB so với ~900MB của trình duyệt).
- Memory Cache O(1) deduplication: Bỏ qua các tài sản không đổi giá.
- Ghost Sweep O(1): Tự động ARCHIVED các tài sản đã rút hoặc đóng thầu.
- Trích xuất ảnh chụp thực tế từ 3点セット PDF (PyMuPDF) tải lên Cloudflare R2.
- Rate limit dịu êm (jitter 2.0s - 3.5s) chống nghẽn đường truyền và tránh block IP.
"""

import os
import sys
import re
import json
import time
import random
import unicodedata
import requests
import psycopg2
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from urllib.parse import urljoin
import io
try:
    import boto3
except ImportError:
    boto3 = None

try:
    import fitz
except ImportError:
    fitz = None

try:
    from PIL import Image
except ImportError:
    Image = None

# Đảm bảo in UTF-8 trên Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../web/.env'))
load_dotenv('/app/web/.env.local')
load_dotenv('/app/web/.env')

from crawler_utils import (
    clean_area_string,
    convert_reiwa_range_to_datetimes,
    get_nearest_station_from_db,
    get_random_user_agent,
    geocode_address
)

# Cấu hình lưu trữ ảnh cục bộ VPS (Nginx) & Cloudflare R2 Storage (fallback)
LOCAL_IMAGE_DIR = os.environ.get("LOCAL_IMAGE_DIR", "/var/www/keibai-images")
LOCAL_IMAGE_URL_PREFIX = os.environ.get("LOCAL_IMAGE_URL_PREFIX", "/vps-images")

r2_account_id = os.environ.get("R2_ACCOUNT_ID")
r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.environ.get("R2_BUCKET_NAME", "keibai-storage")
r2_public_url = os.environ.get("R2_PUBLIC_URL")

s3_client = None
if r2_account_id and r2_access_key and r2_secret_key:
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            region_name="auto"
        )
    except Exception as e:
        print(f"[R2] Cảnh báo kết nối S3/R2: {e}", flush=True)

db_url = os.environ.get("DATABASE_URL", "").split("?")[0]
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

STATE_FILE = os.path.join(os.path.dirname(__file__), "advanced_crawler_state.json")

def get_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"completed_courts": []}
    return {"completed_courts": []}

def save_state(completed_courts):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump({"completed_courts": completed_courts}, f, ensure_ascii=False)
    except Exception:
        pass

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
    if raw_data and isinstance(raw_data, list):
        if prop_type in ["戸建て", "土地", "農地", "山林", "宅地"]:
            temp_area = 0.0
            for section in raw_data:
                for k, v in section.get('data', {}).items():
                    if "土地面積（登記）" in k or "地積（登記）" in k or ("土地" in section.get('asset_title', '') and "面積" in k and "現況" not in k):
                        val = clean_area_string(v)
                        if val is not None:
                            temp_area += val
            if temp_area > 0:
                db_area = temp_area
        elif prop_type == "マンション":
            found_area = None
            for section in raw_data:
                if found_area is not None:
                    break
                for target in ["専有面積（登記）", "専有面積", "面積"]:
                    for k, v in section.get('data', {}).items():
                        if target in k and "現況" not in k and "バルコニー" not in k and "共用" not in k:
                            val = clean_area_string(v)
                            if val is not None:
                                found_area = val
                                break
                    if found_area is not None:
                        break
            db_area = found_area

    # Bid Start/End Date from raw_data
    db_start_date, db_end_date = None, None
    if raw_data and len(raw_data) > 0:
        summary_d = raw_data[0].get('data', {})
        for k, v in summary_d.items():
            if "入札期間" in k or "期間入札" in k:
                s_dt, e_dt = convert_reiwa_range_to_datetimes(v)
                if s_dt and e_dt:
                    db_start_date, db_end_date = s_dt, e_dt
                    break

    # Nearest Station Lookup
    st_name, line_name, st_dist, st_time = None, None, None, None
    if lat and lng:
        st_name, line_name, st_dist, st_time = get_nearest_station_from_db(lat, lng, cur)

    cur.execute('SELECT starting_price, status FROM "Property" WHERE sale_unit_id = %s', (sale_unit_id,))
    existing = cur.fetchone()

    if not existing:
        query = """INSERT INTO "Property" (
                    sale_unit_id, source_provider, court_name, property_type, address, prefecture, city, 
                    starting_price, lat, lng, pdf_url, raw_display_data, images, "thumbnailUrl", status, 
                    area, bid_start_date, bid_end_date, managing_authority, line_name, nearest_station, 
                    distance_to_station, walk_time_to_station, updated_at
                   )
                   VALUES (%s, 'BIT', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, 'ACTIVE', %s, %s, %s, %s, %s, %s, %s, %s, NOW())"""
        cur.execute(query, (
            sale_unit_id, court_name, prop_type, address, prefecture, city, 
            start_price, lat, lng, pdf_url, raw_data_json, final_images, thumbnail_url, 
            db_area, db_start_date, db_end_date, court_name, line_name, st_name, st_dist, st_time
        ))

        if start_price:
            hist_query = """INSERT INTO "AuctionHistory" (id, sale_unit_id, price, round_name, drop_percent) VALUES (gen_random_uuid(), %s, %s, %s, 0)"""
            cur.execute(hist_query, (sale_unit_id, start_price, "第1回または初期"))
    else:
        existing_price, existing_status = existing
        price_changed = existing_price and start_price and existing_price != start_price

        query = """UPDATE "Property" SET 
                    source_provider='BIT',
                    court_name=COALESCE(%s, court_name), property_type=COALESCE(%s, property_type), 
                    address=COALESCE(%s, address), prefecture=COALESCE(%s, prefecture), city=COALESCE(%s, city), 
                    starting_price=COALESCE(%s, starting_price), lat=COALESCE(%s, lat), lng=COALESCE(%s, lng), 
                    pdf_url=COALESCE(%s, pdf_url), raw_display_data=%s::jsonb, images=%s, "thumbnailUrl"=COALESCE(%s, "thumbnailUrl"), status='ACTIVE',
                    area=%s, bid_start_date=%s, bid_end_date=%s, managing_authority=%s, line_name=%s, nearest_station=%s, distance_to_station=%s, walk_time_to_station=%s,
                    updated_at=NOW() 
                   WHERE sale_unit_id = %s"""
        cur.execute(query, (
            court_name, prop_type, address, prefecture, city, start_price, lat, lng, 
            pdf_url, raw_data_json, final_images, thumbnail_url, db_area, db_start_date, 
            db_end_date, court_name, line_name, st_name, st_dist, st_time, sale_unit_id
        ))

        if price_changed:
            drop_percent = 0
            if existing_price > 0:
                drop_percent = float(existing_price - start_price) / float(existing_price) * 100.0
            hist_query = """INSERT INTO "AuctionHistory" (id, sale_unit_id, price, round_name, drop_percent) VALUES (gen_random_uuid(), %s, %s, %s, %s)"""
            cur.execute(hist_query, (sale_unit_id, start_price, "価格差分更新", round(drop_percent, 1)))

    conn.commit()
    cur.close()
    conn.close()

def extract_pdf_images(pdf_bytes, sale_unit_id):
    """Trích xuất ảnh chụp thực tế từ 3点セット PDF và lưu vào VPS local / Cloudflare R2"""
    global s3_client
    pdf_images = []
    if not pdf_bytes or len(pdf_bytes) < 1000:
        return pdf_images

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        # Duyệt từ cuối trang lên đầu trang (vì ảnh chụp thực tế thường nằm ở các trang cuối)
        for page_idx in range(len(doc) - 1, -1, -1):
            pdf_page = doc[page_idx]
            image_list = pdf_page.get_images(full=True)
            if not image_list:
                continue

            pix_color = pdf_page.get_pixmap(matrix=fitz.Matrix(1, 1))
            try:
                pil_color = Image.frombytes("RGB", [pix_color.width, pix_color.height], pix_color.samples)
            except ValueError:
                pil_color = Image.frombytes("RGBA", [pix_color.width, pix_color.height], pix_color.samples).convert("RGB")

            # Lọc bản vẽ kỹ thuật / văn bản giấy trắng mực đen
            sample = pil_color.resize((300, 300)).convert("L")
            hist = sample.histogram()
            hist_sorted = sorted(hist, reverse=True)
            top_30_sum = sum(hist_sorted[:30])
            concentration_ratio = top_30_sum / (300 * 300)

            # Nếu > 75% chỉ là nền giấy trắng phẳng -> Bỏ qua
            if concentration_ratio > 0.75:
                continue

            # Render chất lượng cao 200 DPI
            mat_high = fitz.Matrix(200 / 72, 200 / 72)
            pix_high = pdf_page.get_pixmap(matrix=mat_high, alpha=False)
            try:
                pil_high = Image.frombytes("RGB", [pix_high.width, pix_high.height], pix_high.samples)
            except ValueError:
                pil_high = Image.frombytes("RGBA", [pix_high.width, pix_high.height], pix_high.samples).convert("RGB")

            pil_high.thumbnail((1200, 1600))
            image_filename = f"{sale_unit_id}_p{page_idx}.webp"
            img_byte_arr = io.BytesIO()
            pil_high.save(img_byte_arr, format="WEBP", quality=80)
            img_bytes = img_byte_arr.getvalue()

            saved_to_r2 = False
            if s3_client and R2_BUCKET and r2_public_url:
                try:
                    s3_client.put_object(
                        Bucket=R2_BUCKET,
                        Key=f"properties/{sale_unit_id}/{image_filename}",
                        Body=img_bytes,
                        ContentType="image/webp"
                    )
                    public_img_url = f"{r2_public_url}/properties/{sale_unit_id}/{image_filename}"
                    pdf_images.append(public_img_url)
                    saved_to_r2 = True
                    print(f"      [R2 Upload] Đã tải ảnh: {image_filename}", flush=True)
                except Exception as up_e:
                    print(f"      [R2 Fallback -> VPS Local] R2 bucket không khả dụng ({up_e}), chuyển sang lưu trực tiếp trên VPS.", flush=True)
                    s3_client = None

            if not saved_to_r2 and (os.path.isdir(LOCAL_IMAGE_DIR) or LOCAL_IMAGE_DIR):
                try:
                    prop_dir = os.path.join(LOCAL_IMAGE_DIR, sale_unit_id)
                    os.makedirs(prop_dir, exist_ok=True)
                    out_path = os.path.join(prop_dir, image_filename)
                    with open(out_path, "wb") as f_img:
                        f_img.write(img_bytes)
                    public_img_url = f"{LOCAL_IMAGE_URL_PREFIX}/{sale_unit_id}/{image_filename}"
                    pdf_images.append(public_img_url)
                    print(f"      [VPS Save] Đã lưu ảnh: {image_filename}", flush=True)
                except Exception as fs_e:
                    print(f"      [VPS Save Error] {fs_e}", flush=True)

            if len(pdf_images) >= 5:
                break
        doc.close()
    except Exception as e:
        print(f"      [PDF Error] Không thể trích xuất ảnh PDF: {e}", flush=True)

    return pdf_images

def crawl_property_detail(session, item, prop_form_fields, prefecture):
    """Cào chi tiết 1 tài sản bằng HTTP POST /app/propertyresult/pr001/h05"""
    sale_unit_id = item["id"]
    court_id = item["court_id"]

    detail_payload = dict(prop_form_fields)
    detail_payload['saleUnitId'] = sale_unit_id
    detail_payload['detailCourtId'] = court_id
    detail_payload['transitionTabId'] = '1'

    r_det = session.post('https://www.bit.courts.go.jp/app/propertyresult/pr001/h05', data=detail_payload, timeout=25)
    if r_det.status_code != 200:
        print(f"    ❌ Lỗi tải chi tiết tài sản ID {sale_unit_id}: HTTP {r_det.status_code}", flush=True)
        return False

    soup = BeautifulSoup(r_det.text, 'html.parser')

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
            if src.startswith('/'):
                src = "https://www.bit.courts.go.jp" + src
            summary_images.append(src)

    for a_tag in soup.find_all('a', class_='bit__btn_secondary'):
        href = a_tag.get('href', '')
        if 'お問い合わせ' in a_tag.get_text() or 'info_' in href:
            base = "https://www.bit.courts.go.jp/app/detail/pd001/h04"
            summary_data["contact_url"] = urljoin(base, href)
            break

    div_tables = soup.select('div.table')
    for idx, dt in enumerate(div_tables):
        parent_fc = dt.find_parent('div', class_='form-contents')
        heading = ""
        if parent_fc:
            p_title = parent_fc.find('p', class_='bit__text_big')
            if p_title:
                heading = p_title.get_text(strip=True)
        if not heading:
            prev_header = dt.find_previous(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            heading = prev_header.get_text(strip=True) if prev_header else f'Section {idx}'

        ths = dt.select('div[class*="_th"]')
        tds = dt.select('div[class*="_td"]')
        is_summary = ("期間入札" in heading or "入札" in heading or "Section" in heading)

        if is_summary:
            for k in range(len(ths)):
                key = ths[k].get_text(strip=True)
                if key:
                    summary_data[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''
        else:
            asset_type = "Unknown"
            if "土地" in heading: asset_type = "土地"
            elif "建物" in heading: asset_type = "建物"
            data_dict = {}
            for k in range(len(ths)):
                key = ths[k].get_text(strip=True)
                if key:
                    data_dict[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''

            images = []
            context_node = dt.find_parent('div', class_='mb-3') or parent_fc
            if context_node:
                for img in context_node.find_all('img'):
                    src = img.get('src')
                    if not src or "icon" in src.lower() or "logo" in src.lower():
                        continue
                    if src.startswith('/'):
                        src = "https://www.bit.courts.go.jp" + src
                    elif src.startswith('.'):
                        src = "https://www.bit.courts.go.jp" + src.replace('../', '/')
                    images.append(src)

            if data_dict or images:
                raw_data.append({"asset_title": heading, "asset_type": asset_type, "data": data_dict, "images": images})

    if summary_data or summary_images:
        raw_data.insert(0, {"asset_title": "Summary", "asset_type": "Summary", "data": summary_data, "images": summary_images})

    # Tải 3点セット PDF và trích xuất ảnh
    has_pdf_button = bool(soup.select_one('#threeSetPDF'))
    pdf_images = []
    pdf_url = None

    if has_pdf_button:
        try:
            # Trigger PDF preparation
            r_prep = session.post(
                'https://www.bit.courts.go.jp/app/detail/pd001/h03',
                data={"courtId": court_id, "saleUnitId": sale_unit_id},
                timeout=15
            )
            if "success" in r_det.text or "success" in r_prep.text:
                pdf_download_url = f"https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId={court_id}&saleUnitId={sale_unit_id}"
                r_pdf = session.get(pdf_download_url, timeout=30)
                if r_pdf.status_code == 200 and r_pdf.content.startswith(b'%PDF'):
                    print(f"      [3点セット] Đã tải PDF thành công ({len(r_pdf.content):,} bytes). Đang trích xuất ảnh...", flush=True)
                    pdf_images = extract_pdf_images(r_pdf.content, sale_unit_id)
        except Exception as pdf_e:
            print(f"      [PDF Warning] Lỗi tải 3点セット: {pdf_e}", flush=True)

    final_images = []
    # Ưu tiên ảnh chụp ngoại quan / đại diện lấy từ nguồn web về (summary_images)
    if summary_images:
        for s_img in summary_images:
            if s_img not in final_images:
                final_images.append(s_img)
    # Sau đó mới bổ sung các ảnh bóc tách trích xuất từ PDF (pdf_images)
    for p_img in pdf_images:
        if p_img not in final_images:
            final_images.append(p_img)

    thumbnail_url = final_images[0] if final_images else None

    # Địa chỉ
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

    # Tên Tòa án
    court_name = "BIT (裁判所)"
    court_p = soup.select_one('.bit__text_big.d-sm-inline')
    if court_p:
        court_text = court_p.get_text(strip=True)
        if '　' in court_text:
            court_name = court_text.split('　')[0].replace("本庁", "")
        elif ' ' in court_text:
            court_name = court_text.split(' ')[0].replace("本庁", "")

    # Phân loại tài sản
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
        if any(x in combined_text for x in ["田", "畑", "農地"]):
            chimoku_agri = True
        if any(x in combined_text for x in ["宅地", "山林", "雑種地"]):
            chimoku_house = True

    building_kind = None
    for section in raw_data:
        title = section.get("asset_title", "")
        d_dict = section.get("data", {})
        combined_bld = title + " " + d_dict.get("種類（登記）", "") + " " + d_dict.get("種類（現況）", "") + " " + d_dict.get("種別", "")
        if any(x in combined_bld for x in ["旅館", "ホテル", "店舗"]):
            building_kind = "店舗・旅館"
        elif any(x in combined_bld for x in ["事務所", "オフィス", "ビル"]):
            building_kind = "事務所・ビル"
        elif any(x in combined_bld for x in ["工場", "倉庫"]):
            building_kind = "工場・倉庫"
        elif any(x in combined_bld for x in ["共同住宅", "アパート", "一棟"]):
            building_kind = "一棟マンション・アパート"

    if is_condo:
        prop_type_raw = "マンション"
    elif building_kind:
        prop_type_raw = building_kind
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

    # Tọa độ lat/lng
    lat, lng = geocode_address(address_raw, gemini_key)
    city_str = extract_city(address_raw, prefecture)

    check_and_update_db(
        sale_unit_id, pdf_url, raw_data, final_images, thumbnail_url,
        address_raw, start_price, court_name, prop_type_raw, lat, lng,
        prefecture, city_str, raw_text=None
    )
    print(f"    ✅ Lưu DB thành công: {address_raw} | {start_price:,}円 ({prop_type_raw})" if start_price else f"    ✅ Lưu DB: {address_raw}", flush=True)
    return True

def crawl_active_bit():
    if not db_url:
        print("[BIT Active] ❌ DATABASE_URL chưa được cấu hình!")
        return

    state = get_state()
    completed_courts = state.get("completed_courts", [])

    if "--force" in sys.argv or "--reset" in sys.argv:
        print("🔄 [RESET] Xóa checkpoint cũ, bắt đầu cào mới toàn bộ các tỉnh...", flush=True)
        save_state([])
        completed_courts = []

    session = requests.Session()
    session.headers.update({
        'User-Agent': get_random_user_agent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    })

    print("[BIT Active Pure Requests] Bắt đầu cào toàn quốc (No-Chromium)...", flush=True)

    # 1. Thu thập danh sách các Tòa án / Tỉnh thành từ 8 Region
    all_prefectures = []
    # Map regions
    # Block 01: Hokkaido (91, 92, 93, 94)
    # Block 02: Tohoku (02..07)
    # Block 03: Kanto (08..14)
    # Block 04: Hokuriku (15..20)
    # Block 05: Tokai (21..24)
    # Block 06: Kinki (25..30)
    # Block 07: Chugoku (31..35)
    # Block 08: Shikoku (36..39)
    # Block 09: Kyushu/Okinawa (40..47)
    region_blocks = [
        ("01", ["91", "92", "93", "94"]),
        ("02", ["02", "03", "04", "05", "06", "07"]),
        ("03", ["08", "09", "10", "11", "12", "13", "14"]),
        ("04", ["15", "16", "17", "18", "19", "20"]),
        ("05", ["21", "22", "23", "24"]),
        ("06", ["25", "26", "27", "28", "29", "30"]),
        ("07", ["31", "32", "33", "34", "35"]),
        ("08", ["36", "37", "38", "39"]),
        ("09", ["40", "41", "42", "43", "44", "45", "46", "47"])
    ]

    hokkaido_scraped_ids = set()

    for block_cls, pref_ids in region_blocks:
        print(f"\n==========================================", flush=True)
        print(f"=== Bắt đầu Region {block_cls} ===", flush=True)
        print(f"==========================================", flush=True)

        try:
            session.get('https://www.bit.courts.go.jp/app/top/pt001/h01', timeout=15)
            session.post('https://www.bit.courts.go.jp/app/area/pk001/h01', data={'tabId': 'property', 'blockCls': block_cls}, timeout=15)
        except Exception as e:
            print(f"❌ Lỗi khởi tạo Region {block_cls}: {e}", flush=True)
            continue

        for pref_id in pref_ids:
            pref_name = PREF_MAP.get(pref_id, f"Pref_{pref_id}")
            checkpoint_key = f"{block_cls}_{pref_id}_{pref_name}"
            
            if checkpoint_key in completed_courts:
                print(f"  -> Bỏ qua tỉnh (Đã hoàn thành trong phiên): {pref_name} ({pref_id})", flush=True)
                continue

            print(f"\n  -> [Tỉnh thành] Đang cào tài sản đang mở thầu: {pref_name} ({pref_id})...", flush=True)

            # Khởi tạo Memory Cache cho tỉnh
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute('SELECT sale_unit_id, starting_price FROM "Property" WHERE prefecture = %s AND status = %s AND source_provider = %s AND COALESCE(array_length(images, 1), 0) > 1', (pref_name, 'ACTIVE', 'BIT'))
            memory_cache_prices = {row[0]: row[1] for row in cur.fetchall()}
            cur.close()
            conn.close()

            prefecture_scraped_ids = set()
            print(f"    [Memory Cache] Đã nạp {len(memory_cache_prices)} ID có sẵn cho {pref_name}", flush=True)

            try:
                # Step 1: Chọn tỉnh h04
                r_h04 = session.post(
                    'https://www.bit.courts.go.jp/app/areaselect/ps002/h04',
                    data={'prefecturesId': pref_id, 'searchType': '2', 'blockCls': block_cls, 'tabId': 'property'},
                    timeout=20
                )
                soup_h04 = BeautifulSoup(r_h04.text, 'html.parser')
                form_search = soup_h04.find('form', id='searchareaselectForm')

                if not form_search:
                    print(f"    [Thông báo] Không tìm thấy form tìm kiếm cho {pref_name}.", flush=True)
                    continue

                search_data = {inp.get('name'): inp.get('value', '') for inp in form_search.find_all('input') if inp.get('name')}
                search_data['saleCls'] = ['1', '2', '3', '4']

                # Step 2: Gửi tìm kiếm h17
                r_h17 = session.post('https://www.bit.courts.go.jp/app/areaselect/ps002/h17', data=search_data, timeout=25)
                soup_results = BeautifulSoup(r_h17.text, 'html.parser')

                # Step 3: Bóc tách 100% danh sách tài sản từ form ẩn resultList (không cần phân trang)
                prop_form = soup_results.find('form', id='propertyResultForm')
                prop_form_fields = {}
                result_list_map = {}

                if prop_form:
                    for inp in prop_form.find_all('input'):
                        name = inp.get('name', '')
                        if not name:
                            continue
                        val = inp.get('value', '')
                        m_res = re.match(r'^resultList\[(\d+)\]\.(.+)$', name)
                        if m_res:
                            idx, field = int(m_res.group(1)), m_res.group(2)
                            if idx not in result_list_map:
                                result_list_map[idx] = {}
                            result_list_map[idx][field] = val
                        else:
                            prop_form_fields[name] = val

                all_items = []
                for idx in sorted(result_list_map.keys()):
                    entry = result_list_map[idx]
                    s_id = entry.get('saleUnitId', '').strip()
                    c_id = entry.get('courtId', '').strip()
                    if not s_id or not c_id:
                        continue
                    price_str = entry.get('saleStandardAmount', '')
                    price_num = int(re.sub(r'[^\d]', '', price_str)) if price_str and re.sub(r'[^\d]', '', price_str) else None
                    all_items.append({
                        "id": s_id,
                        "court_id": c_id,
                        "price": price_num
                    })

                # Fallback nếu BIT thay đổi cấu trúc không có resultList
                if not all_items:
                    cards = soup_results.select('.bit__searchResult, .bit__searchResult_item')
                    for card in cards:
                        a_detail = card.find('a', onclick=lambda o: o and 'tranPropertyDetail' in o)
                        if not a_detail:
                            continue
                        onclick = a_detail.get('onclick', '')
                        m = re.search(r'tranPropertyDetail\s*\(\s*["\']([^"\']+)["\']\s*,\s*["\']([^"\']+)["\']', onclick)
                        if not m:
                            continue
                        s_id, c_id = m.group(1), m.group(2)
                        price_p = card.select_one('.bit_ichiran_text_kakaku, .bit__ichiran_text_kakaku')
                        price_num = int(re.sub(r'[^\d]', '', price_p.get_text(strip=True))) if price_p and re.sub(r'[^\d]', '', price_p.get_text(strip=True)) else None
                        all_items.append({
                            "id": s_id,
                            "court_id": c_id,
                            "price": price_num
                        })

                if not all_items:
                    print(f"    [Thông báo] Hiện không có tài sản nào đang mở thầu ở {pref_name}.", flush=True)
                else:
                    print(f"    -> Phát hiện tổng cộng {len(all_items)} tài sản đang mở thầu ở {pref_name}.", flush=True)

                    # Lọc Fast Scan Deduplication
                    for item in all_items:
                        s_id = item["id"]
                        prefecture_scraped_ids.add(s_id)

                        if s_id in memory_cache_prices:
                            old_price = memory_cache_prices[s_id]
                            new_price = item["price"]
                            if new_price and old_price and new_price != old_price:
                                print(f"      [FAST SCAN] Phát hiện thay đổi giá: {s_id} ({old_price:,} -> {new_price:,}円)", flush=True)
                            else:
                                continue  # Đã có trong cache & không đổi giá -> BỎ QUA

                        print(f"      [Deep Crawl] Đang cào sâu tài sản mới/đổi giá ID: {s_id}...", flush=True)
                        try:
                            crawl_property_detail(session, item, prop_form_fields, pref_name)
                        except Exception as c_err:
                            print(f"      ❌ Lỗi cào chi tiết ID {s_id}: {c_err}", flush=True)

                        # Nghỉ nhẹ nhàng 1.5s - 2.5s giữa các tài sản
                        time.sleep(random.uniform(1.5, 2.5))

                # Ghost sweep cho tỉnh (Gom toàn bộ 4 khu vực của Hokkaido trước khi quét Ghost)
                if pref_name == "北海道":
                    hokkaido_scraped_ids.update(prefecture_scraped_ids)
                    should_sweep = (pref_id == "94")
                    effective_scraped = hokkaido_scraped_ids
                else:
                    should_sweep = True
                    effective_scraped = prefecture_scraped_ids

                if should_sweep:
                    ghost_ids = set(memory_cache_prices.keys()) - effective_scraped
                    if ghost_ids:
                        print(f"    [GHOST SWEEP BIT] Cảnh báo: Tìm thấy {len(ghost_ids)} tài sản đã biến mất ở {pref_name}. Đang lưu trữ...", flush=True)
                        conn = get_db_connection()
                        cur = conn.cursor()
                        cur.execute('UPDATE "Property" SET status = %s, updated_at = NOW() WHERE sale_unit_id IN %s', ('ARCHIVED', tuple(ghost_ids)))
                        conn.commit()
                        cur.close()
                        conn.close()
                        print(f"    [GHOST SWEEP BIT] Đã Archive thành công {len(ghost_ids)} tài sản.", flush=True)

                completed_courts.append(checkpoint_key)
                save_state(completed_courts)

            except Exception as e:
                print(f"    ❌ Lỗi cào tỉnh {pref_name}: {e}", flush=True)

            # Nghỉ 2s - 3s giữa các tỉnh
            time.sleep(random.uniform(2.0, 3.0))

    print("\n==========================================", flush=True)
    print("HOÀN THÀNH TOÀN BỘ CÀO TÀI SẢN ACTIVE BIT (Pure Requests)", flush=True)
    print("==========================================", flush=True)
    save_state([]) # Reset checkpoint cho lượt chạy ngày hôm sau

if __name__ == "__main__":
    crawl_active_bit()
