#!/usr/bin/env python3
"""
Keibai Crawler Watchdog - kiểm tra các luồng cào có chạy đúng lịch 24/7 không.

Kiểm tra (read-only, chỉ SELECT):
  1. Freshness DB: MAX(updated_at) của Property theo source_provider (BIT/NTA...),
     MAX(created_at) của AuctionResult.
  2. Log hằng ngày: logs/daily_crawler_YYYY-MM-DD.log có tồn tại, có lỗi (Traceback/❌), có dấu hiệu hoàn tất.
  3. Systemd timer (nếu chạy trên VPS Linux): trạng thái keibai-*.timer.
  4. Cảnh báo Telegram nếu có vấn đề (--notify).

Usage:
  python crawler_watchdog.py              # in báo cáo
  python crawler_watchdog.py --notify     # gửi Telegram khi có cảnh báo
  python crawler_watchdog.py --json       # xuất JSON
Exit code: 0 = OK, 1 = WARN, 2 = CRITICAL
Cron gợi ý (VPS): 0 * * * * cd /app/crawler && python crawler_watchdog.py --notify
"""
import os, sys, re, json, glob, shutil, subprocess, argparse
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
for p in ('web/.env.local', 'web/.env'):
    load_dotenv(os.path.join(ROOT, p))

# Ngưỡng (giờ). Daily chạy 04:00 JST mỗi ngày; weekly kết quả chạy thứ Sáu.
MAX_AGE_H = {"property": 30, "auction_result": 24 * 8}
LOG_DIR = os.path.join(ROOT, 'logs')
TIMERS = ["keibai-daily-crawler.timer", "keibai-weekly-results.timer"]
ERR_PAT = re.compile(r"Traceback|❌|THẤT BẠI|Error|Exception|Timeout", re.I)
CB_PAT = re.compile(r"CIRCUIT BREAKER", re.I)
DONE_PAT = re.compile(r"HOÀN TẤT|HOÀN THÀNH|COMPLETED|FINISHED|✅", re.I)

OK, WARN, CRIT = 0, 1, 2
findings = []  # (level, message)


def add(level, msg):
    findings.append((level, msg))


def check_db():
    url = os.environ.get('DATABASE_URL')
    if not url:
        add(WARN, "DATABASE_URL chưa cấu hình - bỏ qua kiểm tra DB")
        return
    try:
        import psycopg2
        conn = psycopg2.connect(url.replace('?schema=public', ''), connect_timeout=15)
    except Exception as e:
        add(CRIT, f"Không kết nối được DB: {e}")
        return
    now = datetime.now(timezone.utc)
    try:
        cur = conn.cursor()
        cur.execute('SELECT source_provider, MAX(updated_at), COUNT(*) FROM "Property" GROUP BY 1')
        for provider, last, cnt in cur.fetchall():
            if last is None:
                add(WARN, f"Property[{provider}] không có updated_at")
                continue
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            age = (now - last).total_seconds() / 3600
            lvl = OK if age <= MAX_AGE_H["property"] else (WARN if age <= MAX_AGE_H["property"] * 2 else CRIT)
            add(lvl, f"Property[{provider}]: {cnt} bản ghi, cập nhật cuối {age:.1f}h trước")
        cur.execute('SELECT MAX(created_at) FROM "AuctionResult"')
        last = cur.fetchone()[0]
        if last:
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            age = (now - last).total_seconds() / 3600
            lvl = OK if age <= MAX_AGE_H["auction_result"] else WARN
            add(lvl, f"AuctionResult: bản ghi mới nhất {age:.1f}h trước")
    except Exception as e:
        add(WARN, f"Lỗi truy vấn DB: {e}")
    finally:
        conn.close()


def check_logs():
    today = datetime.now().strftime('%Y-%m-%d')
    yday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    path = next((p for p in (os.path.join(LOG_DIR, f'daily_crawler_{d}.log') for d in (today, yday))
                 if os.path.exists(p)), None)
    if not path:
        add(WARN, f"Không thấy log daily_crawler hôm nay/hôm qua trong {LOG_DIR} (có thể log nằm trên VPS)")
        return
    age = (datetime.now().timestamp() - os.path.getmtime(path)) / 3600
    with open(path, encoding='utf-8', errors='ignore') as f:
        lines = f.read().splitlines()
    errs = [l for l in lines if ERR_PAT.search(l)]
    cb_triggers = [l for l in lines if CB_PAT.search(l)]
    done = any(DONE_PAT.search(l) for l in lines[-30:])
    name = os.path.basename(path)
    add(OK if age < 30 else WARN, f"{name}: ghi cuối {age:.1f}h trước, {len(lines)} dòng")
    if cb_triggers:
        add(WARN, f"{name}: 🛑 Circuit Breaker kích hoạt ({len(cb_triggers)} lần) bảo vệ dữ liệu!")
    if errs:
        add(WARN, f"{name}: {len(errs)} dòng lỗi, mẫu cuối: {errs[-1][:160]}")
    if not done:
        add(WARN, f"{name}: không thấy dấu hiệu hoàn tất ở cuối log (có thể đang chạy hoặc bị treo)")


def check_systemd():
    if not shutil.which('systemctl'):
        return
    for t in TIMERS:
        try:
            out = subprocess.run(['systemctl', 'is-active', t], capture_output=True, text=True, timeout=10).stdout.strip()
            add(OK if out == 'active' else CRIT, f"systemd {t}: {out}")
            svc = t.replace('.timer', '.service')
            res = subprocess.run(['systemctl', 'show', svc, '-p', 'Result'], capture_output=True, text=True, timeout=10).stdout.strip()
            if res and res != 'Result=success':
                add(CRIT, f"systemd {svc}: {res}")
        except Exception as e:
            add(WARN, f"systemd {t}: {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--notify', action='store_true')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()

    check_systemd(); check_logs(); check_db()
    worst = max([l for l, _ in findings] or [OK])
    icon = {OK: '🟢', WARN: '🟡', CRIT: '🔴'}

    if a.json:
        print(json.dumps({"status": worst, "findings": [{"level": l, "msg": m} for l, m in findings]}, ensure_ascii=False, indent=2))
    else:
        for l, m in findings:
            print(f"{icon[l]} {m}")
        print(f"\nTỔNG: {['OK', 'WARN', 'CRITICAL'][worst]}")

    if a.notify and worst > OK:
        sys.path.insert(0, HERE)
        from telegram_notify import send_telegram_message
        body = "\n".join(f"{icon[l]} {m}" for l, m in findings if l > OK)
        send_telegram_message(f"🐕 <b>Crawler Watchdog: {['OK','WARN','CRITICAL'][worst]}</b>\n{body}")
    sys.exit(worst)


if __name__ == '__main__':
    main()
