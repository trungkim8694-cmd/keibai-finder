import asyncio
import os
import re
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        c = await b.new_context(locale="ja-JP")
        page = await c.new_page()
        
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
        # Click hokkaido on map
        await page.evaluate("tranAreaMap('01','property');")
        await page.wait_for_timeout(2000)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await page.wait_for_timeout(1000)
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")
        
        detail_link_locators = page.locator("a[onclick*='tranPropertyDetail']")
        await detail_link_locators.first.wait_for(state="attached", timeout=15000)
        onclick = await detail_link_locators.first.get_attribute("onclick")
        
        safescript = f"window.event = {{preventDefault: function(){{}}, stopPropagation: function(){{}}}}; {onclick}"
        async with c.expect_page(timeout=10000) as p_info:
            await page.evaluate(safescript)
        new_page = await p_info.value
        await new_page.wait_for_load_state()
        
        html = await new_page.content()
        with open("test.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("HTML written to test.html")
        await b.close()

asyncio.run(run())
