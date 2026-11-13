import paramiko
import re

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

stdin, stdout, stderr = ssh.exec_command("grep -E 'Đang cào tài sản đang mở thầu:|Phát hiện [0-9]+ tài sản' /app/logs/daily_crawler_2026-11-13.log")
log_text = stdout.read().decode('utf-8', errors='replace')

current_pref = ""
pref_items = {}
for line in log_text.splitlines():
    m_pref = re.search(r'Đang cào tài sản đang mở thầu:\s*([^\(]+)', line)
    if m_pref:
        current_pref = m_pref.group(1).strip()
        pref_items[current_pref] = 0
    m_cnt = re.search(r'Phát hiện (\d+) tài sản', line)
    if m_cnt and current_pref:
        pref_items[current_pref] += int(m_cnt.group(1))

print("Properties detected per prefecture during 2026-11-13 run:")
total_detected = 0
for p, c in pref_items.items():
    print(f"  {p}: {c} items")
    total_detected += c
print(f"TOTAL DETECTED IN LOG: {total_detected}")

ssh.close()
