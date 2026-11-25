import os
import shutil
import tarfile
import paramiko

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    web_dir = os.path.join(root, 'web')
    standalone_dir = os.path.join(web_dir, '.next', 'standalone')
    static_dir = os.path.join(web_dir, '.next', 'static')
    public_dir = os.path.join(web_dir, 'public')
    archive_path = os.path.join(root, 'web_standalone.tar.gz')

    print("📦 [1/5] Sao chép static & public vào standalone...")
    target_static = os.path.join(standalone_dir, '.next', 'static')
    if os.path.exists(target_static):
        shutil.rmtree(target_static)
    shutil.copytree(static_dir, target_static)
    print("   + Đã sao chép .next/static -> standalone/.next/static")

    target_public = os.path.join(standalone_dir, 'public')
    for item in os.listdir(public_dir):
        s = os.path.join(public_dir, item)
        d = os.path.join(target_public, item)
        if os.path.isdir(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print("   + Đã sao chép public -> standalone/public")

    print(f"📦 [2/5] Nén thư mục standalone thành {archive_path}...")
    if os.path.exists(archive_path):
        os.remove(archive_path)

    with tarfile.open(archive_path, "w:gz") as tar:
        for item in os.listdir(standalone_dir):
            item_path = os.path.join(standalone_dir, item)
            tar.add(item_path, arcname=item)
    size_mb = os.path.getsize(archive_path) / (1024 * 1024)
    print(f"   + Kích thước gói nén: {size_mb:.2f} MB")

    print("🚀 [3/5] Kết nối SSH tới ConoHa VPS (163.44.116.98)...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('163.44.116.98', port=22, username='root', password='Hrptlcct6789@', timeout=30, look_for_keys=False, allow_agent=False)
    print("   + SSH kết nối thành công!")

    print("📤 [4/5] Tải gói nén lên VPS qua SFTP...")
    sftp = ssh.open_sftp()
    remote_archive = "/app/web_standalone.tar.gz"
    
    def progress_callback(transferred, total):
        pct = (transferred / total) * 100
        print(f"\r   + Đang tải: {pct:.1f}% ({transferred / 1024 / 1024:.1f}/{total / 1024 / 1024:.1f} MB)", end='', flush=True)

    sftp.put(archive_path, remote_archive, callback=progress_callback)
    print("\n   + Tải lên hoàn tất!")
    sftp.close()

    print("📂 [5/5] Giải nén trên VPS tại /app/web_standalone...")
    remote_cmds = [
        "mkdir -p /app/web_standalone",
        "tar -xzf /app/web_standalone.tar.gz -C /app/web_standalone",
        "cp /app/web/.env.local /app/web_standalone/.env.local 2>/dev/null || true",
        "cp /app/web/.env /app/web_standalone/.env 2>/dev/null || true",
        "rm -f /app/web_standalone.tar.gz",
        "pm2 restart keibai-web",
        "ls -la /app/web_standalone"
    ]
    for cmd in remote_cmds:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    stdin, stdout, stderr = ssh.exec_command("ls -la /app/web_standalone")
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("✅ Đồng bộ bản build lên ConoHa VPS thành công!")

if __name__ == '__main__':
    main()
