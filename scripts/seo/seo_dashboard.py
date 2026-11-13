#!/usr/bin/env python3
"""
Unified SEO & Webmaster Performance Dashboard for Keibai-Koubai
Aggregates GSC, GA4, and Bing into a single diagnostic report.
"""

import sys
import os
from gsc_client import KeibaiGSCClient
from ga4_client import KeibaiGA4Client
from bing_client import KeibaiBingClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 80)
    print(" 🚀 KEIBAI-KOUBAI.COM - BÁO CÁO PHÂN TÍCH SEO & HIỆU SUẤT TRUY CẬP TỔNG HỢP")
    print("=" * 80)

    # 1. Google Analytics 4
    print("\n[1] GOOGLE ANALYTICS 4 (Property: 520578712)")
    print("-" * 50)
    try:
        ga4 = KeibaiGA4Client()
        rt = ga4.get_realtime()
        print(f"⚡ Đang online trực tiếp (Realtime 30p): {rt['total_active_users']} active users")
        
        overview = ga4.get_overview(days=28)
        print(f"📊 28 ngày qua: {overview['total_users']:,} users | {overview['total_sessions']:,} sessions | {overview['total_views']:,} pageviews")
        if overview['channels']:
            print("   Top nguồn truy cập:")
            for c in overview['channels'][:3]:
                print(f"   • {c['channel']:<18}: {c['users']} users ({c['engagement_rate']}% tương tác)")
    except Exception as e:
        print(f"⚠️ GA4 chưa truy cập được: {e}")
        print("   👉 Giải pháp: Thêm 'gsc-agent@kigyoulist-seo.iam.gserviceaccount.com' vào quyền Viewer của GA4 Property 520578712.")

    # 2. Google Search Console
    print("\n[2] GOOGLE SEARCH CONSOLE (sc-domain:keibai-koubai.com)")
    print("-" * 50)
    try:
        gsc = KeibaiGSCClient()
        summary = gsc.get_summary(days=28)
        print(f"🔍 28 ngày qua ({summary.get('start_date')} -> {summary.get('end_date')}):")
        print(f"   • Tổng Clicks:       {summary.get('clicks'):,}")
        print(f"   • Tổng Impressions:  {summary.get('impressions'):,}")
        print(f"   • CTR trung bình:    {summary.get('ctr')}%")
        print(f"   • Thứ hạng TB:       #{summary.get('position')}")
        
        queries = gsc.get_top_queries(days=28, limit=5)
        if queries:
            print("   Top 5 từ khóa Google:")
            for q in queries:
                print(f"   • {q['query']:<30} | {q['clicks']} clicks | #{q['position']}")
    except Exception as e:
        print(f"⚠️ GSC chưa truy cập được: {e}")
        print("   👉 Giải pháp: Thêm 'gsc-agent@kigyoulist-seo.iam.gserviceaccount.com' vào GSC 'sc-domain:keibai-koubai.com' với quyền 'Full' hoặc 'Owner'.")

    # 3. Microsoft Bing Webmaster
    print("\n[3] MICROSOFT BING WEBMASTER TOOLS (https://keibai-koubai.com/)")
    print("-" * 50)
    try:
        bing = KeibaiBingClient()
        sites = [s.get('Url') for s in bing.get_sites()]
        if "https://keibai-koubai.com/" in sites:
            print("✅ Đã kết nối thành công với Bing Webmaster Tools!")
            traffic = bing.get_traffic_summary()
            if traffic:
                recent = traffic[-1]
                print(f"   • Lần quét gần nhất ({recent.get('Date')}): Clicks={recent.get('Clicks')} | Impr={recent.get('Impressions')}")
            else:
                print("   • Bingbot đang trong quá trình thu thập chỉ số traffic.")
        else:
            print("⚠️ Chưa thấy https://keibai-koubai.com/ trong danh sách site của Bing API Key.")
    except Exception as e:
        print(f"⚠️ Bing API Error: {e}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
