import os
import sys
import json
import random
import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from web/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'web', '.env')
load_dotenv(dotenv_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GEMINI_API_KEY or not DATABASE_URL:
    print("Error: Missing GEMINI_API_KEY or DATABASE_URL")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
# Switch to valid model name
model = genai.GenerativeModel('gemini-2.5-flash')

PROMPT_TEMPLATES = [
    {
        "type": "BREAKING_NEWS",
        "description": "Bản tin chớp nhoáng, báo động về thị trường bắt đáy."
    },
    {
        "type": "FINANCIAL_BLOOMBERG",
        "description": "Phân tích giá trị đầu tư, lợi suất ROI, chuyên sâu tài chính."
    },
    {
        "type": "LOCAL_TREND",
        "description": "Phóng sự về xu hướng chuyển dịch, tại sao khu vực này lại đáng mua lúc này."
    },
    {
        "type": "STORIES",
        "description": "Câu chuyện trải nghiệm, khuyên dùng cho người trẻ hoặc nhà đầu tư mới."
    },
    {
        "type": "AGGRESSIVE_DEALS",
        "description": "So sánh khốc liệt giữa giá MLIT và giá Keibai, chỉ ra món hời siêu tốc."
    }
]

def fetch_top_properties(conn):
    """
    Nhịp 1: Fetch Top 10 BĐS Hot & Margin > 20%
    """
    query = """
        SELECT sale_unit_id, prefecture, city, address, property_type, 
               managing_authority, starting_price, mlit_estimated_price, mlit_investment_gap
        FROM "Property"
        WHERE status = 'ACTIVE' 
          AND property_type IN ('戸建て', 'マンション')
          AND mlit_investment_gap >= 15 
          AND mlit_investment_gap <= 50
        ORDER BY RANDOM()
        LIMIT 10;
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query)
        rows = cur.fetchall()
        
    return [dict(r) for r in rows]

def generate_japanese_content(properties):
    """
    Nhịp 2: Gọi Gemini sinh ra bài báo tiếng Nhật với cấu trúc Markdown
    """
    template = random.choice(PROMPT_TEMPLATES)
    print(f"Selected Template: {template['type']}")
    
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    props_json = json.dumps(properties, ensure_ascii=False, indent=2, default=str)
    
    prompt = f"""
    Bạn là một chuyên gia phân tích Bất Động Sản Đấu Giá (Keibai) tại Nhật Bản.
    Hôm nay là ngày {date_str}. Tôi có danh sách các tài sản đấu giá đang rớt giá thảm hại (Biên lợi nhuận / Margin cao hơn 20% so với giá thị trường MLIT).
    
    Văn phong yêu cầu: {template['description']}
    Giọng điệu: Hấp dẫn, khơi gợi FOMO, số liệu rõ ràng. Đóng vai trò là bản báo cáo hàng ngày (Daily Digest).
    
    Dữ liệu tài sản (JSON):
    {props_json}
    
    YẾU CẦU ĐỊNH DẠNG ĐẦU RA (Output Format):
    - Trả về ĐÚNG MỘT BÀI BÁO BẰNG TIẾNG NHẬT, định dạng MARKDOWN.
    - Cấu trúc: 
        - Đầu bài: Mở bài (H1) và phần giới thiệu thị trường hôm nay (Intro).
        - Thân bài: Gom nhóm phân tích theo Tỉnh thành (Header 2 H2). Ví dụ: `## 埼玉県 (Saitama)`
        - Các BĐS bên trong tỉnh thành: (Header 3 H3) Địa chỉ / Loại hình.
        - TUYỆT ĐỐI quan trọng: Bạn PHẢI chèn một thẻ biến ẩn sau mỗi phần phân tích của một BĐS để tôi gắn biểu đồ: `{{{{CHART_ID="[sale_unit_id]"}}}}`.
          Ví dụ: `{{{{CHART_ID="BIT_12345"}}}}` (Phải đúng sale_unit_id của tài sản).
        - Cuối cùng: Chốt lại toàn bộ báo cáo và kết luận kêu gọi hành động.
    
    Đừng nói lời thừa thãi, chỉ bắt đầu trả về Markdown:
    """
    
    response = model.generate_content(prompt)
    return response.text

def translate_content(ja_markdown):
    """
    Nhịp 3: Đưa Article tiếng Nhật cho Gemini dịch ra 3 ngôn ngữ EN, VI, ZH song song (JSON)
    """
    prompt = f"""
    Bạn có nhiệm vụ dịch bản báo cáo thị trường Bất Động Sản (dạng Markdown) từ tiếng Nhật sang Tiếng Anh, Tiếng Việt, và Tiếng Trung Quốc.
    
    LƯU Ý CỰC KỲ QUAN TRỌNG:
    - BẢO TOÀN TUYỆT ĐỐI các biến như `{{{{CHART_ID="XYZ"}}}}` và `{{{{CTA_MAP_SEARCH}}}}`. Không được dịch, sửa, hay thay đổi những thẻ này vào bất kỳ ngôn ngữ nào.
    - Giữ nguyên cấu trúc Markdown (H1, H2, H3, dấu bôi đậm, danh sách).
    
    Nội dung gốc (Tiếng Nhật):
    ```markdown
    {ja_markdown}
    ```
    
    BẠN VUI LÒNG TRẢ VỀ CHUẨN JSON VỚI ĐỊNH DẠNG SAU (Không trả về Markdown bọc ngoài, chỉ trả JSON object):
    {{
      "title_en": "Tự trích xuất Tiêu đề chính H1 và dịch sang EN",
      "title_vi": "Tự trích xuất Tiêu đề chính H1 và dịch sang VI",
      "title_zh": "Tự trích xuất Tiêu đề chính H1 và dịch sang ZH",
      
      "content_en": "Toàn bộ bài dịch tiếng Anh (có markdown)",
      "content_vi": "Toàn bộ bài dịch tiếng Việt (có markdown)",
      "content_zh": "Toàn bộ bài dịch tiếng Trung (có markdown)"
    }}
    """
    response = model.generate_content(
        prompt, 
        generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
    )
    
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error parsing JSON from translation LLM: {e}")
        # fallback
        return None

def extract_title_ja(markdown_text):
    for line in markdown_text.split('\n'):
        if line.startswith('# '):
            return line.replace('# ', '').strip()
    return "Keibai Market Daily Report"

def save_to_database(conn, properties, content_ja, translations):
    """
    Nhịp 4: Lưu vào DailyDigest
    """
    date_slug = datetime.datetime.now().strftime("%Y-%m-%d-%H%M")
    slug = f"top-deals-{date_slug}"
    title_ja = extract_title_ja(content_ja)
    
    # Tạo mảng Tags từ dữ liệu Property
    tags = list(set([p['prefecture'] for p in properties if p['prefecture']] + ["daily-digest", "market-insights"]))
    
    insert_query = """
        INSERT INTO "DailyDigest" (
            id, slug, "publishDate",
            title_ja, title_en, title_vi, title_zh,
            content_ja, content_en, content_vi, content_zh,
            tags, created_at, updated_at
        ) VALUES (
            gen_random_uuid()::text, %s, NOW(),
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, NOW(), NOW()
        )
    """
    
    values = (
        slug,
        title_ja, translations.get('title_en', ''), translations.get('title_vi', ''), translations.get('title_zh', ''),
        content_ja, translations.get('content_en', ''), translations.get('content_vi', ''), translations.get('content_zh', ''),
        tags
    )
    
    with conn.cursor() as cur:
        cur.execute(insert_query, values)
        conn.commit()
        
    print(f"✅ Đã lưu Daily Digest thành công. Slug: {slug}")

def main():
    print("--- [DAILY DIGEST ENGINE START] ---")
    try:
        # 1. Connect DB
        db_url_clean = DATABASE_URL.replace("?pgbouncer=true", "")
        conn = psycopg2.connect(db_url_clean)
        
        # 2. Lấy Properties
        top_props = fetch_top_properties(conn)
        if not top_props:
            print("Không tìm thấy Properties có margin > 20% trong kho. Bỏ qua.")
            sys.exit(1)

        print(f"[1] Lọc được {len(top_props)} tài sản.")
        
        # 3. Yêu cầu AI viết bằng tiếng Nhật (Markdown)
        print("[2] Khởi chạy Gemini tạo Article (Japanese)...")
        ja_content = generate_japanese_content(top_props)
        
        if not ja_content or len(ja_content) < 100:
            print("Gemini sinh nội dung lỗi (Trống).")
            sys.exit(1)
        
        print("[3] Bài viết OK. Khởi chạy Translation Worker sinh JSON (EN, VI, ZH)...")
        translations = translate_content(ja_content)
        
        if not translations:
             print("Lỗi khi Dịch thuật.")
             sys.exit(1)
             
        # 4. Lưu DB
        print("[4] Đẩy dữ liệu lên Prisma Database...")
        save_to_database(conn, top_props, ja_content, translations)
        
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    main()
