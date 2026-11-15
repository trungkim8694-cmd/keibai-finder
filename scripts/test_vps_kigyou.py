import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('163.44.116.98', username='root', password='Hrptlcct6789@')

cmd = """python3 -c "
import requests, json
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
res = requests.get('https://kigyoulist.com/api/external/takken-agencies?limit=1', headers=headers, timeout=10)
data = res.json()
print(json.dumps(data.get('agencies', [])[0], ensure_ascii=False, indent=2))
" """

stdin, stdout, stderr = client.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("OUT:\n", out)
if err:
    print("ERR:\n", err)
client.close()
