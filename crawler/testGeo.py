import os
from dotenv import load_dotenv
import requests
import json

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
gemini_key = os.environ.get("GEMINI_API_KEY")

prompt = "Convert this Japanese real estate address to latitude and longitude. Return ONLY a valid JSON object with keys 'lat' and 'lng' as float numbers. Do not include markdown. Address: 苫前郡苫前町字古丹別 １７６番３７"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
headers = {'Content-Type': 'application/json'}
payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json"}}
res = requests.post(url, headers=headers, json=payload, timeout=15)
print(res.status_code)
print(res.text)
