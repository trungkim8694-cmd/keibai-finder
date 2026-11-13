import asyncio
import os
import re
import json
import psycopg2
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from datetime import datetime

# Database connection
db_url = os.environ.get("DATABASE_URL", "postgresql://keibai_user:kK_5f%23J9!Lp2_db@163.44.116.98:5432/keibai_finder_db").split("?")[0]

def parse_japanese_date(date_str):
    if not date_str:
        return None
    m = re.search(r'令和\s*(\d+)年\s*(\d+)月\s*(\d+)日', str(date_str))
    if m:
        return datetime(2018 + int(m.group(1)), int(m.group(2)), int(m.group(3)))
    m = re.search(r'平成\s*(\d+)年\s*(\d+)月\s*(\d+)日', str(date_str))
    if m:
        return datetime(1988 + int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None

def update_record_date(case_number, address_raw, completion_date):
    if not completion_date:
        return False
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    try:
        # Match by caseNumber or caseNumber and address substring
        cur.execute('''
            UPDATE "AuctionResult"
            SET "completionDate" = %s
            WHERE "caseNumber" = %s AND "completionDate" IS NULL
        ''', (completion_date, case_number))
        updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception as e:
        print(f"DB Error: {e}")
        return False
    finally:
        cur.close()
        conn.close()

async def backfill_dates_for_region(region_code="03"):
    print(f"\n--- Scanning Region {region_code} for Bid Opening Dates ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP")
        page = await context.new_page()
        
        try:
            await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
            await page.wait_for_load_state('domcontentloaded')
            await page.wait_for_function('typeof tranArea !== "undefined"', timeout=15000)
            
            async with page.expect_navigation(timeout=30000):
                await page.evaluate("tranArea('result','');")
            async with page.expect_navigation(timeout=30000):
                await page.evaluate(f"transProperty('{region_code}');")
            
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
            
            print(f"Found {len(court_args)} courts in Region {region_code}")
            
            for args in court_args[:3]: # Sample courts
                court_name = args[2] if len(args) > 2 else "Court"
                print(f"\nScanning Court: {court_name}")
                
                await page.evaluate(f"showSearchCondition('{args[0]}', '{args[1]}', '{args[2]}');")
                await page.wait_for_timeout(2000)
                
                periods = await page.evaluate('''() => {
                    const sel = document.getElementById('tenderDateSelect');
                    if (!sel || sel.options.length === 0) return [];
                    return Array.from(sel.options).map(o => ({ value: o.value, text: o.text.trim() }));
                }''')
                
                print(f"  Available Periods: {[p['text'] for p in periods]}")
                
                for period in periods:
                    dt = parse_japanese_date(period['text'])
                    if not dt:
                        continue
                    
                    # Select option and submit
                    await page.evaluate(f'''() => {{
                        const sel = document.getElementById('tenderDateSelect');
                        sel.value = '{period["value"]}';
                        sel.dispatchEvent(new Event('change'));
                    }}''')
                    
                    try:
                        async with page.expect_navigation(timeout=20000):
                            await page.evaluate("submitPeroidForm();")
                        await page.wait_for_load_state()
                        
                        res_html = await page.content()
                        res_soup = BeautifulSoup(res_html, 'html.parser')
                        items = [r for r in res_soup.select('.bit__currentSearchCondition_regionBox') if '物件番号' in r.get_text()]
                        
                        match_count = 0
                        for it in items:
                            case_tag = it.select_one('.bit__currentSearchCondition_regionHeader p.font-weight-bold')
                            case_num = case_tag.get_text(strip=True) if case_tag else None
                            if case_num:
                                if update_record_date(case_num, "", dt):
                                    match_count += 1
                                    print(f"    ✓ Updated {case_num} -> {dt.strftime('%Y-%m-%d')}")
                                    
                        print(f"  Period {period['text']}: {len(items)} items on BIT, {match_count} matched and updated in DB")
                        
                        # Go back to search condition
                        await page.evaluate(f"showSearchCondition('{args[0]}', '{args[1]}', '{args[2]}');")
                        await page.wait_for_timeout(1500)
                    except Exception as e:
                        print(f"    Error processing period {period['text']}: {e}")
                        break

        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(backfill_dates_for_region("03")) # Kanto

