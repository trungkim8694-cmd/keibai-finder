import os
import sys
import paramiko

def load_vps_config():
    config = {}
    config_path = os.path.join(os.path.dirname(__file__), 'vps_config.env')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    config[k.strip()] = v.strip().strip('"').strip("'")
    return config

def main():
    cfg = load_vps_config()
    ip = cfg.get('VPS_IP', '163.44.116.98')
    user = cfg.get('VPS_USER', 'root')
    password = cfg.get('VPS_PASSWORD', 'Hrptlcct6789@')
    
    print(f"🚀 Bắt đầu kết nối tới VPS {user}@{ip}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, port=22, username=user, password=password, timeout=15)
    print("✅ Đã kết nối SSH thành công!")
    
    remote_app_dir = "/app"
    print(f"📁 Tạo thư mục triển khai {remote_app_dir}...")
    ssh.exec_command(f"mkdir -p {remote_app_dir}/crawler/data {remote_app_dir}/logs {remote_app_dir}/web")
    
    # SFTP client to transfer files
    sftp = ssh.open_sftp()
    
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    crawler_local = os.path.join(root_dir, 'crawler')
    
    crawler_files = [
        'advanced_crawler.py',
        'nta_parser.py',
        'scrape_nta_results.py',
        'mlit_calculator.py',
        'cleanup_property_images.py',
        'ai_seo_writer.py',
        'crawler_utils.py',
        'crawl_all_japan_results.py',
        'telegram_notify.py',
        'requirements.txt',
        'keibai_trend_tool.py',
        'run_daily_vps.sh',
        'run_weekly_results_vps.sh'
    ]
    
    print("📤 Đang đồng bộ các file crawler lên VPS...")
    for fn in crawler_files:
        local_path = os.path.join(crawler_local, fn)
        if os.path.exists(local_path):
            remote_path = f"{remote_app_dir}/crawler/{fn}"
            sftp.put(local_path, remote_path)
            print(f"   + {fn} -> {remote_path}")
            
    # Copy data files (station.csv, line.csv)
    data_dir_local = os.path.join(crawler_local, 'data')
    if os.path.exists(data_dir_local):
        for data_fn in os.listdir(data_dir_local):
            local_dp = os.path.join(data_dir_local, data_fn)
            if os.path.isfile(local_dp):
                remote_dp = f"{remote_app_dir}/crawler/data/{data_fn}"
                sftp.put(local_dp, remote_dp)
                print(f"   + data/{data_fn} -> {remote_dp}")

    # Copy / Create web .env
    web_env_local = os.path.join(root_dir, 'web', '.env.local')
    if os.path.exists(web_env_local):
        sftp.put(web_env_local, f"{remote_app_dir}/web/.env.local")
        sftp.put(web_env_local, f"{remote_app_dir}/web/.env")
        print("   + web/.env.local -> /app/web/.env.local & /app/web/.env")

    # Bổ sung R2 credentials vào /app/web/.env
    r2_append = """
R2_ACCOUNT_ID="d03c9e4887e6cd7849e2b84c5d2a78d0"
R2_ACCESS_KEY_ID="c1e0e5c6e43bb8e1cc33c725dc7fab82"
R2_SECRET_ACCESS_KEY="d488e97467dc33b3c748809f895786f47c6a3563e006af64669e48118daac643"
R2_BUCKET_NAME="keibai-storage"
R2_PUBLIC_URL="https://storage.keibai-koubai.com"
"""
    ssh.exec_command(f"echo '{r2_append}' >> {remote_app_dir}/web/.env")
    ssh.exec_command(f"echo '{r2_append}' >> {remote_app_dir}/web/.env.local")
        
    sftp.close()
    
    # Cấp quyền thực thi cho các file .sh
    ssh.exec_command(f"chmod +x {remote_app_dir}/crawler/*.sh")
    
    print("\n⚙️ Đang thiết lập môi trường Virtualenv & Playwright trên VPS...")
    setup_commands = [
        f"export DEBIAN_FRONTEND=noninteractive && apt-get update -y && apt-get install -y python3-venv python3-pip libgbm-dev libnss3 libasound2t64 || true",
        f"timedatectl set-timezone Asia/Tokyo",
        f"cd {remote_app_dir} && python3 -m venv venv",
        f"cd {remote_app_dir} && source venv/bin/activate && pip install --upgrade pip && pip install -r crawler/requirements.txt",
        f"cd {remote_app_dir} && source venv/bin/activate && playwright install chromium && playwright install-deps chromium || true"
    ]
    
    for cmd in setup_commands:
        print(f"\n👉 Chạy: {cmd[:60]}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        if exit_status == 0:
            print("   ✅ Hoàn tất thành công.")
        else:
            print(f"   ⚠️ Lỗi (code {exit_status}): {stderr.read().decode('utf-8')[:300]}")
            
    # Cấu hình Systemd Timer trên VPS
    print("\n⏰ Đang cấu hình và kích hoạt Systemd Timer trên VPS...")
    systemd_cmds = f"""
cat << 'EOF' > /etc/systemd/system/keibai-daily-crawler.service
[Unit]
Description=Keibai Finder Daily Master Crawler Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/app/crawler
ExecStart=/bin/bash /app/crawler/run_daily_vps.sh
StandardOutput=append:/app/logs/systemd_daily_crawler.log
StandardError=append:/app/logs/systemd_daily_crawler.log
TimeoutSec=21600
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > /etc/systemd/system/keibai-daily-crawler.timer
[Unit]
Description=Run Keibai Daily Crawler every morning at 04:00 JST
After=time-sync.target

[Timer]
OnCalendar=*-*-* 04:00:00 Asia/Tokyo
Persistent=true
RandomizedDelaySec=180

[Install]
WantedBy=timers.target
EOF

cat << 'EOF' > /etc/systemd/system/keibai-weekly-results.service
[Unit]
Description=Keibai Finder Weekly Auction Results Crawler Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/app/crawler
ExecStart=/bin/bash /app/crawler/run_weekly_results_vps.sh
StandardOutput=append:/app/logs/systemd_weekly_results.log
StandardError=append:/app/logs/systemd_weekly_results.log
TimeoutSec=18000
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > /etc/systemd/system/keibai-weekly-results.timer
[Unit]
Description=Run Keibai Weekly Auction Results on Saturday at 03:00 JST
After=time-sync.target

[Timer]
OnCalendar=Sat *-*-* 03:00:00 Asia/Tokyo
Persistent=true
RandomizedDelaySec=180

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now keibai-daily-crawler.timer
systemctl enable --now keibai-weekly-results.timer
systemctl list-timers keibai-*
"""
    stdin, stdout, stderr = ssh.exec_command(systemd_cmds)
    out = stdout.read().decode('utf-8')
    print(out)
    
    ssh.close()
    print("\n🎉 TRIỂN KHAI VÀ KÍCH HOẠT CRAWLER TRÊN VPS HOÀN TẤT 100%!")

if __name__ == '__main__':
    main()
