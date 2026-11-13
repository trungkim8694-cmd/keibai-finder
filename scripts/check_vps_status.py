import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

stdin, stdout, stderr = ssh.exec_command("cd /app/crawler && /app/venv/bin/python3 -c 'import keibai_trend_tool; print(\"OK\")'")
print("Output:", stdout.read().decode('utf-8').strip())
err = stderr.read().decode('utf-8').strip()
if err:
    print("Err:", err)

ssh.close()
