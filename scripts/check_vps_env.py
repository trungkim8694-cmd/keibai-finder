import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=10)

stdin, stdout, stderr = ssh.exec_command('find /root /home /etc /var /app -name "*.env*" 2>/dev/null | grep -v node_modules | head -n 30')
print('Found env files on VPS:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('grep -rn "TELEGRAM" /root /etc /home 2>/dev/null || true')
print('Grep TELEGRAM:')
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('cat /root/.bash_history 2>/dev/null | grep -i telegram || true')
print('Bash history telegram:')
print(stdout.read().decode())

ssh.close()
