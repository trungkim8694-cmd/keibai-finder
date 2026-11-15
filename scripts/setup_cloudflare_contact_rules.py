import os
import urllib.request
import json

email = os.environ.get('CLOUDFLARE_EMAIL', 'trungkim8694@gmail.com')
key = os.environ.get('CLOUDFLARE_API_KEY', '')
zone_id = os.environ.get('CLOUDFLARE_ZONE_ID', '0e005363ce4ec2f4ae7cecaa4b30236c')

url = f'https://api.cloudflare.com/client/v4/zones/{zone_id}/rulesets'
payload = {
    'name': 'Rate Limit API Contact Form',
    'kind': 'zone',
    'phase': 'http_ratelimit',
    'rules': [
        {
            'action': 'block',
            'expression': '(http.request.uri.path eq "/api/contact" and http.request.method eq "POST")',
            'description': 'Rate limit /api/contact submissions to prevent bot spam',
            'ratelimit': {
                'characteristics': ['ip.src', 'cf.colo.id'],
                'period': 10,
                'requests_per_period': 2,
                'mitigation_timeout': 10
            },
            'enabled': True
        }
    ]
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'X-Auth-Email': email,
        'X-Auth-Key': key,
        'Content-Type': 'application/json'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print('Rate limit rule created:', res.get('success'))
except Exception as e:
    print('Exception:', e)
    if hasattr(e, 'read'):
        print(e.read().decode())
