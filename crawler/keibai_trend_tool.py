#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Keibai Hot Trend Tool for AI Agents & SEO Writers
Module phát hiện và trích xuất từ khóa xu hướng ngành Bất động sản Đấu giá Nhật Bản.
Tích hợp trực tiếp với agent crawler (ai_seo_writer.py) và API Next.js.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Optional

API_BASE_URL = os.getenv("KEIBAI_API_URL", "http://localhost:3000/api/trends/keywords")

# Fallback Offline Trend Database nếu server chưa khởi động
OFFLINE_TREND_KEYWORDS = [
    {
        "id": "tokyo-keibai-kakuyasu",
        "keyword": "東京 競売 物件 格安",
        "category": "AREA_DEAL",
        "monthly_volume": 22400,
        "growth": 42.5,
        "trend_level": "BREAKING",
        "target_url": "/search/area/東京都",
        "prompt": "東京都内の不動産競売における最新の落札価格動向と、23区および多摩地区の価格乖離率を実データに基づき解説せよ。"
    },
    {
        "id": "akiya-saisei-keibai-yield",
        "keyword": "空き家再生 競売 高利回り",
        "category": "HIGH_YIELD_TYPE",
        "monthly_volume": 16900,
        "growth": 52.1,
        "trend_level": "BREAKING",
        "target_url": "/map?types[]=%E6%88%B8%E5%BB%BA%E3%81%A6&minGap=20",
        "prompt": "空き家再生競売物件を活用した低リスク高利回り不動産投資のノウハウと、現地調査の必須チェックポイントを解説せよ。"
    },
    {
        "id": "keibai-3tenset-read",
        "keyword": "3点セット 読み方 初心者",
        "category": "RISK_AND_LEGAL",
        "monthly_volume": 28500,
        "growth": 38.0,
        "trend_level": "HOT",
        "target_url": "/blogs",
        "prompt": "裁判所の競売3点セット（明細書・現況調査報告書・評価書）の初心者が絶対に見落としてはならない危険フラグを体系的に解説せよ。"
    },
    {
        "id": "senyusha-tachinoki-cost",
        "keyword": "占有者 立ち退き 費用 期間",
        "category": "RISK_AND_LEGAL",
        "monthly_volume": 24100,
        "growth": 41.2,
        "trend_level": "BREAKING",
        "target_url": "/blogs",
        "prompt": "競売落札後の占有者立退き交渉における法的ロードマップ（引渡命令から執行官立会いまでの全手順）と費用実費を解説せよ。"
    },
    {
        "id": "boro-kodate-yield20",
        "keyword": "ボロ戸建て 競売 利回り20%",
        "category": "HIGH_YIELD_TYPE",
        "monthly_volume": 19800,
        "growth": 44.2,
        "trend_level": "BREAKING",
        "target_url": "/search?property_type=戸建て",
        "prompt": "利回り20%超を叩き出すボロ戸建て競売の目利き術と、3点セットから見抜く隠れた修繕コストの算出法を論ぜよ。"
    },
    {
        "id": "nta-koubai-bukken-search",
        "keyword": "国税庁 公売 物件 検索",
        "category": "KOUBAI_TAX",
        "monthly_volume": 19100,
        "growth": 39.4,
        "trend_level": "HOT",
        "target_url": "/search?managing_authority=国税局",
        "prompt": "国税庁公売・地方自治体公売の仕組みと、裁判所競売と比較したメリット・デメリットを徹底解説せよ。"
    }
]

def fetch_trending_keywords(category: str = "ALL", limit: int = 20) -> List[Dict]:
    """
    Truy vấn danh sách từ khóa hot trend từ Next.js API (kèm fallback)
    """
    try:
        url = f"{API_BASE_URL}?category={category}&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "KeibaiAgentBot/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                return data.get("keywords", [])
    except Exception as e:
        # Fallback offline
        print(f"[TrendTool] Local API not reachable ({e}). Using offline curated trend database.")
        
    return OFFLINE_TREND_KEYWORDS[:limit]

def get_next_recommended_topic() -> Dict:
    """
    Đề xuất từ khóa và định hướng bài viết SEO tối ưu nhất cho AI Writer Agent
    """
    try:
        req = urllib.request.Request(
            API_BASE_URL,
            data=json.dumps({"action": "get_next_topic"}).encode('utf-8'),
            headers={"Content-Type": "application/json", "User-Agent": "KeibaiAgentBot/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                return data.get("recommendedTopic", OFFLINE_TREND_KEYWORDS[0])
    except Exception:
        pass
    
    # Fallback to top volume + growth
    return sorted(OFFLINE_TREND_KEYWORDS, key=lambda x: x["growth"] * x["monthly_volume"], reverse=True)[0]

if __name__ == "__main__":
    print("=== KEIBAI HOT TREND KEYWORD TOOL FOR AGENTS ===")
    top_topic = get_next_recommended_topic()
    print(f"Top Recommended SEO Topic: {top_topic.get('keyword')}")
    print(f"Search Volume: {top_topic.get('monthlySearchVolume', top_topic.get('monthly_volume'))}")
    print(f"Agent Prompt: {top_topic.get('agentPrompt', top_topic.get('prompt'))}")
