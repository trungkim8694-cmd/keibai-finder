import os
import subprocess
import time

def run_test():
    print("=== BẮT ĐẦU CHẠY CRAWLER DRY RUN ===")
    
    # Clean previous state if exists
    if os.path.exists("advanced_crawler_state.json"):
        os.remove("advanced_crawler_state.json")

    original_code = ""
    with open("advanced_crawler.py", "r", encoding="utf-8") as f:
        original_code = f.read()
    
    # Modify advanced crawler to break at 20 total items
    test_code = original_code.replace("total_items = int(total_text.replace(',', '').strip())", "total_items = min(20, int(total_text.replace(',', '').strip()))")
    
    with open("advanced_crawler.py", "w", encoding="utf-8") as f:
        f.write(test_code)
        
    try:
        print(">>>>> ĐANG CÀO BIT (Giới hạn 20 tài sản)...")
        subprocess.run(["/Users/kimtrung/keibai-finder/crawler/venv/bin/python", "advanced_crawler.py"])
    except KeyboardInterrupt:
        print("Đã dừng khẩn cấp BIT")
    finally:
        # Revert changes immediately
        with open("advanced_crawler.py", "w", encoding="utf-8") as f:
            f.write(original_code)
            
    print("\n>>>>> ĐANG CÀO NTA (Giới hạn 20 tài sản)...")
    try:
        cmd = """
import nta_parser
nta_parser.scrape_nta(limit=20)
"""
        with open("run_nta_limit.py", "w") as f:
            f.write(cmd)
        subprocess.run(["/Users/kimtrung/keibai-finder/crawler/venv/bin/python", "run_nta_limit.py"])
        os.remove("run_nta_limit.py")
    except Exception as e:
        print(f"Lỗi NTA: {e}")

        # Bỏ qua thử nghiệm tiến trình AI theo yêu cầu của phiên bản hiện tại
        
    print("=== HOÀN TẤT QUÁ TRÌNH DRY RUN! ===")

if __name__ == "__main__":
    run_test()
