import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=15)

remote_script = """
import sys
sys.path.append('/app/crawler')
import advanced_crawler
advanced_crawler.region_blocks = [('01', ['91'])]
advanced_crawler.crawl_active_bit()
"""

stdin, stdout, stderr = ssh.exec_command(f"/app/venv/bin/python -c \"{remote_script}\"")
print(stdout.read().decode('utf-8'))
err = stderr.read().decode('utf-8')
if err:
    print("ERR:", err)
ssh.close()
