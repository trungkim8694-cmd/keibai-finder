import os
import requests
from dotenv import load_dotenv

load_dotenv("/app/web/.env")

def send_telegram_message(message):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("Telegram tokens not set in .env. Skipping notification.")
        return
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        res.raise_for_status()
    except Exception as e:
        error_details = e.response.text if hasattr(e, 'response') and e.response else str(e)
        print(f"Failed to send Telegram message: {error_details}")

import sys

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "🤖 <b>Test Message:</b> Keibai crawler notification system is online."
    send_telegram_message(msg)
