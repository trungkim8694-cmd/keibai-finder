import os
import json
import time
import psycopg2
import traceback
import google.generativeai as genai
from dotenv import load_dotenv

env_path = "/Users/kimtrung/keibai-finder/web/.env"
load_dotenv(env_path)

db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("?schema=public", "")

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Missing GEMINI_API_KEY in .env")
    exit(1)

genai.configure(api_key=api_key)

SYSTEM_PROMPT = """Read the real estate Japanese PDF text and analyze it. 
Output STRICTLY a JSON object with 3 keys: 'ja', 'en', 'vi'.
Each language key must contain an object with EXACTLY these 4 keys:
1. 'risk_analysis' (object): Must contain 'issues' (array of strings, listing legal risks, occupancy issues, etc).
2. 'estimated_costs' (object): 'arrears' (number), 'eviction_cost' (number), 'repair_estimate' (number). 
   IMPORTANT: Use Japanese Yen (JPY). E.g., 500000.
3. 'winning_price_analysis' (object): 'estimated_winning_price' (number), 'reasoning' (string).
   IMPORTANT: Use Japanese Yen (JPY). E.g., 8500000.
4. 'roi_analysis' (object): 'yield_percent' (number, percentage E.g. 8.5), 'profit_vs_base_price' (number).
   IMPORTANT: 'profit_vs_base_price' is absolute profit in Japanese Yen (JPY). E.g., 3000000.
Return raw JSON ONLY. No markdown wrapping.
"""

def process_queue():
    if not db_url: return
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Kéo 50 records đang kẹt PENDING_AI
    cur.execute("SELECT sale_unit_id, raw_text, starting_price, property_type FROM \"Property\" WHERE ai_status = 'PENDING_AI' AND raw_text IS NOT NULL LIMIT 50")
    rows = cur.fetchall()
    
    if not rows:
        cur.close()
        conn.close()
        return

    print(f"[Queue] Picked up {len(rows)} properties for AI inference...")

    try:
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview", system_instruction=SYSTEM_PROMPT, generation_config={"response_mime_type": "application/json"})
    except Exception:
        # Fallback to 2.0 Flash Lite if 3.1 fails to initialize
        model = genai.GenerativeModel("gemini-2.0-flash-lite", system_instruction=SYSTEM_PROMPT, generation_config={"response_mime_type": "application/json"})
    
    for sale_unit_id, raw_text, starting_price, property_type in rows:
        print(f"[AI] Inferencing ID: {sale_unit_id}...")
        try:
            # Context injection
            context = f"Property Context:\n- Case ID: {sale_unit_id}\n- Starting Price (Court Valuation): {starting_price} JPY\n- Property Type: {property_type}\n\n"
            
            # Clean/cap text
            safe_text = context + raw_text[:180000]
            
            response = model.generate_content(safe_text)
            ai_data_json = response.text.strip()
            
            # test parse ensure it is valid JSON
            ai_data = json.loads(ai_data_json)
            
            # update
            cur.execute("""
                UPDATE "Property" 
                SET ai_analysis = %s::jsonb, ai_status = 'COMPLETED_AI', updated_at = NOW() 
                WHERE sale_unit_id = %s
            """, (json.dumps(ai_data, ensure_ascii=False), sale_unit_id))
            conn.commit()
            print(f"  -> SUCCESS! Marked as COMPLETED_AI.")
            
        except Exception as e:
            conn.rollback()
            print(f"  -> ERROR processing {sale_unit_id}: {e}")
            # Keep it PENDING_AI to fail-safe and retry next loop
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    print("Starting AI Queue Worker (Ctrl+C to stop)...")
    while True:
        try:
            process_queue()
        except Exception as e:
            print(f"Worker crashed: {e}")
            traceback.print_exc()
        time.sleep(15) # Polling interval
