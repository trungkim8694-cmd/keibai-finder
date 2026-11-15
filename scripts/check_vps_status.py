import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

cmds = [
    "docker ps -a",
    "systemctl list-timers",
    "ls -la /app",
    "git -C /app status 2>/dev/null || echo 'not git repo'",
    "git -C /app/web status 2>/dev/null || echo 'not git repo'"
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8'))

ssh.close()
