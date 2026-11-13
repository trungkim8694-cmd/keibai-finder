#!/usr/bin/env python3
"""
Google Analytics 4 (GA4) API Client for Keibai-Koubai
Property ID: 520578712
"""

import sys
import os
import argparse
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
    RunRealtimeReportRequest
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

KEY_FILE = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", r"c:\kigyou-list\google_credentials.json")
PROPERTY_ID = "520578712"

class KeibaiGA4Client:
    def __init__(self, key_file: str = KEY_FILE, property_id: str = PROPERTY_ID):
        self.key_file = key_file
        self.property_id = property_id
        if not os.path.exists(self.key_file):
            raise FileNotFoundError(f"Không tìm thấy file credentials tại: {self.key_file}")
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.key_file
        self.client = BetaAnalyticsDataClient()

    def get_realtime(self):
        """Lấy số lượng người dùng đang truy cập theo thời gian thực (Realtime - 30 phút qua)"""
        req = RunRealtimeReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="unifiedScreenName")],
            metrics=[Metric(name="activeUsers")]
        )
        try:
            resp = self.client.run_realtime_report(req)
            total_active = sum(int(r.metric_values[0].value) for r in resp.rows) if resp.rows else 0
            pages = []
            for r in resp.rows:
                pages.append({
                    "page": r.dimension_values[0].value,
                    "users": int(r.metric_values[0].value)
                })
            return {"total_active_users": total_active, "pages": pages}
        except Exception as e:
            raise RuntimeError(f"GA4 Realtime Error: {str(e)}")

    def get_overview(self, days: int = 28):
        """Lấy tổng hợp người dùng (Active Users), phiên (Sessions), số lượt xem trang (Views), và tỷ lệ tương tác (Engagement)"""
        req = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="sessionDefaultChannelGroup")],
            metrics=[
                Metric(name="activeUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate")
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")]
        )
        try:
            resp = self.client.run_report(req)
            channels = []
            total_users = 0
            total_sessions = 0
            total_views = 0
            for r in resp.rows:
                u = int(r.metric_values[0].value)
                s = int(r.metric_values[1].value)
                v = int(r.metric_values[2].value)
                eng = float(r.metric_values[3].value) * 100
                total_users += u
                total_sessions += s
                total_views += v
                channels.append({
                    "channel": r.dimension_values[0].value,
                    "users": u,
                    "sessions": s,
                    "views": v,
                    "engagement_rate": round(eng, 1)
                })
            return {
                "days": days,
                "total_users": total_users,
                "total_sessions": total_sessions,
                "total_views": total_views,
                "channels": channels
            }
        except Exception as e:
            raise RuntimeError(f"GA4 Overview Error: {str(e)}")


def main():
    parser = argparse.ArgumentParser(description="GA4 CLI for keibai-koubai.com")
    parser.add_argument("--action", choices=["realtime", "overview"], default="overview")
    parser.add_argument("--days", type=int, default=28, help="Số ngày phân tích (mặc định: 28)")
    args = parser.parse_args()

    client = KeibaiGA4Client()
    print(f"=== GOOGLE ANALYTICS 4: Property {PROPERTY_ID} ===")

    if args.action == "realtime":
        res = client.get_realtime()
        print(f"Người dùng trực tiếp (30 phút qua): {res['total_active_users']} users")
        if res['pages']:
            print(f"{'Màn hình / Trang':<50} | {'Users':<8}")
            print("-" * 62)
            for p in res['pages']:
                print(f"{p['page']:<50} | {p['users']:<8}")

    elif args.action == "overview":
        res = client.get_overview(days=args.days)
        print(f"Tổng quan ({args.days} ngày qua):")
        print(f"- Active Users:    {res['total_users']:,}")
        print(f"- Total Sessions:  {res['total_sessions']:,}")
        print(f"- Page Views:      {res['total_views']:,}")
        print("\nPhân bổ theo Kênh truy cập (Channel Grouping):")
        print(f"{'Kênh':<25} | {'Users':<8} | {'Sessions':<10} | {'Views':<8} | {'Tương tác':<8}")
        print("-" * 75)
        for c in res['channels']:
            print(f"{c['channel']:<25} | {c['users']:<8} | {c['sessions']:<10} | {c['views']:<8} | {c['engagement_rate']}%")

if __name__ == "__main__":
    main()
