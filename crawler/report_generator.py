#!/usr/bin/env python3
"""
Report Generator for Keibai-Koubai Crawler Pipeline
Tạo báo cáo tổng hợp chất lượng cao gửi về Telegram:
- Tình trạng từng thành phần (pipeline status)
- Sản lượng dữ liệu thực tế hôm nay (mới cào, đóng thầu, tổng active)
- Thời gian thực thi & cảnh báo bất thường
"""
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

# Nạp cấu hình môi trường
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)
for p in ['../web/.env.local', '../web/.env', '/app/web/.env.local', '/app/web/.env']:
    load_dotenv(os.path.join(script_dir, p))

from telegram_notify import send_telegram_message


def fetch_database_metrics():
    """Truy vấn các chỉ số sản lượng thực tế trong ngày từ CSDL"""
    metrics = {
        "new_today": {},
        "total_new": 0,
        "archived_today": {},
        "total_archived": 0,
        "total_active": 0,
        "results_today": 0,
        "total_results": 0,
        "error": None
    }
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        metrics["error"] = "Chưa cấu hình DATABASE_URL"
        return metrics

    try:
        import psycopg2
        conn = psycopg2.connect(db_url.replace('?schema=public', ''), connect_timeout=15)
        cur = conn.cursor()

        # 1. Tài sản mới tạo hôm nay
        cur.execute("""
            SELECT source_provider, COUNT(*)
            FROM "Property"
            WHERE created_at >= CURRENT_DATE
            GROUP BY source_provider
        """)
        for prov, cnt in cur.fetchall():
            metrics["new_today"][prov] = cnt
            metrics["total_new"] += cnt

        # 2. Tài sản chuyển sang ARCHIVED hoặc SOLD hôm nay
        cur.execute("""
            SELECT source_provider, COUNT(*)
            FROM "Property"
            WHERE status IN ('ARCHIVED', 'SOLD') AND updated_at >= CURRENT_DATE
            GROUP BY source_provider
        """)
        for prov, cnt in cur.fetchall():
            metrics["archived_today"][prov] = cnt
            metrics["total_archived"] += cnt

        # 3. Tổng tài sản đang mở thầu (ACTIVE) hiện tại
        cur.execute("""
            SELECT COUNT(*) FROM "Property" WHERE status = 'ACTIVE'
        """)
        metrics["total_active"] = cur.fetchone()[0]

        # 4. Kết quả đấu giá ghi nhận hôm nay
        cur.execute("""
            SELECT COUNT(*) FROM "AuctionResult" WHERE created_at >= CURRENT_DATE
        """)
        metrics["results_today"] = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM "AuctionResult"
        """)
        metrics["total_results"] = cur.fetchone()[0]

        cur.close()
        conn.close()
    except Exception as e:
        metrics["error"] = str(e)

    return metrics


def build_daily_report(statuses: dict, runtime_sec: int = 0) -> str:
    """Xây dựng chuỗi HTML báo cáo hoàn chỉnh cho Telegram"""
    now_jst = datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M JST')
    metrics = fetch_database_metrics()

    # Định dạng thời gian chạy
    mins = runtime_sec // 60
    secs = runtime_sec % 60
    runtime_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

    lines = []
    lines.append("🏠 <b>Keibai Finder - VPS Daily Pipeline Report</b>")
    lines.append(f"📅 <code>{now_jst}</code> | ⏱️ <code>{runtime_str}</code>")
    lines.append("")

    # 1. Trạng thái các luồng cào
    lines.append("<b>⚙️ Trạng thái các luồng:</b>")
    step_icons = [
        ("archive", "0️⃣ Tự động đóng thầu", statuses.get("archive", "Thành công ✅")),
        ("bit", "1️⃣ Toà án BIT (Đang mở)", statuses.get("bit", "Thất bại ❌")),
        ("nta", "2️⃣ Thuế Quốc gia NTA (Đang mở)", statuses.get("nta", "Thất bại ❌")),
        ("nta_res", "3️⃣ Kết quả NTA (Đã đấu giá)", statuses.get("nta_res", "Bỏ qua ⏭️")),
        ("ksi", "4️⃣ Công bán KSI (官公庁公売)", statuses.get("ksi", "Bỏ qua ⏭️")),
        ("mof", "5️⃣ Quốc hữu MOF (国有財産)", statuses.get("mof", "Bỏ qua ⏭️")),
        ("mlit", "6️⃣ Thẩm định giá MLIT", statuses.get("mlit", "Bỏ qua ⏭️")),
        ("seo", "7️⃣ Bản tin AI Insights", statuses.get("seo", "Bỏ qua ⏭️")),
        ("cache", "8️⃣ Bộ đệm Next.js", statuses.get("cache", "Chưa chạy ⏳")),
        ("index", "9️⃣ Bắn Index (Google/Bing)", statuses.get("index", "Chưa chạy ⏳")),
    ]
    for key, name, status_text in step_icons:
        lines.append(f"• {name}: {status_text}")

    lines.append("")

    # 2. Thống kê sản lượng dữ liệu thực tế
    lines.append("<b>📊 Sản lượng dữ liệu thực tế:</b>")
    if metrics["error"]:
        lines.append(f"⚠️ <i>Lỗi đọc số liệu DB: {metrics['error']}</i>")
    else:
        # Chi tiết cào mới
        new_detail = ", ".join(f"{k}: {v}" for k, v in sorted(metrics["new_today"].items())) if metrics["new_today"] else "0"
        lines.append(f"• <b>Mới cào hôm nay:</b> <code>+{metrics['total_new']}</code> ({new_detail})")

        # Chi tiết lưu trữ
        arch_detail = ", ".join(f"{k}: {v}" for k, v in sorted(metrics["archived_today"].items())) if metrics["archived_today"] else "0"
        lines.append(f"• <b>Đã đóng thầu / lưu trữ:</b> <code>{metrics['total_archived']}</code> ({arch_detail})")

        # Đang hoạt động & Kết quả
        lines.append(f"• <b>Đang mở thầu (Active):</b> <code>{metrics['total_active']:,}</code> tài sản")
        lines.append(f"• <b>Kết quả đấu giá nạp mới:</b> <code>+{metrics['results_today']}</code> (Tổng kho: {metrics['total_results']:,})")

    # 3. Cảnh báo bất thường nếu có
    has_failure = any("❌" in str(v) for v in statuses.values())
    if has_failure:
        lines.append("")
        lines.append("⚠️ <b>CẢNH BÁO:</b> Phát hiện luồng cào gặp sự cố. Vui lòng kiểm tra file log trên VPS!")

    return "\n".join(lines)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Tạo và gửi báo cáo tổng kết pipeline Keibai về Telegram")
    parser.add_argument("--send", action="store_true", help="Gửi báo cáo qua Telegram")
    parser.add_argument("--runtime", type=int, default=0, help="Thời gian chạy pipeline (giây)")
    parser.add_argument("--status", action="append", help="Cặp key=value (ví dụ: --status bit='Thành công ✅')")
    parser.add_argument("--raw", action="store_true", help="In text ra stdout mà không gửi")
    args = parser.parse_args()

    parsed_statuses = {}
    if args.status:
        for s in args.status:
            if "=" in s:
                k, v = s.split("=", 1)
                parsed_statuses[k.strip()] = v.strip()

    report = build_daily_report(parsed_statuses, runtime_sec=args.runtime)

    if args.send:
        print("[Report Generator] Đang gửi báo cáo về Telegram...")
        success = send_telegram_message(report)
        sys.exit(0 if success else 1)
    else:
        print(report)
