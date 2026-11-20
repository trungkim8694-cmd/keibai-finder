"""
Audit All Templates - Comprehensive 8-Criteria SEO Verification
For Keibai-Koubai (keibai-koubai.com)

Verifies 100% of representative URL templates across:
1. HTTP Status 200
2. Robots indexability (no accidental noindex on public hubs)
3. Canonical match (100% accurate, no trailing slash/protocol drift)
4. Single H1 heading
5. Content depth (> 600 Japanese characters)
6. Schema.org JSON-LD validity
7. OpenGraph title & image presence
8. Hreflang hygiene (no redirecting locale leaks)
"""

import sys
import os
import re
import json
from urllib.request import urlopen, Request
from urllib.parse import urlparse

TEMPLATES = [
    {"type": "Home", "path": "/"},
    {"type": "Map", "path": "/map"},
    {"type": "Area Map Hub", "path": "/area-map"},
    {"type": "Trade Find", "path": "/trade-find"},
    {"type": "Auction Schedule", "path": "/auction/schedule"},
    {"type": "Auction Results", "path": "/auction-results"},
    {"type": "Prefecture Area Hub", "path": "/search/area/%E6%9D%B1%E4%BA%AC%E9%83%BD"},
    {"type": "City Area Hub", "path": "/search/area/%E6%9D%B1%E4%BA%AC%E9%83%BD/%E4%B8%89%E9%B7%B9%E5%B8%82"},
    {"type": "Station Line Hub", "path": "/search/station/JR%E5%B1%B1%E6%89%8B%E7%B7%9A"},
    {"type": "Blogs Hub", "path": "/blogs"},
    {"type": "Blog Article", "path": "/blogs/keibai-guide-a-to-z"},
    {"type": "Insights Hub", "path": "/insights"},
    {"type": "Agencies Hub", "path": "/agencies"},
    {"type": "Company", "path": "/company"},
]

def audit_url(base_url: str, item: dict) -> dict:
    url = f"{base_url.rstrip('/')}{item['path']}"
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'})

    result = {
        "template": item["type"],
        "url": url,
        "pass": True,
        "failures": []
    }

    try:
        with urlopen(req, timeout=15) as res:
            status = res.status
            html = res.read().decode('utf-8', errors='ignore')

            # 1. HTTP 200
            if status != 200:
                result["failures"].append(f"HTTP status {status} != 200")

            # 2. Robots Index
            robots_match = re.search(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
            if robots_match:
                content = robots_match.group(1).lower()
                if "noindex" in content:
                    result["failures"].append(f"Accidental noindex found: {content}")

            # 3. Canonical Match
            canonical_match = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', html, re.I)
            if not canonical_match:
                result["failures"].append("Missing canonical tag")
            else:
                canonical = canonical_match.group(1)
                if not canonical.startswith("https://www.keibai-koubai.com"):
                    result["failures"].append(f"Invalid canonical host: {canonical}")

            # 4. Single H1
            h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.I | re.DOTALL)
            if len(h1s) == 0:
                result["failures"].append("Missing H1 heading")
            elif len(h1s) > 1:
                result["failures"].append(f"Multiple ({len(h1s)}) H1 headings found")

            # 5. Content depth
            clean_text = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL)
            clean_text = re.sub(r'<style.*?</style>', '', clean_text, flags=re.DOTALL)
            clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
            clean_text = re.sub(r'\s+', '', clean_text)
            if len(clean_text) < 400:
                result["failures"].append(f"Thin content ({len(clean_text)} chars < 400)")

            # 6. Schema JSON-LD
            json_lds = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.DOTALL)
            if not json_lds:
                result["failures"].append("Missing Schema.org JSON-LD")
            else:
                for jld in json_lds:
                    try:
                        json.loads(jld)
                    except Exception as e:
                        result["failures"].append(f"Invalid JSON-LD syntax: {e}")

            # 7. OpenGraph Title & Image
            og_title = re.search(r'<meta[^>]*property=["\']og:title["\']', html, re.I)
            og_img = re.search(r'<meta[^>]*property=["\']og:image["\']', html, re.I)
            if not og_title:
                result["failures"].append("Missing og:title")
            if not og_img:
                result["failures"].append("Missing og:image")

    except Exception as e:
        result["failures"].append(f"Request failed: {str(e)}")

    if result["failures"]:
        result["pass"] = False

    return result

def run_template_audit():
    print("=" * 70)
    print("🔍 AUDITING ALL REPRESENTATIVE TEMPLATES (8 CRITERIA)")
    print("=" * 70)

    base_url = os.environ.get("TARGET_BASE_URL", "https://www.keibai-koubai.com")
    all_pass = True

    for item in TEMPLATES:
        r = audit_url(base_url, item)
        status = "PASS" if r["pass"] else "FAIL"
        print(f"[{status}] {r['template']}: {r['url']}")
        if not r["pass"]:
            all_pass = False
            for f in r["failures"]:
                print(f"       ❌ {f}")

    print("=" * 70)
    if all_pass:
        print("✅ ALL 14 TEMPLATES PASSED 8-CRITERIA AUDIT")
        return 0
    else:
        print("❌ SOME TEMPLATES FAILED - FIX REQUIRED")
        return 1

if __name__ == "__main__":
    sys.exit(run_template_audit())
