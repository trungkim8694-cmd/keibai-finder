#!/usr/bin/env python3
"""
Deploy Cloudflare Edge Cache Rules for Keibai-Koubai
===================================================
Applies Two-Tier Caching architecture (Cloudflare Edge + Next.js):
- Rule 01: Bypass /api/, /dashboard, /admin, /login, session cookies
- Rule 02: Cache Everything Public Property Directory & Hubs (Edge TTL 7 days)
- Enable Smart Tiered Cache (Tokyo/Osaka Super-POPs)
"""

import os
import json
import urllib.request
import urllib.error

EMAIL = os.environ.get("CLOUDFLARE_EMAIL", "trungkim8694@gmail.com")
KEY = os.environ.get("CLOUDFLARE_API_KEY", "")
ZONE_ID = os.environ.get("CLOUDFLARE_ZONE_ID", "0e005363ce4ec2f4ae7cecaa4b30236c")

HEADERS = {
    "X-Auth-Email": EMAIL,
    "X-Auth-Key": KEY,
    "Content-Type": "application/json"
}

def call_cf(method: str, path: str, data=None):
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/{path}"
    data_bytes = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=data_bytes, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        try:
            return json.loads(err)
        except Exception:
            return {"error": f"HTTP {e.code}: {err}"}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("=" * 70)
    print("🚀 TRIỂN KHAI CLOUDFLARE EDGE CACHE RULES CHO KEIBAI-KOUBAI.COM")
    print("=" * 70)

    # 1. Enable Smart Tiered Cache
    print("[1] Bật Smart Tiered Cache...")
    tc = call_cf("PATCH", "cache/tiered_cache_smart_topology_enable", {"value": "on"})
    print("   -> Kết quả:", tc.get("result", tc))

    # 2. Build Cache Rule Expression
    hubs = [
        "/property/", "/search/", "/area-map", "/auction", "/blogs", 
        "/insights", "/market-insights", "/trade-find", "/agencies", 
        "/features", "/map", "/terms", "/privacy", "/sitemap"
    ]
    contains_parts = [f'(http.request.uri.path contains "{h}")' for h in hubs]
    full_cache_expr = f'({" or ".join(contains_parts)}) or (http.request.uri.path eq "/")'

    rules = [
        {
            "description": "01_Bypass_Private_And_API_And_Authenticated",
            "expression": '(starts_with(http.request.uri.path, "/api/")) or (http.request.uri.path contains "/dashboard") or (http.request.uri.path contains "/admin") or (http.request.uri.path contains "/login") or (http.cookie contains "session-token") or (http.request.method ne "GET" and http.request.method ne "HEAD")',
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": False
            },
            "enabled": True
        },
        {
            "description": "02_Cache_Public_Property_Directory_And_Hubs",
            "expression": f'({full_cache_expr}) and not ((starts_with(http.request.uri.path, "/api/")) or (http.request.uri.path contains "/dashboard") or (http.request.uri.path contains "/admin") or (http.request.uri.path contains "/login") or (http.cookie contains "session-token"))',
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": True,
                "edge_ttl": {
                    "mode": "override_origin",
                    "default": 3600    # 1 hour (prevents stale HTML referencing old Vercel CSS hashes)
                },
                "browser_ttl": {
                    "mode": "respect_origin"  # Respect Next.js max-age=0, must-revalidate for HTML
                },
                "serve_stale": {
                    "disable_stale_while_updating": False
                }
            },
            "enabled": True
        }
    ]

    # 3. Check existing rulesets
    print("\n[2] Kiểm tra ruleset http_request_cache_settings hiện tại...")
    existing = call_cf("GET", "rulesets")
    cache_ruleset_id = None
    if "result" in existing:
        for r in existing["result"]:
            if r.get("phase") == "http_request_cache_settings" and r.get("kind") == "zone":
                cache_ruleset_id = r["id"]
                break

    if cache_ruleset_id:
        print(f"   [*] Đã tìm thấy Ruleset ID: {cache_ruleset_id}, đang cập nhật...")
        res = call_cf("PUT", f"rulesets/{cache_ruleset_id}", {"rules": rules})
    else:
        print("   [*] Chưa có Cache Ruleset, đang tạo mới...")
        res = call_cf("POST", "rulesets", {
            "name": "Keibai-Koubai Edge Cache Rules",
            "kind": "zone",
            "phase": "http_request_cache_settings",
            "rules": rules
        })

    if res.get("success"):
        print("   ✅ Triển khai Cloudflare Cache Rules THÀNH CÔNG 100%!")
        for r in res.get("result", {}).get("rules", []):
            print(f"      - Rule: {r.get('description')} (Enabled: {r.get('enabled')})")
    else:
        print("   ❌ Lỗi:", res)

if __name__ == "__main__":
    main()
