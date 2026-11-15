#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
keibai_keyword_researcher.py
-----------------------------
Công cụ nghiên cứu từ khóa ngành Bất Động Sản Đấu Giá Nhật Bản (Keibai & Koubai).
Kết hợp Google Japan Suggestion Engine (Live) + Database xu hướng KeibaiTrendEngine + GSC/Bing metrics.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Set, Any

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Danh sách từ khóa hạt giống (Seed Keywords) của ngành BĐS Đấu giá Nhật Bản
SEEDS = [
    "競売",
    "けいばい",
    "競売物件",
    "不動産競売",
    "裁判所 競売",
    "公売",
    "国税庁 公売",
    "官公庁オークション",
    "3点セット 競売",
    "特別売却 競売",
    "期間入札",
    "競売 落札相場",
    "競売 マンション",
    "競売 戸建て",
    "競売 不動産投資",
]

HIRAGANA_SUFFIXES = [
    "", "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ"
]

def fetch_google_suggestions(query: str) -> List[str]:
    """Gọi Google Japan Suggestion API (client=chrome, hl=ja, gl=jp)"""
    url = f"https://suggestqueries.google.com/complete/search?client=chrome&hl=ja&gl=jp&q={urllib.parse.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='replace'))
            if data and len(data) > 1 and isinstance(data[1], list):
                return [s for s in data[1] if isinstance(s, str)]
    except Exception:
        pass
    return []

def main():
    print("==============================================================================")
    print("🔍 [KEIBAI KEYWORD RESEARCHER] Bắt đầu quét từ khóa Google Japan Search Engine")
    print("==============================================================================")
    
    unique_keywords: Set[str] = set()
    seed_results: Dict[str, List[str]] = {}

    for seed in SEEDS:
        print(f"-> Quét hạt giống: 「{seed}」...")
        direct_suggs = fetch_google_suggestions(seed)
        seed_results[seed] = direct_suggs
        for s in direct_suggs:
            unique_keywords.add(s)
        time.sleep(0.15)
        
        # Quét mở rộng với Hiragana alphabet
        for char in ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"]:
            sub_query = f"{seed} {char}"
            subs = fetch_google_suggestions(sub_query)
            for s in subs:
                unique_keywords.add(s)
            time.sleep(0.1)

    print(f"\n✅ Đã thu thập {len(unique_keywords)} từ khóa tìm kiếm thực tế từ người dùng Nhật Bản!")

    # Phân nhóm Intent (Ý định tìm kiếm)
    clusters = {
        "1. TRANSACTIONAL (Tìm kiếm & Mua BĐS cụ thể)": [],
        "2. COMMERCIAL (Đầu tư, Sinh lời, So sánh giá)": [],
        "3. PROCEDURAL & LEGAL (Quy trình, 3点セット, Thủ tục tòa án)": [],
        "4. REGIONAL & REGIONAL INTENT (Theo Tỉnh thành, Ga tàu, Khu vực)": [],
        "5. KOUBAI & PUBLIC TAX (Công bán thuế, Nhà nước)": []
    }

    for kw in sorted(unique_keywords):
        kw_lower = kw.lower()
        if any(w in kw for w in ["公売", "国税", "官公庁", "税務署", "ksi"]):
            clusters["5. KOUBAI & PUBLIC TAX (Công bán thuế, Nhà nước)"].append(kw)
        elif any(w in kw for w in ["東京", "大阪", "埼玉", "神奈川", "千葉", "福岡", "名古屋", "札幌", "横浜", "京都", "駅", "地裁"]):
            clusters["4. REGIONAL & REGIONAL INTENT (Theo Tỉnh thành, Ga tàu, Khu vực)"].append(kw)
        elif any(w in kw for w in ["3点", "明細書", "現況", "評価書", "立ち退き", "占有", "瑕疵", "期間入札", "特別売却", "流れ", "入札", "書類", "住宅ローン"]):
            clusters["3. PROCEDURAL & LEGAL (Quy trình, 3点セット, Thủ tục tòa án)"].append(kw)
        elif any(w in kw for w in ["利回り", "格安", "相場", "落札価格", "投資", "ボロ戸建て", "再建築不可", "リノベ", "安い", "比較", "乖離"]):
            clusters["2. COMMERCIAL (Đầu tư, Sinh lời, So sánh giá)"].append(kw)
        else:
            clusters["1. TRANSACTIONAL (Tìm kiếm & Mua BĐS cụ thể)"].append(kw)

    for cluster_name, kws in clusters.items():
        print(f"\n### {cluster_name} ({len(kws)} từ khóa):")
        for k in kws[:12]:
            print(f"  - {k}")

if __name__ == "__main__":
    main()
