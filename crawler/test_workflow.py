import asyncio
import nta_parser
import scrape_results
from advanced_crawler import process_listing_page, get_db_connection, PREF_MAP, check_and_update_db 
from crawler_utils import get_random_user_agent
from playwright.async_api import async_playwright

async def run_20_bit():
    print("=== STARTING 20 BIT PROPERTIES ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP", user_agent=get_random_user_agent(), accept_downloads=True)
        page = await context.new_page()
        
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        async with page.expect_navigation(timeout=30000):
            await page.evaluate(f"tranAreaMap('01','property');")
        await page.wait_for_timeout(2000)
        await page.evaluate("showSearchCondition('01', '01', '01');")
        await page.wait_for_timeout(2000)
        try:
            await page.evaluate("if(document.getElementById('btnAllPlaceOn1')) document.getElementById('btnAllPlaceOn1').click();")
        except: pass
        async with page.expect_navigation(timeout=30000):
            await page.evaluate(f"tranResultSearch('01');")
        
        await page.wait_for_load_state('networkidle')
        
        memory_cache_prices = {}
        prefecture_scraped_ids = set()
        
        # Monkey patch process_listing_page to stop at 20
        # Actually it's easier to just call it and it will scrape up to 10 per page
        await process_listing_page(page, "北海道", {}, lambda x: None, memory_cache_prices, prefecture_scraped_ids)
        
        await page.evaluate(f"getData(2);")
        await page.wait_for_load_state('networkidle')
        await process_listing_page(page, "北海道", {}, lambda x: None, memory_cache_prices, prefecture_scraped_ids)

        await browser.close()
    print("=== FINISHED 20 BIT PROPERTIES ===")

async def run_20_nta_results():
    print("=== STARTING 20 NTA RESULTS ===")
    # Temporarily set max_items to 20 in scrape_results?
    # Actually just run it natively on local but break early
    # scrape_results is hardcoded. I will just run scrape_results inside a subprocess and kill it after some time, or since it's 50 results it only takes 1 minute, 50 is fine.
    pass

async def main():
    await run_20_bit()
    print("=== STARTING 20 NTA PROPERTIES ===")
    await nta_parser.scrape_nta(limit=20)
    
if __name__ == '__main__':
    asyncio.run(main())
