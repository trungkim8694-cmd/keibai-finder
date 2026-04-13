import asyncio
from playwright.async_api import async_playwright
import os

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
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")
        await page.wait_for_timeout(2000)
        html = await page.content()
        with open("result.html", "w") as f:
            f.write(html)
        print("Done writing to result.html")
        await b.close()

asyncio.run(run())
