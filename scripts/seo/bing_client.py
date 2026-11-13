#!/usr/bin/env python3
"""
Bing Webmaster Tools & IndexNow API Client for Keibai-Koubai
Site URL: https://keibai-koubai.com/
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Đọc API Key từ env hoặc file cấu hình, mặc định fallback nếu có
BING_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "bing_config.json")
DEFAULT_SITE_URL = "https://keibai-koubai.com/"
API_BASE = "https://ssl.bing.com/webmaster/api.svc/json"

def get_api_key() -> str:
    key = os.environ.get("BING_WEBMASTER_API_KEY")
    if key:
        return key.strip()
    if os.path.exists(BING_CONFIG_PATH):
        try:
            with open(BING_CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("api_key", "").strip()
        except Exception:
            pass
    # Thử lấy fallback từ kigyou-list nếu dùng chung Microsoft Account
    return "7c742571ab6a4103aa339488f8220031"

class KeibaiBingClient:
    def __init__(self, api_key: Optional[str] = None, site_url: str = DEFAULT_SITE_URL):
        self.api_key = api_key or get_api_key()
        self.site_url = site_url

    def _call(self, endpoint: str, params: Optional[Dict[str, Any]] = None, post_data: Optional[Dict[str, Any]] = None) -> Any:
        if params is None:
            params = {}
        params["apikey"] = self.api_key
        query_str = urllib.parse.urlencode(params)
        url = f"{API_BASE}/{endpoint}?{query_str}"

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KeibaiKoubai/1.0"}
        data_bytes = None
        if post_data is not None:
            data_bytes = json.dumps(post_data).encode("utf-8")
            headers["Content-Type"] = "application/json; charset=utf-8"

        req = urllib.request.Request(url, data=data_bytes, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return None
                parsed = json.loads(raw)
                return parsed.get("d", parsed)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise RuntimeError(f"Bing API HTTP {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"Bing API Error: {str(e)}")

    def get_sites(self) -> List[Dict[str, Any]]:
        return self._call("GetUserSites") or []

    def get_traffic_summary(self) -> List[Dict[str, Any]]:
        return self._call("GetRankAndTrafficStats", {"siteUrl": self.site_url}) or []

    def get_query_stats(self, limit: int = 30) -> List[Dict[str, Any]]:
        res = self._call("GetQueryStats", {"siteUrl": self.site_url}) or []
        sorted_res = sorted(res, key=lambda x: (x.get("Clicks", 0), x.get("Impressions", 0)), reverse=True)
        return sorted_res[:limit]

    def get_submission_quota(self) -> Dict[str, Any]:
        return self._call("GetUrlSubmissionQuota", {"siteUrl": self.site_url}) or {}

    def submit_url(self, url: str) -> bool:
        payload = {"siteUrl": self.site_url, "url": url}
        self._call("SubmitUrl", post_data=payload)
        return True

    def submit_batch(self, urls: List[str]) -> bool:
        payload = {"siteUrl": self.site_url, "urlList": urls}
        self._call("SubmitUrlBatch", post_data=payload)
        return True


def main():
    parser = argparse.ArgumentParser(description="Bing Webmaster & IndexNow CLI for keibai-koubai.com")
    parser.add_argument("--action", choices=["summary", "queries", "quota", "sites", "submit"], default="summary")
    parser.add_argument("--url", type=str, help="URL cần submit lập chỉ mục nhanh")
    parser.add_argument("--set-key", type=str, help="Lưu Bing Webmaster API Key mới")
    args = parser.parse_args()

    if args.set_key:
        with open(BING_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump({"api_key": args.set_key.strip()}, f, indent=2)
        print(f"[OK] Đã lưu Bing API Key vào {BING_CONFIG_PATH}")
        return

    client = KeibaiBingClient()
    print(f"=== BING WEBMASTER TOOLS: {DEFAULT_SITE_URL} ===")

    if args.action == "sites":
        sites = client.get_sites()
        print("Danh sách website trong tài khoản Bing:")
        for s in sites:
            print(f"- {s.get('Url')} (Role: {s.get('Role')})")

    elif args.action == "quota":
        quota = client.get_submission_quota()
        print(f"- Hạn mức còn lại hôm nay (Daily Remaining): {quota.get('DailyQuotaRemaining', 'N/A')}")
        print(f"- Hạn mức còn lại tháng này (Monthly Remaining): {quota.get('MonthlyQuotaRemaining', 'N/A')}")

    elif args.action == "summary":
        traffic = client.get_traffic_summary()
        print(f"Lịch sử hiển thị / Click gần nhất ({len(traffic)} ngày ghi nhận):")
        if not traffic:
            print("Chưa có đủ số liệu traffic gần đây từ Bingbot.")
        else:
            for t in traffic[-7:]:
                print(f"Ngày {t.get('Date')}: Clicks={t.get('Clicks')} | Impr={t.get('Impressions')}")

    elif args.action == "queries":
        queries = client.get_query_stats()
        print(f"Top {len(queries)} từ khóa tìm kiếm trên Bing:")
        print(f"{'Từ khóa':<40} | {'Clicks':<8} | {'Impr':<8} | {'Avg Pos':<8}")
        print("-" * 75)
        for q in queries:
            print(f"{q.get('Query', ''):<40} | {q.get('Clicks', 0):<8} | {q.get('Impressions', 0):<8} | #{q.get('AvgImpressionPosition', 0)}")

    elif args.action == "submit":
        if not args.url:
            print("Lỗi: Vui lòng truyền URL bằng --url https://keibai-koubai.com/...")
            return
        client.submit_url(args.url)
        print(f"[OK] Đã submit thành công URL lên Bing: {args.url}")

if __name__ == "__main__":
    main()
