import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

stdin, stdout, stderr = ssh.exec_command("sed -n '617,700p' /app/logs/daily_crawler_2026-11-13.log")
print(stdout.read().decode('utf-8'))

ssh.close()
