import urllib.request, re

html = urllib.request.urlopen('http://localhost:3000').read().decode('utf-8')
css_urls = re.findall(r'href="(/_next/static/css/[^"]+)"', html)
print("CSS_URLS:", css_urls)
for url in css_urls:
    full_url = f"http://localhost:3000{url}"
    req = urllib.request.Request(full_url, method='HEAD')
    res = urllib.request.urlopen(req)
    print(f"{url} -> status {res.status}, length: {res.headers.get('content-length')}")
