import urllib.request, re

url = 'https://www.keibai-koubai.com/agencies'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Next.js renders companyName inside RSC serialized payload
names = re.findall(r'companyName\\":\\"([^\\"]+)\\"', html)
if not names:
    names = re.findall(r'\\"companyName\\":\\"([^\\"]+)\\"', html)
print('Regex matched company names in RSC stream:', len(names))
for i, n in enumerate(names[:5], 1):
    print(f" {i}. {n}")
