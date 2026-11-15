import os
import sys
import re

errors = []
successes = []

print("=== Starting Milestone M1 Verification ===")

# 1. Verify robots.ts
robots_path = os.path.join("web", "src", "app", "robots.ts")
with open(robots_path, "r", encoding="utf-8") as f:
    robots_content = f.read()

ai_block_match = re.search(r"userAgent:\s*\[[\s\S]*?\'GPTBot\'[\s\S]*?\][\s\S]*?disallow:\s*\[([\s\S]*?)\]", robots_content)
if not ai_block_match:
    errors.append("robots.ts: AI crawler block with disallow not found")
else:
    disallow_items = [item.strip().strip("'\",") for item in ai_block_match.group(1).split("\n") if item.strip().strip("'\",")]
    if "/*?*keyword=*" not in disallow_items:
        errors.append("robots.ts: /*?*keyword=* not found in AI crawlers disallow array")
    else:
        successes.append("robots.ts: /*?*keyword=* correctly included in AI crawlers disallow array (RFC 9309 compliant)")

# 2. Verify sitemap.ts
sitemap_path = os.path.join("web", "src", "app", "sitemap.ts")
with open(sitemap_path, "r", encoding="utf-8") as f:
    sitemap_content = f.read()

if "export const revalidate = 86400;" not in sitemap_content:
    errors.append("sitemap.ts: export const revalidate = 86400; not found")
else:
    successes.append("sitemap.ts: export const revalidate = 86400; present")

core_routes_needed = ["/blogs", "/insights", "/area-map", "/search/area", "/search/station"]
for route in core_routes_needed:
    if f"${{baseUrl}}{route}" not in sitemap_content and route not in sitemap_content:
        errors.append(f"sitemap.ts: route {route} missing from coreRoutes")
    else:
        successes.append(f"sitemap.ts: route {route} present in coreRoutes")

if "try {" not in sitemap_content or "catch (error)" not in sitemap_content or "return coreRoutes;" not in sitemap_content:
    errors.append("sitemap.ts: try/catch block with fallback to coreRoutes missing")
else:
    successes.append("sitemap.ts: try/catch block with graceful fallback to coreRoutes present")

# Check activeProperties filter
if not re.search(r"activeProperties\s*=\s*await\s+prisma\.property\.findMany\(\{[\s\S]*?where:\s*\{[\s\S]*?status:\s*['\"]ACTIVE['\"]", sitemap_content):
    errors.append("sitemap.ts: activeProperties query missing status: ACTIVE")
else:
    successes.append("sitemap.ts: activeProperties has status: ACTIVE filter")

# Check distinctLocations filter
if not re.search(r"distinctLocations\s*=\s*await\s+prisma\.property\.groupBy\(\{[\s\S]*?status:\s*['\"]ACTIVE['\"]", sitemap_content):
    errors.append("sitemap.ts: distinctLocations groupBy missing status: ACTIVE")
else:
    successes.append("sitemap.ts: distinctLocations has status: ACTIVE filter")

# Check articles category filter
if not re.search(r"articles\s*=\s*await\s+prisma\.dailyDigest\.findMany\(\{[\s\S]*?category:\s*\{\s*in:\s*\[['\" ]*MARKET_REPORT['\" ]*,\s*['\" ]*GUIDE['\" ]*,\s*['\" ]*CAUTION['\" ]*\]\s*\}", sitemap_content):
    errors.append("sitemap.ts: articles query missing category in [MARKET_REPORT, GUIDE, CAUTION]")
else:
    successes.append("sitemap.ts: articles query has category in [MARKET_REPORT, GUIDE, CAUTION] filter")

# 3. Verify search/area/[prefecture]/[city]/page.tsx
area_page_path = os.path.join("web", "src", "app", "search", "area", "[prefecture]", "[city]", "page.tsx")
with open(area_page_path, "r", encoding="utf-8") as f:
    area_content = f.read()

if "safeDecodeURIComponent" not in area_content:
    errors.append("area page.tsx: safeDecodeURIComponent helper not found")
else:
    successes.append("area page.tsx: safeDecodeURIComponent helper implemented")

if "${currentYear}年最新" not in area_content or "getFullYear()" not in area_content:
    errors.append("area page.tsx: dynamic current year not found in title")
else:
    successes.append("area page.tsx: dynamic current year implemented in CTR title")

if "nulls: 'last'" not in area_content or "sort: 'asc'" not in area_content:
    errors.append("area page.tsx: starting_price nulls last sorting not found")
else:
    successes.append("area page.tsx: starting_price nulls last sorting implemented")

if "bid_end_date: { gte: now }" not in area_content:
    errors.append("area page.tsx: active bid_end_date check missing in generateMetadata")
else:
    successes.append("area page.tsx: active bid_end_date check aligned in generateMetadata")

# 4. Verify search/station/[line]/[station]/page.tsx
station_page_path = os.path.join("web", "src", "app", "search", "station", "[line]", "[station]", "page.tsx")
with open(station_page_path, "r", encoding="utf-8") as f:
    station_content = f.read()

if "safeDecodeURIComponent" not in station_content:
    errors.append("station page.tsx: safeDecodeURIComponent helper not found")
else:
    successes.append("station page.tsx: safeDecodeURIComponent helper implemented")

if "${currentYear}年最新" not in station_content or "getFullYear()" not in station_content:
    errors.append("station page.tsx: dynamic current year not found in title")
else:
    successes.append("station page.tsx: dynamic current year implemented in CTR title")

if "nulls: 'last'" not in station_content or "sort: 'asc'" not in station_content:
    errors.append("station page.tsx: starting_price nulls last sorting not found")
else:
    successes.append("station page.tsx: starting_price nulls last sorting implemented")

if "bid_end_date: { gte: now }" not in station_content:
    errors.append("station page.tsx: active bid_end_date check missing in generateMetadata")
else:
    successes.append("station page.tsx: active bid_end_date check aligned in generateMetadata")

# 5. Verify property/[id]/page.tsx
property_page_path = os.path.join("web", "src", "app", "property", "[id]", "page.tsx")
with open(property_page_path, "r", encoding="utf-8") as f:
    property_content = f.read()

if "!isNaN(bidEndDate.getTime())" not in property_content:
    errors.append("property page.tsx: safe date parsing !isNaN(...getTime()) not found")
else:
    successes.append("property page.tsx: safe date parsing for bidEndDate implemented")

if "https://schema.org/Discontinued" not in property_content or "https://schema.org/InStock" not in property_content:
    errors.append("property page.tsx: conditional availability (InStock / Discontinued) not found")
else:
    successes.append("property page.tsx: conditional availability (InStock vs Discontinued) implemented")

if "priceValidUntil" not in property_content:
    errors.append("property page.tsx: priceValidUntil not found in offers schema")
else:
    successes.append("property page.tsx: priceValidUntil included in offers schema")

print(f"\nVerification Results: {len(successes)} checks passed, {len(errors)} errors.\n")
for s in successes:
    print(f"  [PASS] {s}")
if errors:
    for e in errors:
        print(f"  [FAIL] {e}")
    sys.exit(1)
else:
    print("\nALL VERIFICATION CHECKS PASSED PERFECTLY!")
