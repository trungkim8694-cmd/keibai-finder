import paramiko
import os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('163.44.116.98', username='root', password='Hrptlcct6789@')

sftp = client.open_sftp()
sftp.put(r'g:\My Drive\LapTrinh\keibaiKoubai\scripts\test_bench.py', '/tmp/test_bench.py')
sftp.close()

stdin, stdout, stderr = client.exec_command('python3 /tmp/test_bench.py')
print(stdout.read().decode())
print(stderr.read().decode())
client.close()

