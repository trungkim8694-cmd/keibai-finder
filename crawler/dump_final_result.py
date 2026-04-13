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
        with open("final_result.html", "w") as f:
            f.write(html)
        
        soup = BeautifulSoup(html, 'html.parser')
        # Check some common classes to see what it uses instead of .bit__searchResult
        for cls in soup.select('[class^="bit__"]'):
            cls_attrs = cls.get('class', [])
            if any('result' in c.lower() for c in cls_attrs):
                print("Found class:", cls_attrs)
        
        await browser.close()
asyncio.run(run())
