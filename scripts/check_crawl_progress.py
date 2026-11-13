import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

stdin, stdout, stderr = ssh.exec_command("tail -n 25 /app/logs/manual_daily_run.log")
print(stdout.read().decode('utf-8'))

ssh.close()

