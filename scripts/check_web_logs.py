import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

print("--- NGINX SITES ---")
stdin, stdout, stderr = ssh.exec_command("cat /etc/nginx/sites-enabled/* /etc/nginx/conf.d/* 2>/dev/null")
print(stdout.read().decode('utf-8'))

print("--- PM2 OF ALL USERS ---")
stdin, stdout, stderr = ssh.exec_command("pm2 list --all 2>/dev/null || su - ubuntu -c 'pm2 list'")
print(stdout.read().decode('utf-8'))

ssh.close()
