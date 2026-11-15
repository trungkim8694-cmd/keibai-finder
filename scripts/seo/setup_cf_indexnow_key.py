import os, requests, paramiko
from dotenv import load_dotenv

load_dotenv(r"c:\kigyou-list\.env.local")
load_dotenv(r"c:\kigyou-list\.env")

KEY1 = "7c742571ab6a4103aa339488f8220031"
KEY2 = "0a1fbe0a7866441bb57817e0bf538068"
ZONE_ID = "0e005363ce4ec2f4ae7cecaa4b30236c"
EMAIL = os.environ.get("CLOUDFLARE_EMAIL", "trungkim8694@gmail.com")
API_KEY = os.environ.get("CLOUDFLARE_API_KEY", "")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("163.44.116.98", port=22, username="root", password="Hrptlcct6789@", timeout=15)
ssh.exec_command(f"echo -n '{KEY1}' > /var/www/keibai-images/{KEY1}.txt && echo -n '{KEY2}' > /var/www/keibai-images/{KEY2}.txt")[1].read()
ssh.close()
print("✅ Created both key files on VPS /var/www/keibai-images/")

headers = {
    "X-Auth-Email": EMAIL,
    "X-Auth-Key": API_KEY,
    "Content-Type": "application/json",
}
url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/rulesets/phases/http_request_transform/entrypoint"
payload = {
    "description": "IndexNow Key Verification Rewrites",
    "rules": [
        {
            "action": "rewrite",
            "action_parameters": {"uri": {"path": {"value": f"/vps-images/{KEY1}.txt"}}},
            "expression": f'(http.request.uri.path eq "/{KEY1}.txt")',
            "description": "Serve IndexNow verification key 1 from VPS",
            "enabled": True,
        },
        {
            "action": "rewrite",
            "action_parameters": {"uri": {"path": {"value": f"/vps-images/{KEY2}.txt"}}},
            "expression": f'(http.request.uri.path eq "/{KEY2}.txt")',
            "description": "Serve IndexNow verification key 2 from VPS",
            "enabled": True,
        },
    ],
}
r = requests.put(url, headers=headers, json=payload, timeout=15)
print("Cloudflare Transform Rule status:", r.status_code, r.json().get("success"))
