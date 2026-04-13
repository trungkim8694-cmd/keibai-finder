import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        c = await b.new_context(locale="ja-JP")
        page = await c.new_page()
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        await page.evaluate("tranAreaMap('01','result');")
        await asyncio.sleep(3)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await asyncio.sleep(2)
        html = await page.content()
        with open("h02.html", "w") as f:
            f.write(html)
        print("Done writing to h02.html")
        await b.close()

asyncio.run(run())
