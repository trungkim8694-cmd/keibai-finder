#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Set

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SEEDS = [
    "競売",
    "けいばい",
    "競売物件",
    "不動産競売",
    "裁判所 競売",
    "公売",
    "国税庁 公売",
    "3点セット 競売",
    "特別売却 競売",
    "競売 落札相場",
    "競売 マンション",
    "競売 戸建て",
    "競売 不動産投資",
]

def fetch_suggs(q):
    url = f"https://suggestqueries.google.com/complete/search?client=chrome&hl=ja&gl=jp&q={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='replace'))
            if data and len(data) > 1 and isinstance(data[1], list):
                return data[1]
    except Exception:
        pass
    return []

all_kws = set()
for seed in SEEDS:
    res = fetch_suggs(seed)
    for k in res:
        all_kws.add(k)
    for sub in [" おすすめ", " 一覧", " 相場", " 初心者", " とは"]:
        r2 = fetch_suggs(f"{seed}{sub}")
        for k in r2:
            all_kws.add(k)

print(f"TOTAL_LIVE_GOOGLE_KEYWORDS: {len(all_kws)}", flush=True)

# Trích xuất các từ khóa theo search volume ước tính và intent
categorized = {
    "Transactional (Tìm mua BĐS)": [],
    "Commercial (Đầu tư & Giá rẻ)": [],
    "Procedural & Legal (Thủ tục & 3点セット)": [],
    "Regional (Địa phương)": [],
    "Koubai (Công bán)": []
}

for k in sorted(all_kws):
    if any(x in k for x in ["公売", "国税", "官公庁"]):
        categorized["Koubai (Công bán)"].append(k)
    elif any(x in k for x in ["東京", "大阪", "埼玉", "神奈川", "千葉", "福岡", "名古屋", "横浜", "地裁"]):
        categorized["Regional (Địa phương)"].append(k)
    elif any(x in k for x in ["3点", "流れ", "入札", "特別売却", "期間入札", "立ち退き", "占有", "住宅ローン"]):
        categorized["Procedural & Legal (Thủ tục & 3点セット)"].append(k)
    elif any(x in k for x in ["利回り", "相場", "落札価格", "投資", "格安", "安い", "ボロ戸建て", "再建築不可"]):
        categorized["Commercial (Đầu tư & Giá rẻ)"].append(k)
    else:
        categorized["Transactional (Tìm mua BĐS)"].append(k)

for cat, lst in categorized.items():
    print(f"\n=== {cat} ({len(lst)} kws) ===", flush=True)
    for item in lst[:15]:
        print(f"  • {item}", flush=True)
