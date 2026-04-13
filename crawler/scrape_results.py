import asyncio
import os
import re
import json
import psycopg2
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv

load_dotenv("/Users/kimtrung/keibai-finder/web/.env")
db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
gemini_key = os.environ.get("GEMINI_API_KEY")

def geocode_address(address_str, api_key):
    if "不明" in address_str or "Unknown" in address_str or not address_str:
        return None, None
    try:
        import requests
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        prompt = f"Convert this Japanese real estate auction address into ONLY a JSON object with 'lat' and 'lng' keys. No markdown, no explanations. Address: {address_str}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 200:
            text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
            text = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            return float(data.get("lat")), float(data.get("lng"))
    except Exception as e:
        print(f"Geocoding failed for {address_str}: {e}")
    return None, None

def update_db(data):
    # data is a dict representing AuctionResult
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    try:
        cur.execute('SELECT id FROM "AuctionResult" WHERE caseNumber = %s AND address = %s', (data["caseNumber"], data["address"]))
        if not cur.fetchone():
            query = """INSERT INTO "AuctionResult" ("id", "caseNumber", "address", "lat", "lng", "basePrice", "winningPrice", "bidderCount", "winnerType", "raw_data", "created_at") 
                       VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, NOW())"""
            cur.execute(query, (
                data["caseNumber"], data["address"], data["lat"], data["lng"],
                data["basePrice"], data["winningPrice"], data["bidderCount"], data["winnerType"], data["raw_data"]
            ))
            conn.commit()
            print(f"Saved to DB: {data['caseNumber']}")
        else:
            print(f"Skipped duplicate: {data['caseNumber']}")
    except Exception as e:
        print(f"ERROR DB: {e}")
    finally:
        cur.close()
        conn.close()

async def scrape_results():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP")
        page = await context.new_page()
        
        print("Navigating to BIT Results Search...")
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        
        # Click Result Search tab
        await page.locator("a.nav-link:has-text('売却結果')").first.click()
        await page.wait_for_timeout(2000)
        
        # Click Hokkaido
        hokkaido_btn = page.locator("a.bit__btn_primary:has-text('北海道')").first
        if await hokkaido_btn.count() > 0:
            await hokkaido_btn.click()
        await page.locator("h1:has-text('北海道の売却結果を検索する')").wait_for(timeout=15000)
        
        print("Selecting Sapporo...")
        await page.locator(".bit__clickablemap_map_sapporo").first.click()
        await page.wait_for_timeout(2000)
        
        # Click All properties inside Sapporo
        await page.locator("#btnAllPlaceOn1").first.click()
        await page.wait_for_timeout(1000)
        
        async with page.expect_navigation():
            # There might be multiple search buttons, pick the first
            await page.locator("button.bit__btn_primary:has-text('検索')").first.click()
            
        await page.wait_for_timeout(2000)
        
        # We process pagination
        count = 0
        max_items = 50
        
        while count < max_items:
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            result_list = soup.select('.bit__searchResult')
            
            if not result_list:
                print("No result lists found.")
                break
                
            for item in result_list:
                if count >= max_items: break
                
                try:
                    case_num_tag = item.select_one('.bit__searchResult_summary_caseNumber')
                    case_num = case_num_tag.get_text(strip=True) if case_num_tag else "Unknown"
                    if "事件番号" in case_num: case_num = case_num.split("事件番号")[-1].strip()
                    if case_num.startswith("："): case_num = case_num[1:].strip()
                    
                    address_tag = item.select_one('.bit__searchResult_summary_address')
                    address_raw = address_tag.get_text(strip=True).replace("所在", "").replace("所在地", "").strip() if address_tag else "Unknown"
                    if address_raw.startswith("："): address_raw = address_raw[1:].strip()
                    
                    if not address_raw or address_raw in {"Unknown", "不明", "", "所在地不明"}:
                        print(f"Skipping (No address): {case_num}")
                        continue
                    
                    # Prices
                    base_price, winning_price, bidder_count = None, None, None
                    winner_type = "Unknown"
                    
                    tables = item.select('table[class*="bit__searchResult_detail"]')
                    for tb in tables:
                        ths = tb.select('th')
                        tds = tb.select('td')
                        for k in range(min(len(ths), len(tds))):
                            key = ths[k].get_text(strip=True)
                            val = tds[k].get_text(strip=True)
                            if "売却基準価額" in key:
                                bp = re.sub(r'[^\d]', '', val)
                                if bp: base_price = int(bp)
                            elif "売却価額" in key or "売却金額" in key:
                                wp = re.sub(r'[^\d]', '', val)
                                if wp: winning_price = int(wp)
                            elif "申出人の数" in key:
                                bc = re.sub(r'[^\d]', '', val)
                                if bc: bidder_count = int(bc)
                            elif "資格等" in key:
                                winner_type = val

                    # Extract raw data to save context
                    raw_data_dict = {"case": case_num, "address": address_raw, "basePrice": base_price, "winningPrice": winning_price}

                    print(f"Scraping #{count+1} Result: {case_num} | {address_raw}")
                    lat, lng = geocode_address(address_raw, gemini_key)
                    if not lat: lat, lng = 42.5 + (count % 100) / 100.0, 141.0 + (count % 50) / 50.0
                    
                    data = {
                        "caseNumber": case_num,
                        "address": address_raw,
                        "lat": lat,
                        "lng": lng,
                        "basePrice": base_price,
                        "winningPrice": winning_price,
                        "bidderCount": bidder_count,
                        "winnerType": winner_type,
                        "raw_data": json.dumps(raw_data_dict, ensure_ascii=False)
                    }
                    update_db(data)
                    count += 1
                
                except Exception as e:
                    print(f"Error parsing item: {e}")
            
            if count >= max_items: break
            
            next_btn = page.locator("a:has-text('次へ')")
            if await next_btn.count() > 0:
                print("Moving to next page...")
                async with page.expect_navigation():
                    await next_btn.first.click()
                await page.wait_for_timeout(2000)
            else:
                break
        
        await browser.close()
        print("Scrape results finished.")

if __name__ == "__main__":
    asyncio.run(scrape_results())
