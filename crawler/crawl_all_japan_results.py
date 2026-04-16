import asyncio
import os
import re
import json
import psycopg2
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import random

load_dotenv("../web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
gemini_key = os.environ.get("GEMINI_API_KEY")

from crawler_utils import geocode_address

def update_db(data):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    try:
        query = """INSERT INTO "AuctionResult" ("id", "caseNumber", "address", "lat", "lng", "basePrice", "winningPrice", "bidderCount", "winnerType", "marginRate", "competitionLevel", "raw_data", "created_at") 
                   VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, NOW())"""
        cur.execute(query, (
            data["caseNumber"], data["address"], data["lat"], data["lng"],
            data["basePrice"], data["winningPrice"], data["bidderCount"], data["winnerType"], 
            data.get("marginRate"), data.get("competitionLevel"), data["raw_data"]
        ))
        conn.commit()
        print(f"    Saved: {data['caseNumber']} | {data['address']}")
    except Exception as e:
        print(f"    DB Error: {e}")
    finally:
        cur.close()
        conn.close()

async def scrape_results():
    checkpoint_file = "crawler_checkpoints.json"
    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, "r") as f:
            checkpoints = json.load(f)
    else:
        checkpoints = []

    # KHỞI TẠO MEMORY CACHE TOÀN BỘ KẾT QUẢ ĐẤU GIÁ
    print("[Memory Cache] Đang tải toàn bộ dữ liệu Kết quả đấu giá từ CSDL vào RAM...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT "caseNumber", address FROM "AuctionResult"')
    memory_cache_results = {f"{row[0]}_{row[1]}" for row in cur.fetchall()}
    cur.close()
    conn.close()
    print(f"[Memory Cache] Đã tải {len(memory_cache_results)} Kết quả đấu giá.")

    async with async_playwright() as p:
        # Loop through regions 01 to 08
        for region_idx in range(1, 9):
            region_code = f"{region_idx:02d}"
            print(f"\n=== Starting Region {region_code} ===")
            
            # 1. Start a clean session for region map to get courts
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(locale="ja-JP")
            page = await context.new_page()
            
            try:
                await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
                await page.wait_for_load_state('domcontentloaded')
                await page.wait_for_function('typeof tranArea !== "undefined"', timeout=15000)
                # Step 1: Click Sold Results globally
                async with page.expect_navigation(timeout=30000):
                    await page.evaluate("tranArea('result','');")
                
                # Step 2: Navigate to Region
                async with page.expect_navigation(timeout=30000):
                    await page.evaluate(f"transProperty('{region_code}');")
                
                # Extract all prefecture/court logic exactly from the map areas
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                areas = soup.select('area[onclick*="showSearchCondition"]')
                
                court_args = []
                for a in areas:
                    onclick = a.get('onclick', '')
                    match = re.search(r"showSearchCondition\((.*?)\)", onclick)
                    if match:
                        args = [arg.strip(" '\"&quot;") for arg in match.group(1).split(",")]
                        court_args.append(args)
                        
                print(f"  Found {len(court_args)} courts in Region {region_code}")
                
            except Exception as e:
                print(f"  Failed loading Region {region_code}: {e}")
                await browser.close()
                continue
                
            await browser.close()
            
            # Loop through each court
            for args in court_args:
                court_name = args[2] if len(args) > 2 else "Unknown"
                if court_name in checkpoints:
                    print(f"\n  -> Skipping Court (Already crawled): {court_name}")
                    continue
                    
                print(f"\n  -> Crawling Court: {court_name} {args}")
                
                retry_count = 0
                max_retries = 3
                success = False
                
                while retry_count < max_retries and not success:
                    browser = await p.chromium.launch(headless=True)
                    context = await browser.new_context(locale="ja-JP")
                    page = await context.new_page()
                    try:
                        # Repetitive safe start
                        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
                        await page.wait_for_load_state('domcontentloaded')
                        await page.wait_for_function('typeof tranArea !== "undefined"', timeout=15000)
                        async with page.expect_navigation():
                            await page.evaluate("tranArea('result','');")
                        async with page.expect_navigation():
                            await page.evaluate(f"transProperty('{region_code}');")
                        
                        # Step 3: Select Court
                        await page.evaluate(f"showSearchCondition('{args[0]}', '{args[1]}', '{args[2]}');")
                        await page.wait_for_timeout(2000)
                        
                        # Step 4: Submit All Properties search
                        async with page.expect_navigation(timeout=30000):
                            await page.evaluate("submitAllPeroidForm();")
                        
                        await page.wait_for_load_state()
                        
                        # Step 5: Process Pagination
                        page_num = 1
                        while True:
                            html = await page.content()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            results = [r for r in soup.select('.bit__currentSearchCondition_regionBox') if '物件番号' in r.get_text()]
                            if not results:
                                print("    No results on this page or end of pagination.")
                                break
                            
                            print(f"    Processing Page {page_num} ({len(results)} items)")
                            for item in results:
                                case_num_tag = item.select_one('.bit__currentSearchCondition_regionHeader p.font-weight-bold')
                                case_num = case_num_tag.get_text(strip=True) if case_num_tag else "Unknown"
                                
                                address_icon = item.select_one('.bit__icon_access')
                                address_raw = address_icon.parent.get_text(strip=True) if address_icon and address_icon.parent else "Unknown"
                                
                                if not address_raw or address_raw in {"Unknown", "不明", "", "所在地不明", "-"}:
                                    print(f"    Skipping (No address): {case_num}")
                                    continue
                                    
                                # Memory Cache Verification O(1)
                                hash_key = f"{case_num}_{address_raw}"
                                if hash_key in memory_cache_results:
                                    print(f"    Skip Duplicate (Memory Cache): {case_num}")
                                    continue
                                memory_cache_results.add(hash_key)
                                
                                base_price, winning_price, bidder_count = None, None, None
                                winner_type = "Unknown"
                                
                                price_rows = item.select('.d-flex.align-items-sm-center.justify-content-between')
                                for pr in price_rows:
                                    txt = pr.get_text(separator=' ', strip=True)
                                    if "売却価額" in txt:
                                        wp = re.sub(r'[^\d]', '', txt.replace("売却価額", ""))
                                        if wp: winning_price = int(wp)
                                    elif "売却基準価額" in txt:
                                        bp = re.sub(r'[^\d]', '', txt.replace("売却基準価額", ""))
                                        if bp: base_price = int(bp)
                                
                                info_list = item.select('.bit__result_InfoList li')
                                if len(info_list) >= 4:
                                     bc_txt = info_list[2].get_text(separator=' ', strip=True).replace("入札者数（人）", "")
                                     bc = re.sub(r'[^\d]', '', bc_txt)
                                     if bc: bidder_count = int(bc)
                                     winner_type = info_list[3].get_text(separator=' ', strip=True).replace("落札者資格", "").strip()
                                            
                                raw_data_dict = {"case": case_num, "address": address_raw, "basePrice": base_price, "winningPrice": winning_price}

                                margin_rate = None
                                if winning_price and base_price and base_price > 0:
                                    margin_rate = (winning_price - base_price) / float(base_price)
                                
                                comp_level = None
                                if bidder_count is not None:
                                    if bidder_count > 10: comp_level = "高競争"
                                    elif bidder_count > 3: comp_level = "中競争"
                                    else: comp_level = "低競争"

                                lat, lng = geocode_address(address_raw)
                                if not lat: lat, lng = 42.5, 141.0 # fallback
                                
                                data = {
                                    "caseNumber": case_num,
                                    "address": address_raw,
                                    "lat": lat,
                                    "lng": lng,
                                    "basePrice": base_price,
                                    "winningPrice": winning_price,
                                    "bidderCount": bidder_count,
                                    "winnerType": winner_type,
                                    "marginRate": margin_rate,
                                    "competitionLevel": comp_level,
                                    "raw_data": json.dumps(raw_data_dict, ensure_ascii=False)
                                }
                                update_db(data)
                                
                            # Next page using getData(page_num) logic exactly as Active properties
                            total_items_loc = page.locator('span.bit__numberOfResult_totalNumber')
                            total_items = 0
                            if await total_items_loc.count() > 0:
                                total_text = await total_items_loc.first.inner_text()
                                total_items = int(total_text.replace(',', '').strip())
                            
                            total_pages = (total_items + 9) // 10 if total_items > 0 else 1
                            if page_num >= total_pages:
                                print(f"    Reached end of pagination (page {page_num}/{total_pages}).")
                                break
                                
                            page_num += 1
                            print(f"    Moving to page {page_num}...")
                            await page.wait_for_timeout(random.randint(3000, 5000))
                            async with page.expect_navigation(timeout=30000):
                                await page.evaluate(f"getData({page_num});")
                            await page.wait_for_load_state('networkidle')
                            await page.wait_for_timeout(1000)
                            
                            # Removed page limit to gather all results
                            
                        success = True
                    except Exception as e:
                        print(f"    Timeout/Error during crawl: {e}")
                        os.makedirs("../logs", exist_ok=True)
                        try:
                            await page.screenshot(path=f"../logs/error_results_{region_code}_{court_name}.png")
                        except: pass
                        retry_count += 1
                        print(f"    Retrying ({retry_count}/{max_retries})...")
                    finally:
                        await browser.close()
                        
                if success:
                    checkpoints.append(court_name)
                    with open(checkpoint_file, "w") as f:
                        json.dump(checkpoints, f)
                else:
                    print(f"    Skipping Court {court_name} after {max_retries} failures.")

if __name__ == "__main__":
    asyncio.run(scrape_results())
