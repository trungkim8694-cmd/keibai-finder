import paramiko

env = {}
with open('scripts/vps_config.env', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(env['VPS_IP'], username=env['VPS_USER'], password=env['VPS_PASSWORD'])
stdin, stdout, stderr = ssh.exec_command('ls -la /app/web')
print(stdout.read().decode())
ssh.close()
