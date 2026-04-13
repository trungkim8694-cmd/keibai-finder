import asyncio
from playwright.async_api import async_playwright
import os

DUMP_DIR = "/Users/kimtrung/keibai-finder/.antigravity/research"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP")
        page = await context.new_page()

        print("Go to top")
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
        await page.locator("a:has-text('北海道')").first.wait_for(state="attached", timeout=15000)
        
        print("Click Hokkaido")
        await page.evaluate("tranAreaMap('01','property');")
        await page.locator("h1:has-text('北海道の物件を検索する')").wait_for(state="attached", timeout=15000)
        
        print("Wait for otherMunicipalityIdArea to be available")
        await asyncio.sleep(2)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await page.locator("#otherMunicipalityIdArea input[type='checkbox']").first.wait_for(state="attached", timeout=15000)
        
        print("Select all and search")
        await asyncio.sleep(1)
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")
        
        print("Clicking first property detail")
        detail_link_locator = page.locator("a[onclick*='tranPropertyDetail']")
        await detail_link_locator.first.wait_for(state="attached", timeout=15000)
        
        try:
            # Let's try both expect_page and expect_navigation 
            # In BIT, tranPropertyDetail usually does a POST and changes the SAME page
            async with page.expect_navigation(timeout=15000):
                await detail_link_locator.first.click()
            
            await page.wait_for_load_state()
            detail_html = await page.content()
            with open(os.path.join(DUMP_DIR, "real_detail_dump.html"), "w", encoding="utf-8") as f:
                f.write(detail_html)
            print("Successfully scraped detail page.")
        except Exception as e:
            print("Failed to click and get detail page:", e)
            print("Trying fallback with expect_page...")
            try:
                # maybe its new window
                async with context.expect_page(timeout=10000) as new_page_info:
                    await detail_link_locator.first.click()
                new_page = await new_page_info.value
                await new_page.wait_for_load_state()
                detail_html = await new_page.content()
                with open(os.path.join(DUMP_DIR, "real_detail_dump.html"), "w", encoding="utf-8") as f:
                    f.write(detail_html)
                print("Successfully scraped detail page from a new tab.")
            except Exception as e2:
                print("Fallback also failed:", e2)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
