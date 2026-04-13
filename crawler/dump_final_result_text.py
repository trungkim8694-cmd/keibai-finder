import asyncio
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP")
        page = await context.new_page()
        
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        async with page.expect_navigation():
            await page.evaluate("tranArea('result','');")
        async with page.expect_navigation():
            await page.evaluate("transProperty('01');")
            
        await page.evaluate("showSearchCondition('91', '1', 'sapporo');")
        await page.wait_for_timeout(2000)
        
        async with page.expect_navigation(timeout=30000):
            await page.evaluate("submitAllPeroidForm();")
            
        await page.wait_for_load_state()
        html = await page.content()
        
        soup = BeautifulSoup(html, 'html.parser')
        
        lists = soup.select('.bit__result_InfoList')
        print(f"Found {len(lists)} result items")
        for i, item in enumerate(lists):
            # Print all text within the item
            print(f"--- Item {i} ---")
            text = item.get_text(separator=' ', strip=True)
            print(text)
            if i >= 3: break
        
        await browser.close()
asyncio.run(run())
