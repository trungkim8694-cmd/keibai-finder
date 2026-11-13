import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

cmd = "nohup /app/crawler/run_daily_vps.sh > /app/logs/manual_daily_run.log 2>&1 &"
print(f"Triggering on VPS: {cmd}")
ssh.exec_command(cmd)

time.sleep(3)

stdin, stdout, stderr = ssh.exec_command("ps aux | grep -E 'run_daily_vps|advanced_crawler' | grep -v grep")
print("Running processes:")
print(stdout.read().decode('utf-8').strip())

stdin, stdout, stderr = ssh.exec_command("head -n 30 /app/logs/manual_daily_run.log")
print("\nLog preview:")
print(stdout.read().decode('utf-8').strip())

ssh.close()

