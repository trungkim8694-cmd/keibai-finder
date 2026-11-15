import paramiko
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('163.44.116.98', username='root', password='Hrptlcct6789@')

sftp = client.open_sftp()
local_script = os.path.join(os.path.dirname(__file__), 'sync_agencies_to_db.py')
remote_script = '/tmp/sync_agencies_to_db.py'
sftp.put(local_script, remote_script)
sftp.close()

# Also make sure DATABASE_URL is available
# In /app/crawler or /app/web/.env
cmd = """
cd /tmp
# Export DATABASE_URL from /app/crawler/.env or /app/web/.env
if [ -f /app/crawler/.env ]; then
  export $(grep -v '^#' /app/crawler/.env | xargs)
elif [ -f /app/web/.env ]; then
  export $(grep -v '^#' /app/web/.env | xargs)
fi
echo "DATABASE_URL is: ${DATABASE_URL:0:30}..."
python3 /tmp/sync_agencies_to_db.py
"""

stdin, stdout, stderr = client.exec_command(cmd)
while True:
    line = stdout.readline()
    if not line:
        break
    print(line, end='')

err = stderr.read().decode()
if err:
    print("ERR:", err)

client.close()

