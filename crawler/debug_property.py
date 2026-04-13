import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        c = await b.new_context(locale="ja-JP", accept_downloads=True)
        page = await c.new_page()

        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
        async with page.expect_navigation():
            await page.evaluate("tranAreaMap('01','property');")
        await page.locator("h1:has-text('北海道の物件を検索する')").wait_for(timeout=15000)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await page.wait_for_timeout(2000)
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")
        
        detail_link_locator = page.locator("a[onclick*='tranPropertyDetail']")
        await detail_link_locator.first.wait_for(timeout=15000)
        onclick = await detail_link_locator.first.get_attribute("onclick")
        print("Clicking:", onclick)
        
        safescript = f"window.event = {{preventDefault: function(){{}}, stopPropagation: function(){{}}}}; {onclick}"
        async with c.expect_page(timeout=10000) as new_page_info:
            await page.evaluate(safescript)
        new_page = await new_page_info.value
        await new_page.wait_for_load_state()
        
        # Take a screenshot to see if the PDF button is there!
        await new_page.screenshot(path="property_detail_debug.png", full_page=True)
        
        html = await new_page.content()
        with open("property_detail.html", "w") as f:
            f.write(html)
        
        print("Exported property_detail.html")
        await b.close()

asyncio.run(run())
