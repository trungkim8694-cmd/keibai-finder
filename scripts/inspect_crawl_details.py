import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

commands = [
    "grep -c 'Lưu DB thành công' /app/logs/daily_crawler_2026-11-13.log",
    "grep -c 'Deep Crawl' /app/logs/daily_crawler_2026-11-13.log",
    "grep -c 'Đã Archive thành công' /app/logs/daily_crawler_2026-11-13.log",
    "grep -E 'Lỗi cào|Exception|Traceback' /app/logs/daily_crawler_2026-11-13.log | head -n 20"
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()
