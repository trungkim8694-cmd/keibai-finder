import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

commands = [
    "head -n 50 /app/logs/daily_crawler_2026-11-13.log",
    "grep -E 'Hoàn tất|CÀO XONG|Region|Tỉnh thành|GHOST SWEEP|Phát hiện' /app/logs/daily_crawler_2026-11-13.log | head -n 40",
    "tail -n 60 /app/logs/daily_crawler_2026-11-13.log"
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip())

ssh.close()
