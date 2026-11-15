import os
import sys
import time
import requests
import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.getenv('DATABASE_URL')
if not DB_URL:
    try:
        from dotenv import load_dotenv
        load_dotenv('web/.env')
        load_dotenv('web/.env.local')
        DB_URL = os.getenv('DATABASE_URL')
    except Exception:
        pass

if not DB_URL:
    print("❌ ERROR: DATABASE_URL not found!")
    sys.exit(1)

API_BASE = "https://kigyoulist.com/api/external/takken-agencies"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def sync_agencies():
    print("🚀 Bắt đầu quá trình đồng bộ 26,035 công ty từ Kigyoulist vào PostgreSQL...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    # Get total items
    try:
        r = requests.get(f"{API_BASE}?page=1&limit=100", headers=HEADERS, timeout=40)
        if not r.ok:
            print(f"❌ API error: status {r.status_code}")
            return
        data = r.json()
        total_items = data.get('total', 26035)
        print(f"✅ Kết nối API thành công! Tổng số công ty: {total_items}")
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")
        return

    limit = 100
    total_pages = (total_items + limit - 1) // limit

    cur.execute('SELECT COUNT(*) FROM "RealEstateCompany";')
    current_count = cur.fetchone()[0]
    print(f"📊 Hiện tại trong CSDL đã có: {current_count} công ty.")

    upsert_sql = """
    INSERT INTO "RealEstateCompany" (
        id, "houjinNumber", "companyName", "licenseNumber",
        prefecture, city, address, "postalCode", phone, fax,
        email, website, "logoUrl", description, "isClaimed",
        "isVerified", specialties, status, created_at, updated_at
    ) VALUES %s
    ON CONFLICT ("houjinNumber") DO UPDATE SET
        "companyName" = EXCLUDED."companyName",
        "licenseNumber" = EXCLUDED."licenseNumber",
        "prefecture" = EXCLUDED."prefecture",
        "city" = EXCLUDED."city",
        "address" = EXCLUDED."address",
        "postalCode" = COALESCE(EXCLUDED."postalCode", "RealEstateCompany"."postalCode"),
        phone = COALESCE("RealEstateCompany".phone, EXCLUDED.phone),
        website = COALESCE("RealEstateCompany".website, EXCLUDED.website),
        specialties = EXCLUDED.specialties,
        status = EXCLUDED.status,
        updated_at = NOW();
    """

    start_time = time.time()
    total_synced = 0
    page = 1

    while page <= total_pages:
        url = f"{API_BASE}?page={page}&limit={limit}"
        success = False
        for retry in range(4):
            try:
                t0 = time.time()
                res = requests.get(url, headers=HEADERS, timeout=45)
                if res.ok:
                    res_json = res.json()
                    agencies = res_json.get('agencies', [])
                    if not agencies:
                        print(f"⚠️ Page {page} returned empty agencies list.")
                        success = True
                        break

                    # Deduplicate within batch by houjinNumber
                    seen_houjin = set()
                    rows = []
                    for a in agencies:
                        houjin = a.get('corporateNumber') or a.get('houjinNumber')
                        if not houjin:
                            continue
                        if houjin in seen_houjin:
                            continue
                        seen_houjin.add(houjin)

                        c_id = a.get('id') or f"kg_{houjin}"
                        name = a.get('companyName') or '名称未設定'
                        lic = a.get('licenseNumber') or '宅建免許'
                        pref = a.get('prefecture') or '全国'
                        city = a.get('city') or ''
                        addr = a.get('address') or (pref + city)
                        postal = a.get('postalCode')
                        phone = a.get('phone')
                        fax = a.get('fax')
                        email = a.get('email')
                        web = a.get('website')
                        logo = a.get('logoUrl')
                        desc = a.get('description') or ''
                        claimed = False
                        verified = False
                        specs = a.get('specialties') or ["宅建免許保有"]
                        status = a.get('status') or 'ACTIVE'

                        rows.append((
                            c_id, houjin, name, lic, pref, city, addr,
                            postal, phone, fax, email, web, logo, desc,
                            claimed, verified, specs, status
                        ))

                    if rows:
                        execute_values(
                            cur,
                            upsert_sql,
                            rows,
                            template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())"
                        )
                        conn.commit()
                        total_synced += len(rows)

                    if page % 10 == 0 or page == 1 or page == total_pages:
                        print(f"📦 [Page {page}/{total_pages}] Đã nạp +{len(rows)} cty (Tổng phiên: {total_synced}, Thời gian: {time.time()-t0:.2f}s)")
                    sys.stdout.flush()
                    success = True
                    break
                else:
                    print(f"⚠️ Page {page} retry {retry+1} status {res.status_code}")
                    conn.rollback()
                    time.sleep(2)
            except Exception as e:
                print(f"⚠️ Page {page} retry {retry+1} error: {e}")
                conn.rollback()
                time.sleep(2)

        if not success:
            print(f"❌ Bỏ qua page {page} sau 4 lần thử thất bại.")

        page += 1
        time.sleep(0.05)

    cur.close()
    conn.close()
    elapsed = time.time() - start_time
    print(f"🎉 Hoàn tất đồng bộ! Nạp thành công {total_synced} công ty trong {elapsed/60:.2f} phút.")

if __name__ == '__main__':
    sync_agencies()
