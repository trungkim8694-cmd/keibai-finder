import os
import paramiko

cfg = {}
with open('scripts/vps_config.env', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            cfg[k.strip()] = v.strip().strip('"').strip("'")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(cfg['VPS_IP'], username=cfg['VPS_USER'], password=cfg['VPS_PASSWORD'])
sftp = ssh.open_sftp()
sftp.put('web/.env.local', '/app/web/.env.local')
sftp.put('web/.env.local', '/app/web/.env')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('grep NEXT_PUBLIC_GA_MEASUREMENT_ID /app/web/.env.local')
print("VPS .env.local verification:", stdout.read().decode())
ssh.close()
