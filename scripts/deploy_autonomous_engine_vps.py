import os
import paramiko

VPS_IP = "163.44.116.98"
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

FILES_TO_SYNC = [
    ("crawler/advanced_crawler.py", "/app/crawler/advanced_crawler.py", False),
    ("crawler/scrape_detail_to_db.py", "/app/crawler/scrape_detail_to_db.py", False),
    ("crawler/cleanup_property_images.py", "/app/crawler/cleanup_property_images.py", False),
    ("crawler/ai_seo_writer.py", "/app/crawler/ai_seo_writer.py", False),
    ("crawler/fast_index_submitter.py", "/app/crawler/fast_index_submitter.py", False),
    ("crawler/run_daily_vps.sh", "/app/crawler/run_daily_vps.sh", True),
]

GOOGLE_KEY_LOCAL = r"c:\kigyou-list\google_keys\key_01.json"
GOOGLE_KEY_REMOTE = "/app/crawler/google_keys/key_01.json"

INDEXING_SERVICE_UNIT = """[Unit]
Description=Keibai Finder Fast Indexing Boost Service (Google Quota Reset & IndexNow)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/app/crawler
ExecStart=/app/venv/bin/python3 /app/crawler/fast_index_submitter.py
StandardOutput=append:/app/logs/systemd_indexing_boost.log
StandardError=append:/app/logs/systemd_indexing_boost.log
TimeoutSec=1800
KillMode=process

[Install]
WantedBy=multi-user.target
"""

INDEXING_TIMER_UNIT = """[Unit]
Description=Run Keibai Fast Indexing Boost daily at 17:05 JST (00:05 PST Google Quota Reset)
After=time-sync.target

[Timer]
OnCalendar=*-*-* 17:05:00 Asia/Tokyo
Persistent=true
RandomizedDelaySec=60

[Install]
WantedBy=timers.target
"""


def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_IP, port=22, username=VPS_USER, password=VPS_PASS, timeout=20)
    sftp = ssh.open_sftp()

    # 1. Tạo thư mục google_keys trên VPS
    ssh.exec_command("mkdir -p /app/crawler/google_keys")[1].read()

    # 2. Đồng bộ các file crawler & bash script (chuẩn hóa LF)
    for local_rel, remote_path, is_shell in FILES_TO_SYNC:
        local_path = os.path.join(r"c:\dev\keibaiKoubai", local_rel)
        with open(local_path, "rb") as f:
            content = f.read().replace(b"\r\n", b"\n")
        with sftp.file(remote_path, "wb") as rf:
            rf.write(content)
        if is_shell:
            ssh.exec_command(f"chmod +x {remote_path}")[1].read()
        print(f"✅ Synced {local_rel} -> {remote_path}")

    # 3. Đồng bộ Google Service Account Key
    if os.path.isfile(GOOGLE_KEY_LOCAL):
        with open(GOOGLE_KEY_LOCAL, "rb") as f:
            key_bytes = f.read()
        with sftp.file(GOOGLE_KEY_REMOTE, "wb") as rf:
            rf.write(key_bytes)
        print(f"✅ Synced Google Service Account key -> {GOOGLE_KEY_REMOTE}")

    # 4. Bổ sung biến môi trường FRONTEND_URL, INDEXNOW_KEY, BING_WEBMASTER_API_KEY vào /app/web/.env và .env.local
    env_additions = """
FRONTEND_URL="https://www.keibai-koubai.com"
INDEXNOW_KEY="7c742571ab6a4103aa339488f8220031"
BING_WEBMASTER_API_KEY="7c742571ab6a4103aa339488f8220031"
GOOGLE_KEYS_DIR="/app/crawler/google_keys"
"""
    for env_file in ["/app/web/.env", "/app/web/.env.local"]:
        try:
            with sftp.file(env_file, "rb") as rf:
                curr_env = rf.read().decode("utf-8", errors="replace").replace("\r\n", "\n")
            if "FRONTEND_URL=" not in curr_env:
                curr_env = curr_env.rstrip() + "\n" + env_additions.lstrip()
                with sftp.file(env_file, "wb") as wf:
                    wf.write(curr_env.encode("utf-8"))
                print(f"✅ Updated {env_file} with FRONTEND_URL & SEO keys")
        except Exception as e:
            print(f"⚠️ Could not update {env_file}: {e}")

    # 5. Cài đặt systemd service & timer cho 17:05 JST Google Quota Reset Indexing
    with sftp.file("/etc/systemd/system/keibai-indexing-boost.service", "wb") as f:
        f.write(INDEXING_SERVICE_UNIT.encode("utf-8"))
    with sftp.file("/etc/systemd/system/keibai-indexing-boost.timer", "wb") as f:
        f.write(INDEXING_TIMER_UNIT.encode("utf-8"))

    sftp.close()

    cmds = [
        "bash -n /app/crawler/run_daily_vps.sh && echo 'Bash syntax OK'",
        "systemctl daemon-reload",
        "systemctl enable --now keibai-indexing-boost.timer",
        "systemctl list-timers | grep -E 'keibai|crawler|indexing'",
    ]
    for cmd in cmds:
        print(f"=== CMD: {cmd} ===")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode("utf-8", errors="replace").strip())
        err = stderr.read().decode("utf-8", errors="replace").strip()
        if err:
            print("STDERR:", err)

    ssh.close()


if __name__ == "__main__":
    main()
