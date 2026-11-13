import subprocess
import os

bat_path = r"G:\My Drive\LapTrinh\keibaiKoubai\run_localhost.bat"

# CREATE_NEW_CONSOLE = 0x00000010
CREATE_NEW_CONSOLE = 16

p = subprocess.Popen(
    ["cmd.exe", "/c", bat_path],
    creationflags=CREATE_NEW_CONSOLE,
    cwd=r"G:\My Drive\LapTrinh\keibaiKoubai"
)

print(f"Launched dev server in separate Windows Console (PID: {p.pid})")

