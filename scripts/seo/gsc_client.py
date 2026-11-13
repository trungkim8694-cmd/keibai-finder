#!/usr/bin/env python3
"""
Google Search Console API Client for Keibai-Koubai
Domain Resource: sc-domain:keibai-koubai.com
"""

import sys
import os
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", r"c:\kigyou-list\google_credentials.json")
DEFAULT_SITE = "sc-domain:keibai-koubai.com"
SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

class KeibaiGSCClient:
    def __init__(self, key_file: str = KEY_FILE, site_url: str = DEFAULT_SITE):
        self.key_file = key_file
        self.site_url = site_url
        if not os.path.exists(self.key_file):
            raise FileNotFoundError(f"Không tìm thấy file credentials tại: {self.key_file}")
        self.creds = service_account.Credentials.from_service_account_file(self.key_file, scopes=SCOPES)
        self.service = build('searchconsole', 'v1', credentials=self.creds)

    def get_summary(self, days: int = 28) -> Dict[str, Any]:
        """Thống kê tổng Clicks, Impressions, CTR, Position trong X ngày gần nhất"""
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        body = {'startDate': start_date, 'endDate': end_date}
        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            rows = resp.get('rows', [])
            if not rows:
                return {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0, "start_date": start_date, "end_date": end_date}
            r = rows[0]
            return {
                "clicks": r.get('clicks', 0),
                "impressions": r.get('impressions', 0),
                "ctr": round(r.get('ctr', 0) * 100, 2),
                "position": round(r.get('position', 0), 1),
                "start_date": start_date,
                "end_date": end_date
            }
        except Exception as e:
            raise RuntimeError(f"GSC API Summary Error: {str(e)}")

    def get_top_queries(self, days: int = 28, limit: int = 30) -> List[Dict[str, Any]]:
        """Lấy danh sách các từ khóa tìm kiếm (Search Queries) có lượt hiển thị / click cao nhất"""
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        body = {
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': ['query'],
            'rowLimit': limit
        }
        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            rows = resp.get('rows', [])
            return [
                {
                    "query": r.get('keys', [''])[0],
                    "clicks": r.get('clicks', 0),
                    "impressions": r.get('impressions', 0),
                    "ctr": round(r.get('ctr', 0) * 100, 2),
                    "position": round(r.get('position', 0), 1)
                }
                for r in rows
            ]
        except Exception as e:
            raise RuntimeError(f"GSC API Queries Error: {str(e)}")

    def get_top_pages(self, days: int = 28, limit: int = 30) -> List[Dict[str, Any]]:
        """Lấy danh sách các trang (URLs) có lượt hiển thị / click cao nhất"""
        end_date = (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 2)).strftime('%Y-%m-%d')

        body = {
            'startDate': start_date,
            'endDate': end_date,
            'dimensions': ['page'],
            'rowLimit': limit
        }
        try:
            resp = self.service.searchanalytics().query(siteUrl=self.site_url, body=body).execute()
            rows = resp.get('rows', [])
            return [
                {
                    "page": r.get('keys', [''])[0],
                    "clicks": r.get('clicks', 0),
                    "impressions": r.get('impressions', 0),
                    "ctr": round(r.get('ctr', 0) * 100, 2),
                    "position": round(r.get('position', 0), 1)
                }
                for r in rows
            ]
        except Exception as e:
            raise RuntimeError(f"GSC API Pages Error: {str(e)}")


def main():
    parser = argparse.ArgumentParser(description="Google Search Console CLI for keibai-koubai.com")
    parser.add_argument("--action", choices=["summary", "queries", "pages"], default="summary")
    parser.add_argument("--days", type=int, default=28, help="Số ngày phân tích (mặc định: 28)")
    parser.add_argument("--limit", type=int, default=20, help="Số lượng kết quả hiển thị")
    args = parser.parse_args()

    client = KeibaiGSCClient()
    print(f"=== GOOGLE SEARCH CONSOLE: {DEFAULT_SITE} ===")

    if args.action == "summary":
        res = client.get_summary(days=args.days)
        print(f"Giai đoạn: {res.get('start_date')} -> {res.get('end_date')} ({args.days} ngày)")
        print(f"- Clicks:      {res.get('clicks'):,}")
        print(f"- Impressions: {res.get('impressions'):,}")
        print(f"- Avg CTR:     {res.get('ctr')}%")
        print(f"- Avg Position:{res.get('position')}")

    elif args.action == "queries":
        queries = client.get_top_queries(days=args.days, limit=args.limit)
        print(f"Top {len(queries)} từ khóa ({args.days} ngày gần nhất):")
        print(f"{'Từ khóa':<40} | {'Clicks':<8} | {'Impr':<8} | {'CTR':<8} | {'Thứ hạng':<8}")
        print("-" * 80)
        for q in queries:
            print(f"{q['query']:<40} | {q['clicks']:<8} | {q['impressions']:<8} | {q['ctr']:<7}% | #{q['position']}")

    elif args.action == "pages":
        pages = client.get_top_pages(days=args.days, limit=args.limit)
        print(f"Top {len(pages)} trang hiệu suất cao ({args.days} ngày gần nhất):")
        print(f"{'URL':<60} | {'Clicks':<8} | {'Impr':<8} | {'CTR':<8}")
        print("-" * 90)
        for p in pages:
            print(f"{p['page']:<60} | {p['clicks']:<8} | {p['impressions']:<8} | {p['ctr']:<7}%")

if __name__ == "__main__":
    main()
