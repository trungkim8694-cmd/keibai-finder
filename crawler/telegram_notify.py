import os
import sys
import urllib.parse
import requests
from dotenv import load_dotenv

# Đảm bảo nạp các file .env từ nhiều vị trí linh hoạt
script_dir = os.path.dirname(__file__)
load_dotenv(os.path.join(script_dir, '../web/.env.local'))
load_dotenv(os.path.join(script_dir, '../web/.env'))
load_dotenv('/app/web/.env.local')
load_dotenv('/app/web/.env')

def send_telegram_message(message):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("[Telegram] ⚠️ TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID chưa được cấu hình. Bỏ qua gửi thông báo.")
        return False
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    # Xử lý ký tự xuống dòng (%0A) nếu truyền từ bash script
    clean_message = urllib.parse.unquote_plus(str(message))
    
    payload = {
        "chat_id": chat_id,
        "text": clean_message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    
    try:
        res = requests.post(url, json=payload, timeout=15)
        res.raise_for_status()
        print(f"[Telegram] ✅ Đã gửi báo cáo thành công về Telegram chat_id={chat_id}")
        return True
    except Exception as e:
        error_details = e.response.text if hasattr(e, 'response') and e.response else str(e)
        print(f"[Telegram] ❌ Lỗi khi gửi thông báo: {error_details}")
        return False

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "🤖 <b>Test Message:</b> Keibai crawler notification system is online."
    send_telegram_message(msg)
