import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

sftp = ssh.open_sftp()

files_to_sync = [
    ('crawler/advanced_crawler.py', '/app/crawler/advanced_crawler.py'),
    ('crawler/run_daily_vps.sh', '/app/crawler/run_daily_vps.sh'),
    ('crawler/nta_parser.py', '/app/crawler/nta_parser.py'),
    ('crawler/crawler_utils.py', '/app/crawler/crawler_utils.py'),
]

for local_rel, remote_path in files_to_sync:
    local_path = os.path.abspath(local_rel)
    print(f"Uploading {local_path} -> {remote_path}...")
    sftp.put(local_path, remote_path)

sftp.close()

stdin, stdout, stderr = ssh.exec_command("chmod +x /app/crawler/*.sh /app/crawler/*.py && rm -f /app/crawler/advanced_crawler_state.json")
stdout.channel.recv_exit_status()
print("Uploaded and permissions updated. Checkpoint removed.")

ssh.close()

